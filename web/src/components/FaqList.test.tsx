import { fireEvent, render, screen } from '@testing-library/react';

import FaqList from './FaqList.tsx';

const FAQS = [
  { q: 'One?', a: 'First answer' },
  { q: 'Two?', a: 'Second answer' },
  { q: 'Three?', a: 'Third' },
  { q: 'Four?', a: 'Fourth' },
  { q: 'Five?', a: 'Fifth' },
  { q: 'Six?', a: 'Sixth' },
];

const item = (q: string) => screen.getByRole('button', { name: q }).parentElement!;
const body = (q: string) => item(q).querySelector('.lp-faq-body');

describe('FaqList', () => {
  it('renders every question with its answer collapsed', () => {
    render(<FaqList faqs={FAQS} />);
    expect(screen.getAllByRole('button')).toHaveLength(6);
    expect(screen.getByText('First answer')).toBeInTheDocument();
    expect(body('One?')).not.toHaveClass('open');
    expect(item('One?').className).toBe('lp-faq-item');
  });

  it('opens an item on click and toggles it closed on a second click', () => {
    render(<FaqList faqs={FAQS} />);
    fireEvent.click(screen.getByRole('button', { name: 'One?' }));
    expect(body('One?')).toHaveClass('open');

    fireEvent.click(screen.getByRole('button', { name: 'Two?' })); // one open at a time
    expect(body('One?')).not.toHaveClass('open');
    expect(body('Two?')).toHaveClass('open');

    fireEvent.click(screen.getByRole('button', { name: 'Two?' }));
    expect(body('Two?')).not.toHaveClass('open');
  });

  it('adds the scroll-reveal classes, capped at the fifth delay step', () => {
    render(<FaqList faqs={FAQS} reveal />);
    expect(item('One?').className).toBe('lp-faq-item lp-rv lp-d0');
    expect(item('Five?').className).toBe('lp-faq-item lp-rv lp-d4');
    expect(item('Six?').className).toBe('lp-faq-item lp-rv lp-d4');
  });
});
