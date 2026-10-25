import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { useProjectId } from './useProjectId.ts';

function wrapperFor(url: string, path: string) {
  return ({ children }: { children: React.ReactNode }) =>
    createElement(
      MemoryRouter,
      { initialEntries: [url] },
      createElement(Routes, null, createElement(Route, { path, element: children })),
    );
}

describe('useProjectId', () => {
  it('returns the parameter from the matched route', () => {
    const { result } = renderHook(() => useProjectId(), {
      wrapper: wrapperFor('/projects/org_42', '/projects/:projectId'),
    });
    expect(result.current).toBe('org_42');
  });

  it('throws on a route without the parameter', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      renderHook(() => useProjectId(), { wrapper: wrapperFor('/dashboard', '/dashboard') }),
    ).toThrow('Route has no :projectId parameter');
    error.mockRestore();
  });
});
