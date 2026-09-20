import { render, screen } from '@testing-library/react';

import { makeProject, timestamp } from '../test/fixtures/project.ts';
import AgreementHeader from './AgreementHeader.tsx';

const NOW = new Date('2026-03-01T12:00:00Z');
const pdf = (generatedAt: string) => ({
  url: 'https://example.com/a.pdf',
  generatedAt: timestamp(generatedAt),
  generatedBy: 'user_admin',
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AgreementHeader', () => {
  it('shows the title and a "not yet submitted" note before any PDF exists', () => {
    render(<AgreementHeader project={makeProject()} title="Generated Agreement" />);
    expect(screen.getByRole('heading', { name: 'Generated Agreement' })).toBeInTheDocument();
    expect(screen.getByText('Preview - Not yet submitted')).toBeInTheDocument();
  });

  it('shows the last submission date and the remaining edit window, nothing else', () => {
    const project = makeProject({
      pdfAgreements: [pdf('2026-01-10T00:00:00Z'), pdf('2026-02-20T00:00:00Z')],
      editDeadline: timestamp('2026-07-16T12:00:00Z'),
      previewPdfGeneratedAt: timestamp('2026-02-21T00:00:00Z'),
    });
    const { container } = render(<AgreementHeader project={project} title="Final Agreement" />);
    const last = new Date('2026-02-20T00:00:00Z').toLocaleDateString();
    expect(container.querySelector('p')!.textContent).toBe(
      `Last submitted on ${last}. You can continue to edit and regenerate the agreement until July 16, 2026.`,
    );
  });

  it('says nothing about the window once the project is read-only', () => {
    const project = makeProject({
      pdfAgreements: [pdf('2026-01-10T00:00:00Z')],
      editDeadline: timestamp('2026-02-01T00:00:00Z'),
    });
    render(<AgreementHeader project={project} title="Final Agreement" />);
    expect(screen.queryByText(/edit/i)).toBeNull();
  });

  it('says nothing about the window when the project has no deadline', () => {
    const project = makeProject({
      pdfAgreements: [pdf('2026-01-10T00:00:00Z')],
      editDeadline: undefined as never,
    });
    render(<AgreementHeader project={project} title="Final Agreement" />);
    expect(screen.queryByText(/until/)).toBeNull();
  });
});
