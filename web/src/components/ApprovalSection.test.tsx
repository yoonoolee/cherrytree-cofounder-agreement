import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ADMIN_ID, MEMBER_ID, makeProject, timestamp } from '../test/fixtures/project.ts';
import ApprovalSection from './ApprovalSection.tsx';

const mocks = vi.hoisted(() => ({
  updateDoc: vi.fn(),
  user: { currentUser: { id: 'user_admin' } as { id: string } | null, loading: false },
}));

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => ({ path: `${collection}/${id}` }),
  updateDoc: mocks.updateDoc,
}));
vi.mock('../lib/firebase', () => ({
  db: {},
  projectRef: (id: string) => ({ path: `projects/${id}` }),
}));
vi.mock('../contexts/UserContext', () => ({ useUser: () => mocks.user }));

const PROJECT_ID = 'org_1';

beforeEach(() => {
  mocks.updateDoc.mockReset().mockResolvedValue(undefined);
  mocks.user = { currentUser: { id: ADMIN_ID }, loading: false };
});

describe('ApprovalSection', () => {
  it('renders nothing while the user is loading or missing', () => {
    mocks.user = { currentUser: null, loading: true };
    const { container, rerender } = render(
      <ApprovalSection project={makeProject()} projectId={PROJECT_ID} />,
    );
    expect(container).toBeEmptyDOMElement();
    mocks.user = { currentUser: null, loading: false };
    rerender(<ApprovalSection project={makeProject()} projectId={PROJECT_ID} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing once the project is read-only', () => {
    const project = makeProject({
      editDeadline: timestamp('2020-01-01T00:00:00Z'),
      pdfAgreements: [
        { url: 'x', generatedAt: timestamp('2020-01-02T00:00:00Z'), generatedBy: ADMIN_ID },
      ],
    });
    const { container } = render(<ApprovalSection project={project} projectId={PROJECT_ID} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('asks for collaborators when the admin is alone', () => {
    const project = makeProject();
    delete project.collaborators[MEMBER_ID];
    render(<ApprovalSection project={project} projectId={PROJECT_ID} />);
    expect(
      screen.getByText('Add collaborators to enable the approval system.'),
    ).toBeInTheDocument();
  });

  it('lists every collaborator with their status and the admin tag', () => {
    render(
      <ApprovalSection
        project={makeProject({ approvals: { [MEMBER_ID]: true } })}
        projectId={PROJECT_ID}
      />,
    );
    expect(screen.getByText('1 of 2 cofounders approved')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace').parentElement).toHaveTextContent('(Admin)');
    expect(screen.getByText('Grace Hopper').parentElement).not.toHaveTextContent('(Admin)');
    expect(screen.getAllByText('Pending')).toHaveLength(1);
    expect(screen.getAllByText('Approved')).toHaveLength(1);
    expect(
      screen.getByText('You cannot submit until all cofounders approve (1/2).'),
    ).toBeInTheDocument();
  });

  it('writes the whole approvals map with the current user toggled on', async () => {
    render(
      <ApprovalSection
        project={makeProject({ approvals: { [MEMBER_ID]: true } })}
        projectId={PROJECT_ID}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Approve Survey' }));
    await waitFor(() => expect(mocks.updateDoc).toHaveBeenCalledTimes(1));
    expect(mocks.updateDoc).toHaveBeenCalledWith(
      { path: `projects/${PROJECT_ID}` },
      { approvals: { [MEMBER_ID]: true, [ADMIN_ID]: true } },
    );
  });

  it('revokes by writing the current user as false', async () => {
    render(
      <ApprovalSection
        project={makeProject({ approvals: { [ADMIN_ID]: true, [MEMBER_ID]: true } })}
        projectId={PROJECT_ID}
      />,
    );
    expect(
      screen.getByText('All cofounders have approved. You can now submit.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Revoke My Approval' }));
    await waitFor(() => expect(mocks.updateDoc).toHaveBeenCalledTimes(1));
    expect(mocks.updateDoc.mock.calls[0]![1]).toEqual({
      approvals: { [ADMIN_ID]: false, [MEMBER_ID]: true },
    });
  });

  it('warns that approvals were reset after an edit', () => {
    render(
      <ApprovalSection
        project={makeProject({ lastEditedBy: 'ada@example.com', approvals: {} })}
        projectId={PROJECT_ID}
      />,
    );
    expect(screen.getByText(/All approvals have been reset/)).toBeInTheDocument();
  });

  it('reports a failed write with the error message', async () => {
    mocks.updateDoc.mockRejectedValueOnce(new Error('permission-denied'));
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ApprovalSection project={makeProject()} projectId={PROJECT_ID} />);
    fireEvent.click(screen.getByRole('button', { name: 'Approve Survey' }));
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith('Failed to update approval status: permission-denied'),
    );
    alert.mockRestore();
    consoleError.mockRestore();
  });
});
