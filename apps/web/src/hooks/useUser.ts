import { createContext, useContext } from 'react';
import type {
  useUser as useClerkUser,
  useOrganizationList as UseOrganizationList,
} from '@clerk/react';
import type { UserDoc } from '@cherrytree/shared';

/** The signed-in Clerk user, as `useUser` from Clerk exposes it. */
export type ClerkUser = NonNullable<ReturnType<typeof useClerkUser>['user']>;

type OrganizationListValue = ReturnType<
  typeof UseOrganizationList<{ userMemberships: { infinite: true } }>
>;

export interface UserContextValue {
  currentUser: ClerkUser | null | undefined;
  /** `users/{clerkUserId}`, kept in sync by the Clerk webhook; `null` until it exists. */
  userProfile: UserDoc | null;
  /** True until Clerk has loaded, the Firebase session is established and the profile read. */
  loading: boolean;
  /** Account name, else the email local part, else "User". */
  displayName: string;
  // Organization data (fetched once, shared everywhere)
  userMemberships: OrganizationListValue['userMemberships'];
  setActive: OrganizationListValue['setActive'];
  orgsLoaded: boolean;
}

/** Provided by `UserProvider` (contexts/UserContext.tsx); read it through `useUser`. */
export const UserContext = createContext<UserContextValue | null>(null);

export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
