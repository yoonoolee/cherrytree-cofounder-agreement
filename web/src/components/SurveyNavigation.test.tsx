import { fireEvent, render, screen, within } from '@testing-library/react';
import { SECTION_IDS, SECTION_ORDER, type Project } from '@cherrytree/shared';

import { SECTIONS } from '../config/sectionConfig.ts';
import {
  ADMIN_ID,
  completeSurveyData,
  makeProject,
  makeSurveyData,
  timestamp,
} from '../test/fixtures/project.ts';
import SurveyNavigation from './SurveyNavigation.tsx';

const mocks = vi.hoisted(() => ({
  project: null as Project | null,
  upgradeProps: null as null | Record<string, unknown>,
}));

vi.mock('../hooks/useProjectSync', () => ({
  useProjectSync: () => ({ project: mocks.project }),
}));
// UpgradeModal has its own tests; here it is a stub that records its props.
vi.mock('./UpgradeModal', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.upgradeProps = props;
    return <div data-testid="upgrade-modal" />;
  },
}));

/** A 2D context stub whose measured width grows with the font size and the text length. */
function stubCanvas() {
  const ctx = {
    font: '',
    measureText(text: string) {
      const size = parseInt(this.font.replace(/^\d+\s+/, ''), 10);
      return { width: text.length * size * 0.5 };
    },
  };
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => ctx,
  ) as unknown as HTMLCanvasElement['getContext'];
}

function renderNav(overrides: Partial<React.ComponentProps<typeof SurveyNavigation>> = {}) {
  const props = {
    projectId: 'org_1',
    currentSection: SECTION_IDS.FORMATION as string,
    onSectionClick: vi.fn(),
    onReviewAndApproveClick: vi.fn(),
    onFinalAgreementClick: vi.fn(),
    setIsMobileNavOpen: vi.fn(),
    onManageCollaborators: vi.fn(),
    ...overrides,
  };
  const utils = render(<SurveyNavigation {...props} />);
  return { props, ...utils };
}

const sectionButton = (name: string) => screen.getByRole('button', { name });
const dotOf = (name: string) =>
  sectionButton(name).closest('li')!.querySelector('.nav-dot') as HTMLElement;

beforeEach(() => {
  stubCanvas();
  mocks.upgradeProps = null;
  mocks.project = makeProject({ surveyData: completeSurveyData() });
});

