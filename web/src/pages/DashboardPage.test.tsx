import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { Cofounder } from '@cherrytree/shared';

import type { ProjectWithId } from '../hooks/useProjectSync.ts';
import { completeSurveyData, makeProject, timestamp } from '../test/fixtures/project.ts';
import DashboardPage from './DashboardPage';

const mocks = vi.hoisted(() => ({
  user: {
    currentUser: { id: 'user_admin', firstName: 'Ada' } as {
      id: string;
      firstName: string | null;
    } | null,
    loading: false,
    userMemberships: undefined,
    orgsLoaded: true,
  },
  projects: { projects: [] as ProjectWithId[], loading: false },
  openUserProfile: vi.fn(),
  paymentModalProps: null as null | { onClose: () => void },
}));

vi.mock('../contexts/UserContext', () => ({ useUser: () => mocks.user }));
vi.mock('../hooks/useProjects', () => ({ useProjects: () => mocks.projects }));
vi.mock('@clerk/clerk-react', () => ({
  UserButton: () => <div data-testid="user-button" />,
  useClerk: () => ({ openUserProfile: mocks.openUserProfile }),
}));
// PaymentModal has its own tests; the stub records its props.
vi.mock('../components/PaymentModal', () => ({
  default: (props: { onClose: () => void }) => {
    mocks.paymentModalProps = props;
    return <div data-testid="payment-modal" />;
  },
}));

/** jsdom has no IntersectionObserver; this one reveals what it observes on demand. */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observed: Element[] = [];
  unobserved: Element[] = [];
  disconnected = false;
  constructor(
    private readonly callback: (entries: { isIntersecting: boolean; target: Element }[]) => void,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeIntersectionObserver.instances.push(this);
  }
  observe(target: Element) {
    this.observed.push(target);
  }
  unobserve(target: Element) {
    this.unobserved.push(target);
  }
  disconnect() {
    this.disconnected = true;
  }
  intersectAll() {
    this.callback(this.observed.map((target) => ({ isIntersecting: true, target })));
  }
}

const NOW = new Date('2026-03-10T12:00:00Z');

function project(overrides: Partial<ProjectWithId> = {}): ProjectWithId {
  return { id: 'org_1', ...makeProject(), ...overrides };
}

function Location() {
  const { pathname } = useLocation();
  return <p data-testid="path">{pathname}</p>;
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <DashboardPage />
      <Routes>
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
}

