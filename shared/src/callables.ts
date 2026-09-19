/**
 * Request/response contracts of the `onCall` Cloud Functions, keyed by function name.
 * `sessionToken` is the Clerk session JWT the server verifies (see docs/REFACTOR_PLAN.md for
 * why it travels in the body rather than `Authorization`).
 */
import type { Plan } from './domain/project.ts';

export interface CallableMap {
  getFirebaseToken: {
    request: { sessionToken: string };
    response: { firebaseToken: string; userId: string };
  };
  submitSurvey: {
    request: { sessionToken: string; projectId: string };
    response: { success: true; message: string; pdfUrl: string | null };
  };
  generatePreviewPDF: {
    request: { sessionToken: string; projectId: string };
    response: { success: true; pdfUrl: string | null };
  };
  createCheckoutSession: {
    request: {
      sessionToken: string;
      priceId: string;
      plan: Plan;
      projectName: string;
      successUrl?: string;
      cancelUrl?: string;
    };
    response: { sessionId: string; url: string | null };
  };
  sendContactMessage: {
    request: { name: string; email: string; message: string };
    response: { success: true };
  };
  createOrganizationInvitation: {
    request: { sessionToken: string; emailAddress: string; organizationId: string; role?: string };
    response: { success: true; invitationId: string; redirectUrl: string };
  };
  removeOrganizationMember: {
    request: { sessionToken: string; userId: string; organizationId: string };
    response: { success: true };
  };
}

export type CallableName = keyof CallableMap;
export type CallableRequest<K extends CallableName> = CallableMap[K]['request'];
export type CallableResponse<K extends CallableName> = CallableMap[K]['response'];
