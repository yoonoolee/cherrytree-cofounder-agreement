import { act, render, screen } from '@testing-library/react';
import { SECTION_IDS, type Project } from '@cherrytree/shared';

import { makeProject } from '../test/fixtures/project.ts';
import FinalAgreement from './FinalAgreement';

const mocks = vi.hoisted(() => ({
  project: null as Project | null,
  navProps: null as null | Record<string, unknown>,
}));

vi.mock('../hooks/useProjectSync', () => ({
  useProjectSync: () => ({ project: mocks.project }),
}));
// SurveyNavigation has its own tests; here it is a stub that records its props.
vi.mock('./SurveyNavigation', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.navProps = props;
    return <div data-testid="survey-navigation" />;
  },
}));

const DRIVE_URL = 'https://drive.google.com/file/d/abc123/view?usp=sharing';

function renderFinalAgreement() {
  const onEdit = vi.fn();
  render(<FinalAgreement projectId="org_1" onEdit={onEdit} />);
  return { onEdit };
}

const nav = () =>
  mocks.navProps as unknown as React.ComponentProps<
    typeof import('./SurveyNavigation.tsx').default
  >;
const iframe = () => screen.getByTitle('Final Cofounder Agreement') as HTMLIFrameElement;

beforeEach(() => {
  mocks.navProps = null;
  mocks.project = makeProject();
});

describe('FinalAgreement', () => {
  it('shows a loading state and no navigation until the project arrives', () => {
    mocks.project = null;
    renderFinalAgreement();
    expect(screen.getByText('Loading final agreement...')).toBeInTheDocument();
    expect(screen.queryByTestId('survey-navigation')).not.toBeInTheDocument();
  });

  it('shows the header and the empty state when no agreement has been generated', () => {
    renderFinalAgreement();
    expect(screen.getByRole('heading', { name: 'Final Agreement' })).toBeInTheDocument();
    expect(screen.getByText('No final agreement available yet')).toBeInTheDocument();
    expect(screen.queryByTitle('Final Cofounder Agreement')).not.toBeInTheDocument();
  });

  it('embeds the latest PDF through the Drive preview URL', () => {
    mocks.project = makeProject({ latestPdfUrl: DRIVE_URL });
    renderFinalAgreement();
    expect(iframe().src).toBe('https://drive.google.com/file/d/abc123/preview');
    expect(screen.queryByText('No final agreement available yet')).not.toBeInTheDocument();
  });

  it('embeds a non-Drive PDF URL as-is', () => {
    mocks.project = makeProject({ latestPdfUrl: 'https://example.com/acme.pdf' });
    renderFinalAgreement();
    expect(iframe().src).toBe('https://example.com/acme.pdf');
  });

  it('routes the navigation clicks through onEdit', () => {
    const { onEdit } = renderFinalAgreement();
    expect(nav().projectId).toBe('org_1');
    expect(nav().currentSection).toBe('final-agreement');

    nav().onSectionClick(SECTION_IDS.VESTING);
    expect(onEdit).toHaveBeenLastCalledWith(SECTION_IDS.VESTING);

    nav().onReviewAndApproveClick();
    expect(onEdit).toHaveBeenLastCalledWith('generated-agreement');

    act(() => nav().onFinalAgreementClick!());
    expect(nav().currentSection).toBe('final-agreement');
    expect(onEdit).toHaveBeenCalledTimes(2);
  });

  it('owns the mobile navigation open state', () => {
    renderFinalAgreement();
    expect(nav().isMobileNavOpen).toBe(false);
    act(() => nav().setIsMobileNavOpen!(true));
    expect(nav().isMobileNavOpen).toBe(true);
  });
});
