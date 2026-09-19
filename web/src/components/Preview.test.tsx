import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SECTION_IDS, type Project } from '@cherrytree/shared';

import {
  ADMIN_ID,
  MEMBER_ID,
  makeCollaborator,
  makeProject,
  timestamp,
} from '../test/fixtures/project.ts';
import Preview from './Preview';
import type SurveyNavigation from './SurveyNavigation.tsx';
import type CollaboratorsModal from './CollaboratorsModal.tsx';

const mocks = vi.hoisted(() => ({
  project: null as Project | null,
  user: { currentUser: { id: 'user_admin' } as { id: string } | null },
  callFunction: vi.fn(),
  navProps: null as null | Record<string, unknown>,
  approvalProps: null as null | Record<string, unknown>,
  modalProps: null as null | Record<string, unknown>,
}));

vi.mock('../hooks/useProjectSync', () => ({
  useProjectSync: () => ({ project: mocks.project }),
}));
vi.mock('../contexts/UserContext', () => ({ useUser: () => mocks.user }));
vi.mock('../lib/functions', () => ({ callFunction: mocks.callFunction }));
vi.mock('@clerk/clerk-react', () => ({ UserButton: () => <div data-testid="user-button" /> }));
// These children have their own tests; here they are stubs that record their props.
vi.mock('./SurveyNavigation', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.navProps = props;
    return <div data-testid="survey-navigation" />;
  },
}));
vi.mock('./ApprovalSection', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.approvalProps = props;
    return <div data-testid="approval-section" />;
  },
}));
vi.mock('./CollaboratorsModal', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.modalProps = props;
    return <div data-testid="collaborators-modal" />;
  },
}));

const PROJECT_ID = 'org_1';
const FUTURE = timestamp('2099-01-01T00:00:00Z');
const PAST = timestamp('2020-01-01T00:00:00Z');
const PREVIEW_URL = 'https://drive.google.com/file/d/preview1/view';
const FRESH_PREVIEW_URL = 'https://drive.google.com/file/d/preview2/view';
const FINAL_URL = 'https://drive.google.com/file/d/final1/view';
const embedOf = (id: string) => `https://drive.google.com/file/d/${id}/preview`;

const allApproved = { [ADMIN_ID]: true, [MEMBER_ID]: true };

/** An editable project (deadline far ahead) whose survey was last saved at 12:00. */
function editableProject(overrides: Partial<Project> = {}): Project {
  return makeProject({
    editDeadline: FUTURE,
    lastUpdated: timestamp('2026-03-01T12:00:00Z'),
    approvals: allApproved,
    ...overrides,
  });
}

/** A preview generated after the last save (the server would reuse it). */
const freshPreview = {
  previewPdfUrl: PREVIEW_URL,
  previewPdfGeneratedAt: timestamp('2026-03-01T12:00:05Z'),
};
/** A preview generated well before the last save. */
const stalePreview = {
  previewPdfUrl: PREVIEW_URL,
  previewPdfGeneratedAt: timestamp('2026-03-01T11:00:00Z'),
};

/** A submitted project whose edit window has closed. */
function readOnlyProject(): Project {
  return makeProject({
    editDeadline: PAST,
    pdfAgreements: [{ url: FINAL_URL, generatedAt: PAST, generatedBy: ADMIN_ID }],
    latestPdfUrl: FINAL_URL,
    ...stalePreview,
  });
}

function Location() {
  const { pathname } = useLocation();
  return <p data-testid="path">{pathname}</p>;
}

