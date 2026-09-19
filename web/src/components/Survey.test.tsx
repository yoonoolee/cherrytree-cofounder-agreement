import { useState, type RefObject } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SECTION_IDS, type Project, type SurveyData } from '@cherrytree/shared';

import {
  ADMIN_ID,
  completeSurveyData,
  makeProject,
  makeSurveyData,
  timestamp,
} from '../test/fixtures/project.ts';
import Survey from './Survey';
import type SurveyNavigation from './SurveyNavigation.tsx';
import type CollaboratorsModal from './CollaboratorsModal.tsx';
import type WelcomePopup from './WelcomePopup.tsx';
import type { SurveySectionProps } from './sectionProps.ts';

const { mocks, SERVER_TIMESTAMP, stubSection } = vi.hoisted(() => {
  const SERVER_TIMESTAMP = { kind: 'serverTimestamp' };
  const mocks = {
    project: null as Project | null,
    formData: {} as SurveyData,
    accessDenied: false,
    /** The ref Survey hands to useProjectSync. */
    syncRef: null as RefObject<boolean> | null,
    updateDoc: vi.fn(),
    mapsLoaded: true,
    orgId: 'org_1' as string | null,
    user: {
      currentUser: {
        id: 'user_admin',
        primaryEmailAddress: { emailAddress: 'ada@example.com' },
      } as {
        id: string;
        primaryEmailAddress: { emailAddress: string };
      } | null,
      setActive: vi.fn(),
      userMemberships: { data: [{ organization: { id: 'org_1' } }] } as {
        data?: { organization: { id: string } }[];
      } | null,
      orgsLoaded: true,
    },
    navProps: null as null | Record<string, unknown>,
    modalProps: null as null | Record<string, unknown>,
    welcomeProps: null as null | Record<string, unknown>,
    /** Props of the section rendered last, with the module that rendered it. */
    section: null as null | { name: string; props: SurveySectionProps },
  };
  const stubSection = (name: string) => ({
    default: (props: SurveySectionProps) => {
      mocks.section = { name, props };
      return <div data-testid="section">{name}</div>;
    },
  });
  return { mocks, SERVER_TIMESTAMP, stubSection };
});

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => ({ path: `${collection}/${id}` }),
  updateDoc: mocks.updateDoc,
  serverTimestamp: () => SERVER_TIMESTAMP,
}));
vi.mock('../lib/firebase', () => ({
  db: {},
  projectRef: (id: string) => ({ path: `projects/${id}` }),
}));
vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: mocks.mapsLoaded }),
}));
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ orgId: mocks.orgId }),
  UserButton: () => <div data-testid="user-button" />,
}));
vi.mock('../contexts/UserContext', () => ({ useUser: () => mocks.user }));
// The listener is replaced by local state so a test controls the project and the form data;
// it records the saving ref so the test can check it is the one the auto-save flips.
vi.mock('../hooks/useProjectSync', () => ({
  useProjectSync: (_projectId: string, isSavingRef: RefObject<boolean>) => {
    mocks.syncRef = isSavingRef;
    const [formData, setFormData] = useState(mocks.formData);
    return {
      project: mocks.project,
      formData,
      setFormData,
      accessDenied: mocks.accessDenied,
      lastSaved: null,
    };
  },
}));

// Children with their own tests are stubs that record their props.
vi.mock('./SurveyNavigation', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.navProps = props;
    return <div data-testid="survey-navigation" />;
  },
}));
vi.mock('./CollaboratorsModal', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.modalProps = props;
    return <div data-testid="collaborators-modal" />;
  },
}));
vi.mock('./WelcomePopup', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.welcomeProps = props;
    return props.isOpen ? <div data-testid="welcome-popup" /> : null;
  },
}));
vi.mock('./SectionFormation', () => stubSection('SectionFormation'));
vi.mock('./SectionCofounders', () => stubSection('SectionCofounders'));
vi.mock('./SectionEquityAllocation', () => stubSection('SectionEquityAllocation'));
vi.mock('./SectionDecisionMaking', () => stubSection('SectionDecisionMaking'));
vi.mock('./SectionEquityVesting', () => stubSection('SectionEquityVesting'));
vi.mock('./SectionIP', () => stubSection('SectionIP'));
vi.mock('./SectionCompensation', () => stubSection('SectionCompensation'));
vi.mock('./SectionPerformance', () => stubSection('SectionPerformance'));
vi.mock('./SectionNonCompete', () => stubSection('SectionNonCompete'));
vi.mock('./SectionFinal', () => stubSection('SectionFinal'));

const PROJECT_ID = 'org_1';
const FUTURE = timestamp('2099-01-01T00:00:00Z');
const PAST = timestamp('2020-01-01T00:00:00Z');

/** An editable project this user has already been welcomed to. */
function editableProject(overrides: Partial<Project> = {}): Project {
  return makeProject({
    editDeadline: FUTURE,
    onboardingCompleted: { [ADMIN_ID]: true },
    ...overrides,
  });
}

