import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import ProjectPage from './ProjectPage.tsx';
import type { ProjectData } from '../hooks/useProject.ts';
import { makeProject } from '../test/fixtures/project.ts';

const mocks = vi.hoisted(() => ({
  updateDoc: vi.fn(),
  SERVER_TIMESTAMP: { kind: 'serverTimestamp' },
  project: { status: 'loading' } as ProjectData,
  user: { loading: false, authFailed: false, retryAuth: vi.fn() },
}));

vi.mock('firebase/firestore', () => ({
  updateDoc: mocks.updateDoc,
  serverTimestamp: () => mocks.SERVER_TIMESTAMP,
}));
vi.mock('../lib/firebase', () => ({
  projectRef: (id: string) => ({ path: `projects/${id}` }),
}));
vi.mock('../hooks/useProject.ts', () => ({ useProject: () => mocks.project }));
vi.mock('../hooks/useUser.ts', () => ({ useUser: () => mocks.user }));
vi.mock('../components/advisor/AdvisorView.tsx', () => ({
  default: ({ projectId }: { projectId: string }) => <div data-testid="advisor">{projectId}</div>,
}));
vi.mock('../components/editor/DraftView.tsx', () => ({
  default: ({ projectId }: { projectId: string }) => <div data-testid="editor">{projectId}</div>,
}));
vi.mock('../components/draft/DraftStatusView.tsx', () => ({
  default: ({ status }: { status: string }) => <div data-testid="draft">{status}</div>,
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
  mocks.project = { status: 'ready', project: makeProject() };
  mocks.user = { loading: false, authFailed: false, retryAuth: vi.fn() };
});

describe('ProjectPage', () => {
  it('stamps lastOpened on the project in the URL and opens its Advisor', () => {
    renderPage('org_42');
    expect(mocks.updateDoc).toHaveBeenCalledWith(
      { path: 'projects/org_42' },
      { lastOpened: mocks.SERVER_TIMESTAMP },
    );
    expect(screen.getByTestId('advisor')).toHaveTextContent('org_42');
  });

  it('opens the editor once the draft is ready', async () => {
    mocks.project = { status: 'ready', project: makeProject({ draftStatus: 'ready' }) };
    renderPage('org_7');
    expect(await screen.findByTestId('editor')).toHaveTextContent('org_7');
  });

  it('shows the draft status once drafting has started', () => {
    mocks.project = { status: 'ready', project: makeProject({ draftStatus: 'reviewing' }) };
    renderPage();
    expect(screen.queryByTestId('advisor')).toBeNull();
    expect(screen.getByTestId('draft')).toHaveTextContent('reviewing');
  });

  it('holds a loading skeleton until signed in, and reads nothing before', () => {
    mocks.user = { ...mocks.user, loading: true };
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(mocks.updateDoc).not.toHaveBeenCalled();
  });

  it('offers a retry when signing in fails', () => {
    mocks.user = { ...mocks.user, authFailed: true };
    renderPage();
    expect(screen.getByRole('heading', { name: "We couldn't sign you in." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(mocks.user.retryAuth).toHaveBeenCalled();
  });

  it('shows the skeleton while the project loads, then a retry if it fails', () => {
    mocks.project = { status: 'loading' };
    const { unmount } = renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    unmount();

    const retry = vi.fn();
    mocks.project = { status: 'error', missing: false, retry };
    renderPage();
    expect(
      screen.getByRole('heading', { name: "We couldn't load this project." }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });

  it('says when the project does not exist, with only the way back', () => {
    mocks.project = { status: 'error', missing: true, retry: vi.fn() };
    renderPage();
    expect(
      screen.getByRole('heading', { name: "We couldn't find this project." }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });

  it('logs a failed lastOpened write and still renders', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.updateDoc.mockRejectedValue(new Error('permission-denied'));
    renderPage();
    expect(screen.getByTestId('advisor')).toBeInTheDocument();
    await vi.waitFor(() => expect(error).toHaveBeenCalled());
    error.mockRestore();
  });
});