function renderPreview() {
  const onEdit = vi.fn();
  render(
    <MemoryRouter initialEntries={[`/preview/${PROJECT_ID}`]}>
      <Preview projectId={PROJECT_ID} onEdit={onEdit} />
      <Routes>
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
  return { onEdit };
}

const nav = () => mocks.navProps as unknown as React.ComponentProps<typeof SurveyNavigation>;
const modal = () => mocks.modalProps as unknown as React.ComponentProps<typeof CollaboratorsModal>;
const path = () => screen.getByTestId('path').textContent;
const iframe = () => screen.getByTitle('Cofounder Agreement Preview') as HTMLIFrameElement;
const submitButton = () => screen.getByRole('button', { name: 'Submit Agreement' });
const generatingText = () => screen.queryByText('Generating your cofounder agreement...');

beforeEach(() => {
  mocks.navProps = null;
  mocks.approvalProps = null;
  mocks.modalProps = null;
  mocks.user = { currentUser: { id: ADMIN_ID } };
  mocks.callFunction.mockReset();
  mocks.project = editableProject(freshPreview);
});

describe('Preview', () => {
  it('shows a loading state until the project arrives', () => {
    mocks.project = null;
    renderPreview();
    expect(screen.getByText('Loading preview...')).toBeInTheDocument();
    expect(screen.queryByTestId('survey-navigation')).not.toBeInTheDocument();
    expect(mocks.callFunction).not.toHaveBeenCalled();
  });

  describe('page chrome', () => {
    it('shows the header, the save time and the approval section', () => {
      renderPreview();
      expect(screen.getByRole('heading', { name: 'Generated Agreement' })).toBeInTheDocument();
      const savedAt = new Date('2026-03-01T12:00:00Z').toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });
      expect(screen.getByText(`Saved ${savedAt}`)).toBeInTheDocument();
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
      expect(mocks.approvalProps).toMatchObject({ project: mocks.project, projectId: PROJECT_ID });
    });

    it('goes back to the dashboard', () => {
      renderPreview();
      fireEvent.click(screen.getByRole('button', { name: '← Back to Dashboard' }));
      expect(path()).toBe('/dashboard');
    });

    it('routes the navigation: sections through onEdit, Final Agreement through the router', () => {
      const { onEdit } = renderPreview();
      expect(nav().projectId).toBe(PROJECT_ID);
      expect(nav().currentSection).toBe('generated-agreement');

      nav().onSectionClick(SECTION_IDS.VESTING);
      expect(onEdit).toHaveBeenCalledWith(SECTION_IDS.VESTING);

      act(() => nav().onFinalAgreementClick!());
      expect(path()).toBe(`/final-agreement/${PROJECT_ID}`);
    });

    it('opens and closes the collaborators modal from the navigation', () => {
      renderPreview();
      expect(screen.queryByTestId('collaborators-modal')).not.toBeInTheDocument();

      act(() => nav().onManageCollaborators!());
      expect(screen.getByTestId('collaborators-modal')).toBeInTheDocument();
      expect(modal().project).toBe(mocks.project);

      act(() => modal().onClose());
      expect(screen.queryByTestId('collaborators-modal')).not.toBeInTheDocument();
    });
  });

  describe('preview generation', () => {
    it('shows a fresh preview without calling the server', () => {
      renderPreview();
      expect(mocks.callFunction).not.toHaveBeenCalled();
      expect(iframe().src).toBe(embedOf('preview1'));
      expect(generatingText()).not.toBeInTheDocument();
      expect(screen.queryByText('The survey has been edited')).not.toBeInTheDocument();
    });

    it('generates a preview on mount when the project has none', async () => {
      mocks.project = editableProject();
      mocks.callFunction.mockResolvedValueOnce({ success: true, pdfUrl: FRESH_PREVIEW_URL });
      renderPreview();

      expect(mocks.callFunction).toHaveBeenCalledWith('generatePreviewPDF', {
        projectId: PROJECT_ID,
      });
      expect(generatingText()).toBeInTheDocument();
      expect(screen.queryByTitle('Cofounder Agreement Preview')).not.toBeInTheDocument();

      await waitFor(() => expect(generatingText()).not.toBeInTheDocument());
      expect(iframe().src).toBe(embedOf('preview2'));
    });

    it('regenerates a stale preview on mount and offers a refresh while it stays stale', async () => {
      mocks.project = editableProject(stalePreview);
      mocks.callFunction.mockResolvedValue({ success: true, pdfUrl: FRESH_PREVIEW_URL });
      renderPreview();

      expect(mocks.callFunction).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(generatingText()).not.toBeInTheDocument());
      expect(iframe().src).toBe(embedOf('preview2'));

      // The mocked project never receives the server's new previewPdfGeneratedAt.
      expect(screen.getByText('The survey has been edited')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Refresh Preview' }));
      expect(mocks.callFunction).toHaveBeenCalledTimes(2);
      await waitFor(() => expect(generatingText()).not.toBeInTheDocument());
    });

    it('reports a failed generation', async () => {
      mocks.project = editableProject();
      mocks.callFunction.mockRejectedValueOnce(new Error('Make.com is down'));
      renderPreview();

      expect(
        await screen.findByText('Error generating preview: Make.com is down'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
      expect(screen.queryByTitle('Cofounder Agreement Preview')).not.toBeInTheDocument();
    });

    it('reports a generation that returned no URL', async () => {
      mocks.project = editableProject();
      mocks.callFunction.mockResolvedValueOnce({ success: true, pdfUrl: null });
      renderPreview();

      expect(
        await screen.findByText(/PDF was generated but no URL was returned/),
      ).toBeInTheDocument();
    });
  });

  describe('submitted project still inside the edit window', () => {
    const submitted = {
      pdfAgreements: [{ url: FINAL_URL, generatedAt: PAST, generatedBy: ADMIN_ID }],
      latestPdfUrl: FINAL_URL,
    };

    it('shows the preview, not the submitted agreement', () => {
      mocks.project = editableProject({ ...submitted, ...freshPreview });
      renderPreview();
      expect(mocks.callFunction).not.toHaveBeenCalled();
      expect(iframe().src).toBe(embedOf('preview1'));
      expect(screen.getByTestId('approval-section')).toBeInTheDocument();
    });

    it('regenerates a stale preview and keeps showing it', async () => {
      mocks.project = editableProject({ ...submitted, ...stalePreview });
      mocks.callFunction.mockResolvedValueOnce({ success: true, pdfUrl: FRESH_PREVIEW_URL });
      renderPreview();
      expect(mocks.callFunction).toHaveBeenCalledWith('generatePreviewPDF', {
        projectId: PROJECT_ID,
      });
      await waitFor(() => expect(generatingText()).not.toBeInTheDocument());
      expect(iframe().src).toBe(embedOf('preview2'));
    });
  });

  describe('read-only project', () => {
    it('shows the submitted agreement and hides approval and submit', () => {
      mocks.project = readOnlyProject();
      renderPreview();
      expect(mocks.callFunction).not.toHaveBeenCalled();
      expect(iframe().src).toBe(embedOf('final1'));
      expect(screen.queryByText('The survey has been edited')).not.toBeInTheDocument();
      expect(screen.queryByTestId('approval-section')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Submit Agreement' })).not.toBeInTheDocument();
    });
  });

  describe('submit', () => {
    it('lets the admin submit once every active collaborator has approved', async () => {
      mocks.callFunction.mockResolvedValueOnce({ success: true, message: 'ok', pdfUrl: FINAL_URL });
      renderPreview();

      expect(submitButton()).toBeEnabled();
      expect(
        screen.queryByText('Waiting for all collaborators to approve'),
      ).not.toBeInTheDocument();
      fireEvent.click(submitButton());
      expect(mocks.callFunction).toHaveBeenCalledWith('submitSurvey', { projectId: PROJECT_ID });
      expect(screen.getByText('Generating PDF...')).toBeInTheDocument();

      await waitFor(() => expect(path()).toBe(`/final-agreement/${PROJECT_ID}`));
    });

    it('waits while an active collaborator has not approved', () => {
      mocks.project = editableProject({ ...freshPreview, approvals: { [ADMIN_ID]: true } });
      renderPreview();
      expect(submitButton()).toBeDisabled();
      expect(screen.getByText('Waiting for all collaborators to approve')).toBeInTheDocument();
    });

    it('ignores a removed collaborator, like the approval section does', () => {
      const project = editableProject(freshPreview);
      project.collaborators.user_gone = makeCollaborator({
        isActive: false,
        history: [
          { startAt: timestamp('2026-01-01T00:00:00Z'), endAt: timestamp('2026-02-01T00:00:00Z') },
        ],
      });
      mocks.project = project;
      renderPreview();
      expect(submitButton()).toBeEnabled();
      expect(
        screen.queryByText('Waiting for all collaborators to approve'),
      ).not.toBeInTheDocument();
    });

    it('only offers submit to the admin', () => {
      mocks.user = { currentUser: { id: MEMBER_ID } };
      renderPreview();
      expect(screen.queryByRole('button', { name: 'Submit Agreement' })).not.toBeInTheDocument();
      expect(screen.getByText('Only the project owner can submit the survey')).toBeInTheDocument();
    });

    it('shows the server error and re-enables the button when submit fails', async () => {
      mocks.callFunction.mockRejectedValueOnce(new Error('Only the project admin can submit'));
      renderPreview();
      fireEvent.click(submitButton());

      expect(await screen.findByText('Only the project admin can submit')).toBeInTheDocument();
      expect(submitButton()).toBeEnabled();
      expect(path()).toBe(`/preview/${PROJECT_ID}`);
    });
  });
});
