import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import ProjectPage from './ProjectPage.tsx';

const mocks = vi.hoisted(() => ({
  updateDoc: vi.fn(),
  SERVER_TIMESTAMP: { kind: 'serverTimestamp' },
}));

vi.mock('firebase/firestore', () => ({
  updateDoc: mocks.updateDoc,
  serverTimestamp: () => mocks.SERVER_TIMESTAMP,
}));
vi.mock('../lib/firebase', () => ({
  projectRef: (id: string) => ({ path: `projects/${id}` }),
}));

function renderPage(projectId = 'org_1') {
  return render(
    <MemoryRouter initialEntries={[`/projects/${projectId}`]}>
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.updateDoc.mockReset().mockResolvedValue(undefined);
});

describe('ProjectPage', () => {
  it('stamps lastOpened on the project in the URL', () => {
    renderPage('org_42');
    expect(mocks.updateDoc).toHaveBeenCalledWith(
      { path: 'projects/org_42' },
      { lastOpened: mocks.SERVER_TIMESTAMP },
    );
  });

  it('logs a failed lastOpened write and still renders', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.updateDoc.mockRejectedValue(new Error('permission-denied'));
    renderPage();
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    await vi.waitFor(() => expect(error).toHaveBeenCalled());
    error.mockRestore();
  });
});
