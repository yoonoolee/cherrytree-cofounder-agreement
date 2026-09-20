import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { UserContext, useUser, type UserContextValue } from './useUser.ts';

describe('useUser', () => {
  it('throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useUser())).toThrow('useUser must be used within UserProvider');
  });

  it('returns the value supplied through UserContext', () => {
    const value = { loading: false, displayName: 'Ada' } as UserContextValue;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current).toBe(value);
  });
});