function Location() {
  const { pathname, search } = useLocation();
  return <p data-testid="path">{`${pathname}${search}`}</p>;
}

function renderSurvey(search = '') {
  const onPreview = vi.fn();
  const onFinalAgreement = vi.fn();
  render(
    <MemoryRouter initialEntries={[`/survey/${PROJECT_ID}${search}`]}>
      <Survey projectId={PROJECT_ID} onPreview={onPreview} onFinalAgreement={onFinalAgreement} />
      <Routes>
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
  return { onPreview, onFinalAgreement };
}

const nav = () => mocks.navProps as unknown as React.ComponentProps<typeof SurveyNavigation>;
const modal = () => mocks.modalProps as unknown as React.ComponentProps<typeof CollaboratorsModal>;
const welcome = () => mocks.welcomeProps as unknown as React.ComponentProps<typeof WelcomePopup>;
const path = () => screen.getByTestId('path').textContent;
const section = () => mocks.section!;
const continueButton = () => screen.getByRole('button', { name: 'Continue' });
const reviewButton = () => screen.getByRole('button', { name: 'Review & Approve' });
const flush = () => act(async () => {});

beforeEach(() => {
  mocks.navProps = null;
  mocks.modalProps = null;
  mocks.welcomeProps = null;
  mocks.section = null;
  mocks.syncRef = null;
  mocks.updateDoc.mockReset().mockResolvedValue(undefined);
  mocks.mapsLoaded = true;
  mocks.orgId = PROJECT_ID;
  mocks.accessDenied = false;
  mocks.user = {
    currentUser: { id: ADMIN_ID, primaryEmailAddress: { emailAddress: 'ada@example.com' } },
    setActive: vi.fn(),
    userMemberships: { data: [{ organization: { id: PROJECT_ID } }] },
    orgsLoaded: true,
  };
  mocks.project = editableProject();
  mocks.formData = completeSurveyData();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Survey', () => {
  describe('gates', () => {
    it('shows the access-denied screen with a way back to the dashboard', () => {
      mocks.accessDenied = true;
      renderSurvey();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Go to Dashboard' }));
      expect(path()).toBe('/dashboard');
    });

    it('shows a loading state until the project arrives', () => {
      mocks.project = null;
      renderSurvey();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('survey-navigation')).not.toBeInTheDocument();
    });
  });

  describe('sections', () => {
    it('opens on Formation with the shared section props', () => {
      renderSurvey();
      expect(section().name).toBe('SectionFormation');
      expect(section().props).toMatchObject({
        formData: mocks.formData,
        isReadOnly: false,
        showValidation: false,
      });
      expect(typeof section().props.handleChange).toBe('function');
      expect(nav().currentSection).toBe(SECTION_IDS.FORMATION);
    });

    it('waits for the Maps script before rendering Formation', () => {
      mocks.mapsLoaded = false;
      renderSurvey();
      expect(screen.queryByTestId('section')).not.toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('opens the section named in the URL and falls back to Formation for an unknown one', () => {
      renderSurvey(`?section=${SECTION_IDS.VESTING}`);
      expect(section().name).toBe('SectionEquityVesting');
      expect(section().props.project).toBe(mocks.project);
      expect(nav().currentSection).toBe(SECTION_IDS.VESTING);
    });

    it('falls back to Formation for an unknown section', () => {
      renderSurvey('?section=nope');
      expect(section().name).toBe('SectionFormation');
    });

    it('switches sections from the navigation and mirrors the choice in the URL', () => {
      renderSurvey();
      act(() => nav().onSectionClick(SECTION_IDS.IP));
      expect(section().name).toBe('SectionIP');
      expect(path()).toBe(`/survey/${PROJECT_ID}?section=${SECTION_IDS.IP}`);
    });

    it('moves to the next section with Continue and offers Review & Approve on the last', () => {
      renderSurvey(`?section=${SECTION_IDS.NON_COMPETITION}`);
      fireEvent.click(continueButton());
      expect(section().name).toBe('SectionFinal');
      expect(path()).toBe(`/survey/${PROJECT_ID}?section=${SECTION_IDS.GENERAL_PROVISIONS}`);
      expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
      expect(reviewButton()).toBeEnabled();
    });

    it('renders every section read-only without a way forward once the project is locked', () => {
      mocks.project = makeProject({
        editDeadline: PAST,
        pdfAgreements: [
          { url: 'https://example.com/a.pdf', generatedAt: PAST, generatedBy: ADMIN_ID },
        ],
        onboardingCompleted: { [ADMIN_ID]: true },
      });
      renderSurvey();
      expect(section().props.isReadOnly).toBe(true);
      expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Review & Approve' })).not.toBeInTheDocument();
    });
  });

  describe('editing and auto-save', () => {
    it('updates the form, shows Saving..., and writes after the debounce', async () => {
      vi.useFakeTimers();
      renderSurvey();

      act(() => section().props.handleChange('companyName', 'Echo'));
      expect(section().props.formData.companyName).toBe('Echo');
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(mocks.updateDoc).not.toHaveBeenCalled();

      await act(() => vi.advanceTimersByTimeAsync(2000));
      expect(mocks.updateDoc).toHaveBeenCalledWith(
        { path: `projects/${PROJECT_ID}` },
        expect.objectContaining({
          surveyData: expect.objectContaining({ companyName: 'Echo' }),
          lastUpdated: SERVER_TIMESTAMP,
          lastEditedBy: 'ada@example.com',
        }),
      );
      expect(screen.getByText(/^Saved /)).toBeInTheDocument();
    });

    it('shares one saving flag between the project listener and the auto-save', async () => {
      let savingDuringWrite: boolean | undefined;
      mocks.updateDoc.mockImplementation(async () => {
        savingDuringWrite = mocks.syncRef!.current;
      });
      renderSurvey(`?section=${SECTION_IDS.GENERAL_PROVISIONS}`);

      fireEvent.click(reviewButton());
      await flush();
      expect(mocks.updateDoc).toHaveBeenCalledTimes(1);
      expect(savingDuringWrite).toBe(true);
    });
  });

  describe('Review & Approve', () => {
    it('saves, then hands over to the preview when every section is complete', async () => {
      const { onPreview } = renderSurvey(`?section=${SECTION_IDS.GENERAL_PROVISIONS}`);
      fireEvent.click(reviewButton());
      await flush();
      expect(mocks.updateDoc).toHaveBeenCalledTimes(1);
      expect(onPreview).toHaveBeenCalledTimes(1);
      expect(section().props.showValidation).toBe(false);
    });

    it('turns validation on instead when a section is incomplete', async () => {
      mocks.formData = makeSurveyData({ ...completeSurveyData(), companyName: '' });
      const { onPreview } = renderSurvey(`?section=${SECTION_IDS.GENERAL_PROVISIONS}`);
      fireEvent.click(reviewButton());
      await flush();
      expect(onPreview).not.toHaveBeenCalled();
      expect(section().props.showValidation).toBe(true);
    });

    it('is wired to the navigation together with the Final Agreement entry', () => {
      const { onPreview, onFinalAgreement } = renderSurvey();
      expect(nav().onReviewAndApproveClick).toBe(onPreview);
      expect(nav().onFinalAgreementClick).toBe(onFinalAgreement);
    });
  });

  describe('welcome popup', () => {
    it('welcomes a user the project has not seen and records the visit', async () => {
      mocks.project = editableProject({ onboardingCompleted: {} });
      renderSurvey();
      await flush();
      expect(screen.getByTestId('welcome-popup')).toBeInTheDocument();
      expect(mocks.updateDoc).toHaveBeenCalledWith(
        { path: `projects/${PROJECT_ID}` },
        { [`onboardingCompleted.${ADMIN_ID}`]: false },
      );

      await act(() => welcome().onClose());
      expect(screen.queryByTestId('welcome-popup')).not.toBeInTheDocument();
      expect(mocks.updateDoc).toHaveBeenLastCalledWith(
        { path: `projects/${PROJECT_ID}` },
        { [`onboardingCompleted.${ADMIN_ID}`]: true },
      );
    });

    it('stays closed for a user who already dismissed it', async () => {
      renderSurvey();
      await flush();
      expect(screen.queryByTestId('welcome-popup')).not.toBeInTheDocument();
      expect(mocks.updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('Clerk organization', () => {
    it("switches to the project's organization when another one is active", async () => {
      mocks.orgId = 'org_other';
      renderSurvey();
      await flush();
      expect(mocks.user.setActive).toHaveBeenCalledWith({ organization: PROJECT_ID });
    });

    it('leaves the active organization alone when it already matches or is not a membership', async () => {
      renderSurvey();
      await flush();
      expect(mocks.user.setActive).not.toHaveBeenCalled();

      mocks.orgId = 'org_other';
      mocks.user.userMemberships = { data: [] };
      renderSurvey();
      await flush();
      expect(mocks.user.setActive).not.toHaveBeenCalled();
    });
  });

  describe('chrome', () => {
    it('goes back to the dashboard', () => {
      renderSurvey();
      fireEvent.click(screen.getByRole('button', { name: '← Back to Dashboard' }));
      expect(path()).toBe('/dashboard');
    });

    it('opens and closes the collaborators modal from the navigation', () => {
      renderSurvey();
      act(() => nav().onManageCollaborators!());
      expect(modal().project).toBe(mocks.project);
      act(() => modal().onClose());
      expect(screen.queryByTestId('collaborators-modal')).not.toBeInTheDocument();
    });

    it('opens the Tally help form', () => {
      const openPopup = vi.fn();
      window.Tally = { openPopup };
      renderSurvey();
      fireEvent.click(screen.getByRole('button', { name: '?' }));
      expect(openPopup).toHaveBeenCalledWith('2EEB99', { layout: 'modal', width: 700 });
      delete window.Tally;
    });
  });
});
