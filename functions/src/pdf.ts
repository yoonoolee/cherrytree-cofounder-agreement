/**
 * PDF generation. Both callables POST the merged survey data to the Make.com webhook, which
 * renders the agreement and returns a URL; the URL is stored only if it points at a trusted host.
 */
import axios from 'axios';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import {
  mergeOtherFields,
  type CallableRequest as CallableData,
  type CallableResponse,
  type Project,
} from '@cherrytree/shared';

import {
  CALLABLE_OPTIONS,
  MAKE_WEBHOOK_TIMEOUT_MS,
  MAKE_WEBHOOK_URL,
  PDF_ALLOWED_DOMAINS,
} from './config.ts';
import { requireAuth } from './lib/auth.ts';
import { toHttpsError } from './lib/errors.ts';
import { projects } from './lib/firebase.ts';
import { escapeHtml, isValidTrustedUrl } from './lib/validation.ts';

/** Body of the Make.com request. `projectName` is HTML-escaped here, at the rendering boundary. */
export interface PdfWebhookPayload {
  projectId: string;
  projectName: string;
  submittedAt?: string;
  isPreview?: true;
  data: Record<string, unknown>;
}

export function buildPdfPayload(
  projectId: string,
  project: Project,
  options: { submittedAt?: Date; isPreview?: boolean } = {},
): PdfWebhookPayload {
  return {
    projectId,
    projectName: escapeHtml(project.name),
    ...(options.submittedAt && { submittedAt: options.submittedAt.toISOString() }),
    ...(options.isPreview && { isPreview: true }),
    // "Other" selections are merged into their parent field for the PDF only.
    data: mergeOtherFields(project.surveyData ?? {}),
  };
}

/** Posts to Make.com and returns the PDF URL, `null` when the response has none. */
async function requestPdf(payload: PdfWebhookPayload): Promise<string | null> {
  const response = await axios.post<{ pdfUrl?: unknown }>(MAKE_WEBHOOK_URL.value(), payload, {
    timeout: MAKE_WEBHOOK_TIMEOUT_MS,
  });

  const pdfUrl = response.data?.pdfUrl;
  if (!pdfUrl) return null;

  if (!isValidTrustedUrl(pdfUrl, PDF_ALLOWED_DOMAINS)) {
    throw toHttpsError(
      new Error(`Invalid or untrusted PDF URL from Make.com: ${JSON.stringify(pdfUrl)}`),
      'Invalid or untrusted PDF URL from Make.com:',
      'Invalid PDF URL received from external service',
    );
  }
  return pdfUrl;
}

async function loadProject(
  projectId: string,
): Promise<{ ref: DocumentReference<Project>; project: Project }> {
  const ref = projects.doc(projectId);
  const snapshot = await ref.get();
  const project = snapshot.data();
  if (!snapshot.exists || !project) {
    throw new HttpsError('not-found', 'Project not found');
  }
  return { ref, project };
}

function requireProjectId(request: CallableRequest<{ projectId?: unknown }>): string {
  const { projectId } = request.data ?? {};
  if (typeof projectId !== 'string' || !projectId) {
    throw new HttpsError('invalid-argument', 'Project ID is required');
  }
  return projectId;
}

/** A collaborator whose latest membership period is still open. */
function isActiveCollaborator(project: Project, userId: string): boolean {
  return project.collaborators?.[userId]?.history?.some((entry) => entry.endAt === null) ?? false;
}

/** Generates the final agreement PDF and records it on the project. Admin only. */
export const submitSurvey = onCall(
  { ...CALLABLE_OPTIONS, secrets: [MAKE_WEBHOOK_URL] },
  async (
    request: CallableRequest<CallableData<'submitSurvey'>>,
  ): Promise<CallableResponse<'submitSurvey'>> => {
    const userId = requireAuth(request);
    const projectId = requireProjectId(request);

    try {
      const { ref, project } = await loadProject(projectId);

      if (project.admin !== userId) {
        throw new HttpsError('permission-denied', 'Only the project admin can submit');
      }

      // Read-only status is derived client-side from editDeadline + pdfAgreements.length,
      // so repeated submissions before the deadline are allowed.
      const submissionTime = new Date();
      const pdfUrl = await requestPdf(
        buildPdfPayload(projectId, project, { submittedAt: submissionTime }),
      );

      if (pdfUrl) {
        await ref.update({
          pdfAgreements: FieldValue.arrayUnion({
            url: pdfUrl,
            generatedAt: submissionTime,
            generatedBy: userId,
          }),
          latestPdfUrl: pdfUrl,
        });
      }

      return { success: true, message: 'Survey submitted successfully', pdfUrl };
    } catch (error) {
      throw toHttpsError(
        error,
        'Error submitting survey:',
        'An error occurred while submitting the survey',
      );
    }
  },
);

/** Generates (or returns a still-fresh) preview PDF. Any active collaborator. */
export const generatePreviewPDF = onCall(
  { ...CALLABLE_OPTIONS, secrets: [MAKE_WEBHOOK_URL] },
  async (
    request: CallableRequest<CallableData<'generatePreviewPDF'>>,
  ): Promise<CallableResponse<'generatePreviewPDF'>> => {
    const userId = requireAuth(request);
    const projectId = requireProjectId(request);

    try {
      const { ref, project } = await loadProject(projectId);

      if (!isActiveCollaborator(project, userId)) {
        throw new HttpsError('permission-denied', 'No access to this project');
      }

      // Reuse the last preview if nothing changed since it was generated.
      if (project.previewPdfUrl && project.previewPdfGeneratedAt) {
        const generatedAt = project.previewPdfGeneratedAt.toDate();
        const lastUpdated = project.lastUpdated?.toDate() ?? new Date(0);
        if (generatedAt > lastUpdated) {
          return { success: true, pdfUrl: project.previewPdfUrl };
        }
      }

      const pdfUrl = await requestPdf(buildPdfPayload(projectId, project, { isPreview: true }));

      if (pdfUrl) {
        await ref.update({
          previewPdfUrl: pdfUrl,
          previewPdfGeneratedAt: FieldValue.serverTimestamp(),
        });
      }

      return { success: true, pdfUrl };
    } catch (error) {
      throw toHttpsError(
        error,
        'Error generating preview PDF:',
        'An error occurred while generating the preview',
      );
    }
  },
);
