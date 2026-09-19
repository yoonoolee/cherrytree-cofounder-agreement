import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ADMIN_ID, MEMBER_ID, makeProject, timestamp } from '../test/fixtures/project.ts';
import CollaboratorManager from './CollaboratorManager.tsx';

const ORG_ID = 'org_1';

const mocks = vi.hoisted(() => ({
  callFunction: vi.fn(),
  org: {} as Record<string, unknown>,
}));

vi.mock('@clerk/clerk-react', () => ({ useOrganization: () => mocks.org }));
vi.mock('../lib/functions', () => ({ callFunction: mocks.callFunction }));

const member = (userId: string, identifier: string, role = 'org:member') => ({
  id: `mem_${userId}`,
  role,
  publicUserData: { userId, identifier },
});

function setOrg(overrides: Record<string, unknown> = {}) {
  mocks.org = {
    organization: { id: ORG_ID },
    membership: { role: 'org:admin', publicUserData: { userId: ADMIN_ID } },
    memberships: {
      data: [
        member(ADMIN_ID, 'ada@example.com', 'org:admin'),
        member(MEMBER_ID, 'grace@example.com'),
      ],
      revalidate: vi.fn().mockResolvedValue(undefined),
    },
    invitations: { data: [], revalidate: vi.fn().mockResolvedValue(undefined) },
    ...overrides,
  };
}

// The fixture's deadline is already in the past; collaborators can only change before it.
const project = { ...makeProject({ editDeadline: timestamp('2999-01-01T00:00:00Z') }), id: ORG_ID };

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mocks.callFunction.mockReset().mockResolvedValue({ success: true });
  setOrg();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CollaboratorManager', () => {
  it('asks to switch organizations when the active org is not the project', () => {
    setOrg({ organization: { id: 'org_other' } });
    render(<CollaboratorManager project={project} />);
    expect(
      screen.getByText("Please switch to this project's organization to manage members."),
    ).toBeInTheDocument();
  });

  it('lists members with their role and lets the admin remove non-admins', async () => {
    render(<CollaboratorManager project={project} />);
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('grace@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('member')).toBeInTheDocument();

    let finishRemoval: (value: unknown) => void = () => {};
    mocks.callFunction.mockImplementationOnce(
      () => new Promise((resolve) => (finishRemoval = resolve)),
    );
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    expect(removeButtons).toHaveLength(1); // never the admin
    fireEvent.click(removeButtons[0]!);
    expect(await screen.findByRole('button', { name: 'Removing...' })).toBeDisabled();
    finishRemoval({ success: true });
    await waitFor(() => expect(mocks.callFunction).toHaveBeenCalledTimes(1));
    expect(mocks.callFunction).toHaveBeenCalledWith('removeOrganizationMember', {
      userId: MEMBER_ID,
      organizationId: ORG_ID,
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove' })).toBeEnabled());
    expect((mocks.org.memberships as { revalidate: () => void }).revalidate).toHaveBeenCalled();
  });

  it('hides the invite form and remove buttons from non-admins', () => {
    setOrg({ membership: { role: 'org:member', publicUserData: { userId: MEMBER_ID } } });
    render(<CollaboratorManager project={project} />);
    expect(screen.queryByPlaceholderText('cofounder@company.com')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
  });

  it('invites by email, then clears the field and shows a success note for 10 s', async () => {
    render(<CollaboratorManager project={project} />);
    const email = screen.getByPlaceholderText('cofounder@company.com');
    fireEvent.change(email, { target: { value: 'linus@example.com' } });
    fireEvent.submit(email.closest('form')!);
    await waitFor(() => expect(mocks.callFunction).toHaveBeenCalledTimes(1));
    expect(mocks.callFunction).toHaveBeenCalledWith('createOrganizationInvitation', {
      emailAddress: 'linus@example.com',
      organizationId: ORG_ID,
    });
    expect(await screen.findByText(/An invitation has been sent/)).toBeInTheDocument();
    expect(email).toHaveValue('');
    vi.advanceTimersByTime(10000);
    await waitFor(() => expect(screen.queryByText(/An invitation has been sent/)).toBeNull());
  });

  it('shows the callable error when an invitation fails', async () => {
    mocks.callFunction.mockRejectedValueOnce(new Error('Already a member'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<CollaboratorManager project={project} />);
    const email = screen.getByPlaceholderText('cofounder@company.com');
    fireEvent.change(email, { target: { value: 'grace@example.com' } });
    fireEvent.submit(email.closest('form')!);
    expect(await screen.findByText('Already a member')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invite' })).toBeEnabled();
    consoleError.mockRestore();
  });

  it('lists pending invitations for the admin and revokes them through Clerk', async () => {
    const revoke = vi.fn().mockResolvedValue(undefined);
    setOrg({
      invitations: {
        data: [{ id: 'inv_1', emailAddress: 'linus@example.com', role: 'org:member', revoke }],
        revalidate: vi.fn().mockResolvedValue(undefined),
      },
    });
    render(<CollaboratorManager project={project} />);
    expect(screen.getByText('linus@example.com')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Remove' });
    fireEvent.click(buttons[1]!);
    await waitFor(() => expect(revoke).toHaveBeenCalledTimes(1));
    expect(mocks.callFunction).not.toHaveBeenCalled();
  });

  it('disables inviting and removing once the edit window has passed', () => {
    render(
      <CollaboratorManager
        project={{ ...project, editDeadline: timestamp('2020-01-01T00:00:00Z') }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Invite' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
  });
});
