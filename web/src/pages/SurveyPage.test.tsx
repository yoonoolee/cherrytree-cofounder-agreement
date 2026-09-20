import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import type Survey from '../components/Survey.tsx';
import SurveyPage from './SurveyPage';

const mocks = vi.hoisted(() => ({
  surveyProps: null as null | Record<string, unknown>,
  updateDoc: vi.fn(),
  SERVER_TIMESTAMP: { kind: 'serverTimestamp' },
}));

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => ({ path: `${collection}/${id}` }),
  updateDoc: mocks.updateDoc,
  serverTimestamp: () => mocks.SERVER_TIMESTAMP,
}));
vi.mock('../lib/firebase', () => ({
  db: {},
  projectRef: (id: string) => ({ path: `projects/${id}` }),
}));
// Survey has its own tests; the stub records its props.
vi.mock('../components/Survey', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.surveyProps = props;
    return <div data-testid="survey" />;
  },
}));

function Location() {
  const { pathname } = useLocation();
  return <p data-testid="path">{pathname}</p>;
}

function renderPage(projectId = 'org_1') {
  return render(
    <MemoryRouter initialEntries={[`/survey/${projectId}`]}>
      <Routes>
        <Route path="/survey/:projectId" element={<SurveyPage />} />
        <Route path="*" element={<div>elsewhere</div>} />
      </Routes>
      <Routes>
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
}

const survey = () => mocks.surveyProps as unknown as React.ComponentProps<typeof Survey>;
const path = () => screen.getByTestId('path').textContent;

beforeEach(() => {
  mocks.surveyProps = null;
  mocks.updateDoc.mockReset().mockResolvedValue(undefined);
});

describe('SurveyPage', () => {
  it('renders the survey for the project in the URL', () => {
    renderPage('org_42');
    expect(screen.getByTestId('survey')).toBeInTheDocument();
    expect(survey().projectId).toBe('org_42');
  });

  it('stamps lastOpened with a server timestamp through the typed project ref', async () => {
    renderPage('org_42');
    await act(async () => {});
    expect(mocks.updateDoc).toHaveBeenCalledTimes(1);
    expect(mocks.updateDoc).toHaveBeenCalledWith(
      { path: 'projects/org_42' },
      { lastOpened: mocks.SERVER_TIMESTAMP },
    );
  });

  it('logs a failed lastOpened write and keeps the survey up', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.updateDoc.mockRejectedValue(new Error('offline'));
    renderPage();
    await act(async () => {});
    expect(error).toHaveBeenCalledWith('Error updating lastOpened:', expect.any(Error));
    expect(screen.getByTestId('survey')).toBeInTheDocument();
    error.mockRestore();
  });

  it('hands Review & Approve over to its page', () => {
    renderPage('org_42');
    act(() => survey().onPreview());
    expect(path()).toBe('/preview/org_42');
  });

  it('hands Final Agreement over to its page', () => {
    renderPage('org_42');
    act(() => survey().onFinalAgreement());
    expect(path()).toBe('/final-agreement/org_42');
  });
});