describe('SurveyNavigation', () => {
  it('shows the project name, full progress and every section with the active dot', () => {
    renderNav();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('100% Complete')).toBeInTheDocument();
    expect(screen.getByText('0 sections remaining')).toBeInTheDocument();
    for (const id of SECTION_ORDER) {
      expect(sectionButton(SECTIONS[id].displayName)).toBeInTheDocument();
    }
    expect(dotOf(SECTIONS.formation.displayName)).toHaveClass('active');
    expect(dotOf(SECTIONS.cofounders.displayName)).toHaveClass('done');
  });

  it('reports partial progress and marks unfinished sections', () => {
    mocks.project = makeProject({ surveyData: makeSurveyData({ companyName: 'Acme' }) });
    renderNav({ currentSection: 'generated-agreement' });
    expect(screen.getByText(/\d+% Complete/)).not.toHaveTextContent('100% Complete');
    expect(screen.getByText('10 sections remaining')).toBeInTheDocument();
    expect(dotOf(SECTIONS.formation.displayName)).toHaveClass('notstarted');
  });

  it('handles the project not being loaded yet', () => {
    mocks.project = null;
    renderNav();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('0% Complete')).toBeInTheDocument();
    expect(screen.queryByText('Current Cofounders')).not.toBeInTheDocument();
  });

  it('navigates to a section and closes the mobile nav', () => {
    const { props } = renderNav();
    fireEvent.click(sectionButton(SECTIONS.vesting.displayName));
    expect(props.onSectionClick).toHaveBeenCalledWith(SECTION_IDS.VESTING);
    expect(props.setIsMobileNavOpen).toHaveBeenCalledWith(false);
  });

  it('enables Review & Approve only when every section is complete', () => {
    const { props, unmount } = renderNav();
    fireEvent.click(screen.getByRole('button', { name: 'Review & Approve' }));
    expect(props.onReviewAndApproveClick).toHaveBeenCalledTimes(1);
    unmount();

    mocks.project = makeProject({ surveyData: makeSurveyData() });
    const second = renderNav();
    const button = screen.getByRole('button', { name: 'Review & Approve' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(second.props.onReviewAndApproveClick).not.toHaveBeenCalled();
  });

  it('shows Final Agreement only with a handler, enabled once a PDF exists', () => {
    const { props, unmount } = renderNav();
    expect(screen.getByRole('button', { name: 'Final Agreement' })).toBeDisabled();
    unmount();

    mocks.project = makeProject({
      surveyData: completeSurveyData(),
      pdfAgreements: [
        { url: 'x', generatedAt: timestamp('2026-02-01T00:00:00Z'), generatedBy: ADMIN_ID },
      ],
    });
    const second = renderNav();
    fireEvent.click(screen.getByRole('button', { name: 'Final Agreement' }));
    expect(second.props.onFinalAgreementClick).toHaveBeenCalledTimes(1);
    expect(props.onFinalAgreementClick).not.toHaveBeenCalled();
    second.unmount();

    renderNav({ onFinalAgreementClick: undefined });
    expect(screen.queryByRole('button', { name: 'Final Agreement' })).not.toBeInTheDocument();
  });

  it('lists the collaborators and shows Manage only with a handler', () => {
    const { props, unmount } = renderNav();
    const box = screen.getByText('Current Cofounders').parentElement!;
    expect(within(box).getByText('Ada Lovelace')).toBeInTheDocument();
    expect(within(box).getByText('Grace Hopper')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));
    expect(props.onManageCollaborators).toHaveBeenCalledTimes(1);
    unmount();

    renderNav({ onManageCollaborators: undefined });
    expect(screen.queryByRole('button', { name: 'Manage' })).not.toBeInTheDocument();
  });

  it('offers the upgrade to non-pro projects and opens the modal with the current plan', () => {
    const { unmount } = renderNav();
    fireEvent.click(screen.getByRole('button', { name: '↑ Upgrade' }));
    expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
    expect(mocks.upgradeProps).toMatchObject({ currentPlan: 'starter' });
    unmount();

    mocks.project = makeProject({ surveyData: completeSurveyData(), currentPlan: 'pro' });
    renderNav();
    expect(screen.queryByRole('button', { name: '↑ Upgrade' })).not.toBeInTheDocument();
  });

  it('toggles the mobile nav from the hamburger, the overlay and the close button', () => {
    const { props, container, unmount } = renderNav({ isMobileNavOpen: false });
    expect(container.querySelector('.survey-sidebar-bg')).toHaveClass('-translate-x-full');
    fireEvent.click(container.querySelector('button.md\\:hidden.fixed')!);
    expect(props.setIsMobileNavOpen).toHaveBeenCalledWith(true);
    unmount();

    const open = renderNav({ isMobileNavOpen: true });
    expect(open.container.querySelector('.survey-sidebar-bg')).toHaveClass('translate-x-0');
    fireEvent.click(open.container.querySelector('.fixed.inset-0')!);
    expect(open.props.setIsMobileNavOpen).toHaveBeenCalledWith(false);
  });

  it('shrinks the project name font until it fits the sidebar', () => {
    const { unmount } = renderNav();
    expect(screen.getByText('Acme')).toHaveStyle({ fontSize: '42px' });
    unmount();

    mocks.project = makeProject({ name: 'A Very Long Company Name Inc', surveyData: {} });
    renderNav();
    const size = parseInt(screen.getByText('A Very Long Company Name Inc').style.fontSize, 10);
    expect(size).toBeLessThan(42);
    expect(size).toBeGreaterThanOrEqual(20);
  });
});
