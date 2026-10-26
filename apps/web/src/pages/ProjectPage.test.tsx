import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import ProjectPage from './ProjectPage.tsx';
import type { ProjectData } from '../hooks/useProject.ts';
import { makeProject } from '../test/fixtures/project.ts';

const mocks = vi.hoisted(() => ({
  updateDoc: vi.fn(),
  SERVER_TIMESTAMP: { kind: 'serverTimestamp' },
  project: { status: 'loading' } as ProjectData,
}));

vi.mock('firebase/firestore', () => ({
  updateDoc: mocks.updateDoc,
  serverTimestamp: () => mocks.SERVER_TIMESTAMP,
}));
vi.mock('../lib/firebase', () => ({
  projectRef: (id: string) => ({ path: `projects/${id}` }),
}));
vi.mock('../hooks/useProject.ts', () => ({ useProject: () => mocks.project }));
vi.mock('../components/advisor/AdvisorView.tsx', () => ({
  default: ({ projectId }: { projectId: string }) => <div data-testid="advisor">{projectId}</div>,
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

  it('shows the draft status once drafting has started', () => {
    mocks.project = { status: 'ready', project: makeProject({ draftStatus: 'reviewing' }) };
    renderPage();
    expect(screen.queryByTestId('advisor')).toBeNull();
    expect(screen.getByTestId('draft')).toHaveTextContent('reviewing');
  });

  it('waits for the project, and says when it cannot be loaded', () => {
    mocks.project = { status: 'loading' };
    const { rerender } = renderPage();
    expect(screen.getByText('Loading your project…')).toBeInTheDocument();
    mocks.project = { status: 'error' };
    rerender(
      <MemoryRouter initialEntries={['/projects/org_1']}>
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("We couldn't load this project.")).toBeInTheDocument();
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
