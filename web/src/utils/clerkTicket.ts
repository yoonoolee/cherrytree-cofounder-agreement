/**
 * Clerk's invitation ticket travels as this query parameter; SignIn/SignUp consume it, and
 * the auth pages forward it when the user switches between them.
 */
export const CLERK_TICKET_PARAM = '__clerk_ticket';

/** `path` with the ticket appended when there is one. */
export function withClerkTicket(path: string, ticket: string | null): string {
  return ticket ? `${path}?${CLERK_TICKET_PARAM}=${encodeURIComponent(ticket)}` : path;
}
