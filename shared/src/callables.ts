/**
 * Request/response contracts of the `onCall` Cloud Functions, keyed by function name.
 * Callers are identified by their Firebase session (`request.auth`), which the web app obtains
 * through `getFirebaseToken` — the only callable that takes a Clerk session token in the body.
 */
import type { Plan } from './domain/project.ts';

export interface CallableMap {
  getFirebaseToken: {
    request: { sessionToken: string };
    response: { firebaseToken: string; userId: string };
  };
  submitSurvey: {
    request: { projectId: string };
    response: { success: true; message: string; pdfUrl: string | null };
  };
  generatePreviewPDF: {
    request: { projectId: string };
    response: { success: true; pdfUrl: string | null };
  };
  createCheckoutSession: {
    /** The price and redirect URLs are server-side configuration keyed by `plan`. */
    request: { plan: Plan; projectName: string };
    response: { sessionId: string; url: string | null };
  };
  sendContactMessage: {
    request: { name: string; email: string; message: string };
    response: { success: true };
  };
  createOrganizationInvitation: {
    /** Invitees always join as `org:member`; the redirect URL is server-side configuration. */
    request: { emailAddress: string; organizationId: string };
    response: { success: true; invitationId: string; redirectUrl: string };
  };
  removeOrganizationMember: {
    request: { userId: string; organizationId: string };
    response: { success: true };
  };
}

export type CallableName = keyof CallableMap;
export type CallableRequest<K extends CallableName> = CallableMap[K]['request'];
export type CallableResponse<K extends CallableName> = CallableMap[K]['response'];
