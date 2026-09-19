import { CLERK_TICKET_PARAM, withClerkTicket } from './clerkTicket.ts';

describe('withClerkTicket', () => {
  it('returns the path alone without a ticket', () => {
    expect(withClerkTicket('/login', null)).toBe('/login');
    expect(withClerkTicket('/signup', '')).toBe('/signup');
  });

  it('appends the ticket under the Clerk parameter', () => {
    expect(withClerkTicket('/login', 'abc.def-ghi_jkl')).toBe(
      '/login?__clerk_ticket=abc.def-ghi_jkl',
    );
    expect(CLERK_TICKET_PARAM).toBe('__clerk_ticket');
  });

  it('encodes a ticket that is not URL-safe', () => {
    expect(withClerkTicket('/signup', 'a b&c')).toBe('/signup?__clerk_ticket=a%20b%26c');
  });
});
