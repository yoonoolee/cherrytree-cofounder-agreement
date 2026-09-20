import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SECTION_IDS } from '@cherrytree/shared';

import type FinalAgreement from '../components/FinalAgreement.tsx';
import { GENERATED_AGREEMENT_ID } from '../config/sectionConfig.ts';
import FinalAgreementPage from './FinalAgreementPage.tsx';

const mocks = vi.hoisted(() => ({ props: null as null | Record<string, unknown> }));

// FinalAgreement has its own tests; the stub records its props.
vi.mock('../components/FinalAgreement', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.props = props;
    return <div data-testid="final-agreement" />;
  },
}));

function Location() {
  const { pathname, search } = useLocation();
  return <p data-testid="path">{pathname + search}</p>;
}

function renderPage(projectId = 'org_42') {
  return render(
    <MemoryRouter initialEntries={[`/final-agreement/${projectId}`]}>
      <Routes>
        <Route path="/final-agreement/:projectId" element={<FinalAgreementPage />} />
        <Route path="*" element={<div>elsewhere</div>} />
      </Routes>
      <Routes>
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
}

const finalAgreement = () => mocks.props as unknown as React.ComponentProps<typeof FinalAgreement>;
const path = () => screen.getByTestId('path').textContent;

beforeEach(() => {
  mocks.props = null;
});

describe('FinalAgreementPage', () => {
  it('renders the final agreement for the project in the URL', () => {
    renderPage('org_42');
    expect(screen.getByTestId('final-agreement')).toBeInTheDocument();
    expect(finalAgreement().projectId).toBe('org_42');
  });

  it('sends a section edit to that section of the survey', () => {
    renderPage('org_42');
    act(() => finalAgreement().onEdit(SECTION_IDS.COFOUNDERS));
    expect(path()).toBe(`/survey/org_42?section=${SECTION_IDS.COFOUNDERS}`);
  });

  it('sends the generated-agreement entry to Review & Approve', () => {
    renderPage('org_42');
    act(() => finalAgreement().onEdit(GENERATED_AGREEMENT_ID));
    expect(path()).toBe('/preview/org_42');
  });
});