const path = () => screen.getByTestId('path').textContent;
const cards = () => Array.from(document.querySelectorAll<HTMLElement>('[data-card]'));
const spinner = () => document.querySelector('.animate-spin');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  FakeIntersectionObserver.instances = [];
  mocks.user.currentUser = { id: 'user_admin', firstName: 'Ada' };
  mocks.user.loading = false;
  mocks.projects = { projects: [], loading: false };
  mocks.openUserProfile = vi.fn();
  mocks.paymentModalProps = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('DashboardPage', () => {
  it('shows only a spinner while the session or the projects are loading', () => {
    mocks.user.loading = true;
    const { unmount } = renderDashboard();
    expect(spinner()).toBeInTheDocument();
    expect(screen.queryByText(/Welcome back/)).toBeNull();
    unmount();

    mocks.user.loading = false;
    mocks.projects = { projects: [], loading: true };
    renderDashboard();
    expect(spinner()).toBeInTheDocument();
    expect(screen.queryByText(/Welcome back/)).toBeNull();
  });

  it('greets the user by first name, falling back to "there"', () => {
    const { unmount } = renderDashboard();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome back, Ada.');
    expect(
      screen.getByText('Create your first cofounder agreement to get started.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
    unmount();

    mocks.user.currentUser = { id: 'user_admin', firstName: null };
    mocks.projects = { projects: [project()], loading: false };
    renderDashboard();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome back, there.');
    expect(screen.getByText("Let's jump back into your open agreements.")).toBeInTheDocument();
  });

  describe('sidebar', () => {
    it('routes Dashboard, opens the Clerk profile for Billing and disables the placeholders', () => {
      renderDashboard();
      fireEvent.click(screen.getByRole('button', { name: 'Billing' }));
      expect(mocks.openUserProfile).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: 'Recent Documents' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Chat with AI' })).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
      expect(path()).toBe('/dashboard');
    });

    it('opens the newsletter in a new tab and Contact in the Tally form', () => {
      const open = vi.fn();
      vi.stubGlobal('open', open);
      const openPopup = vi.fn();
      window.Tally = { openPopup };
      renderDashboard();
      fireEvent.click(screen.getByRole('button', { name: 'Newsletter' }));
      expect(open).toHaveBeenCalledWith('https://cherrytree.beehiiv.com/', '_blank');
      fireEvent.click(screen.getByRole('button', { name: 'Contact' }));
      expect(openPopup).toHaveBeenCalledWith('2EEB99', { layout: 'modal', width: 700 });
      Reflect.deleteProperty(window, 'Tally');
    });
  });

  describe('agreement cards', () => {
    it('shows each project with its cofounders, progress, section count and deadline', () => {
      const cofounders = completeSurveyData().cofounders as Cofounder[];
      mocks.projects = {
        projects: [
          project({
            id: 'org_1',
            name: 'Acme',
            surveyData: completeSurveyData(),
            editDeadline: timestamp('2026-07-16T12:00:00Z'), // noon: the same date in every zone
          }),
          project({
            id: 'org_2',
            name: '',
            surveyData: {},
            editDeadline: timestamp('2026-07-01T12:00:00Z'),
          }),
        ],
        loading: false,
      };
      renderDashboard();
      const [acme, untitled] = cards();
      expect(cards()).toHaveLength(2);

      expect(acme).toHaveTextContent('Acme');
      for (const cf of cofounders) expect(within(acme!).getByText(cf.fullName)).toBeInTheDocument();
      expect(acme).toHaveTextContent('10 out of 10 sections');
      expect(acme).toHaveTextContent('Edit by July 16, 2026');
      expect(acme).toHaveTextContent('100%');
      expect(acme?.querySelector('[style*="width: 100%"]')).not.toBeNull();

      expect(untitled).toHaveTextContent('Untitled Project');
      expect(untitled).toHaveTextContent('0 out of 10 sections');
      expect(untitled).toHaveTextContent('0%');
      expect(untitled).toHaveTextContent('Edit by July 1, 2026');
    });

    it('says how long ago the survey was last edited, from lastUpdated or createdAt', () => {
      const minutes = (n: number) => timestamp(new Date(NOW.getTime() - n * 60_000));
      mocks.projects = {
        projects: [
          project({ id: 'a', lastUpdated: minutes(0.5) }),
          project({ id: 'b', lastUpdated: minutes(5) }),
          project({ id: 'c', lastUpdated: minutes(3 * 60) }),
          project({ id: 'd', lastUpdated: minutes(49 * 60) }),
          project({ id: 'e', lastUpdated: undefined as never, createdAt: minutes(10) }),
        ],
        loading: false,
      };
      renderDashboard();
      expect(cards().map((c) => c.textContent?.match(/Edited ([^\n]*?ago|just now)/)?.[1])).toEqual(
        ['just now', '5m ago', '3h ago', '2d ago', '10m ago'],
      );
    });

    it('Continue slides a cover over the card, then opens the survey and fades it out', () => {
      mocks.projects = { projects: [project({ id: 'org_42' })], loading: false };
      renderDashboard();
      const overlay = () => document.body.lastElementChild as HTMLElement;
      const before = document.body.children.length;

      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      expect(document.body.children).toHaveLength(before + 1);
      expect(overlay().style.position).toBe('fixed');
      expect(path()).toBe('/dashboard');

      act(() => vi.advanceTimersByTime(560));
      expect(path()).toBe('/survey/org_42');
      expect(document.body.contains(overlay())).toBe(true);

      act(() => vi.advanceTimersByTime(80));
      expect(overlay().style.opacity).toBe('0');
      act(() => vi.advanceTimersByTime(380));
      expect(document.body.children).toHaveLength(before);
    });

    it('darkens Continue on hover', () => {
      mocks.projects = { projects: [project()], loading: false };
      renderDashboard();
      const button = screen.getByRole('button', { name: 'Continue' });
      fireEvent.mouseEnter(button);
      expect(button.style.background).toBe('rgb(61, 90, 84)');
      fireEvent.mouseLeave(button);
      expect(button.style.background).toBe('rgb(78, 112, 104)');
    });
  });

  it('opens the payment modal from "Create a new agreement" and closes it again', () => {
    renderDashboard();
    expect(screen.queryByTestId('payment-modal')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Create a new agreement/ }));
    expect(screen.getByTestId('payment-modal')).toBeInTheDocument();
    act(() => mocks.paymentModalProps!.onClose());
    expect(screen.queryByTestId('payment-modal')).toBeNull();
  });

  it('fades the heading in and reveals cards as they scroll into view, staggered', () => {
    mocks.projects = { projects: [project({ id: 'a' }), project({ id: 'b' })], loading: false };
    renderDashboard();
    const heading = screen.getByRole('heading', { level: 1 });
    const animated = Array.from(document.querySelectorAll<HTMLElement>('[data-animate-card]'));
    expect(animated).toHaveLength(3); // two cards + the create button
    expect(heading.style.opacity).toBe('0');
    expect(animated.every((el) => el.style.opacity === '0')).toBe(true);

    act(() => vi.advanceTimersByTime(60));
    expect(heading.style.opacity).toBe('1');
    expect(heading.style.transform).toBe('translateY(0)');

    const [observer] = FakeIntersectionObserver.instances;
    expect(observer?.options).toEqual({ threshold: 0.05 });
    expect(observer?.observed).toEqual(animated);
    act(() => observer!.intersectAll());
    expect(animated.map((el) => el.style.opacity)).toEqual(['1', '1', '1']);
    expect(animated[1]?.style.transition).toContain('opacity 0.45s ease 0.05s');
    expect(animated[2]?.style.transition).toContain('opacity 0.45s ease 0.1s');
    expect(observer?.unobserved).toEqual(animated);
  });

  it('has no leftover dialogs', () => {
    renderDashboard();
    expect(screen.queryByText('Refer a Friend')).toBeNull();
  });
});
