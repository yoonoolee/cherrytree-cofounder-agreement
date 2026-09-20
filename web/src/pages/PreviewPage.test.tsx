import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SECTION_IDS } from '@cherrytree/shared';

import type Preview from '../components/Preview.tsx';
import PreviewPage from './PreviewPage.tsx';

const mocks = vi.hoisted(() => ({ previewProps: null as null | Record<string, unknown> }));

// Preview has its own tests; the stub records its props.
vi.mock('../components/Preview', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.previewProps = props;
    return <div data-testid="preview" />;
  },
}));

function Location() {
  const { pathname, search } = useLocation();
  return <p data-testid="path">{pathname + search}</p>;
}

function renderPage(projectId = 'org_42') {
  return render(
    <MemoryRouter initialEntries={[`/preview/${projectId}`]}>
      <Routes>
        <Route path="/preview/:projectId" element={<PreviewPage />} />
        <Route path="*" element={<div>elsewhere</div>} />
      </Routes>
      <Routes>
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
}

const preview = () => mocks.previewProps as unknown as React.ComponentProps<typeof Preview>;
const path = () => screen.getByTestId('path').textContent;

beforeEach(() => {
  mocks.previewProps = null;
});

describe('PreviewPage', () => {
  it('renders the preview for the project in the URL', () => {
    renderPage('org_42');
    expect(screen.getByTestId('preview')).toBeInTheDocument();
    expect(preview().projectId).toBe('org_42');
  });

  it('sends an edit request to that section of the survey', () => {
    renderPage('org_42');
    act(() => preview().onEdit(SECTION_IDS.VESTING));
    expect(path()).toBe(`/survey/org_42?section=${SECTION_IDS.VESTING}`);
  });
});
