import { fireEvent, render, screen } from '@testing-library/react';

import QuestionCard from './QuestionCard.tsx';

const baseProps = {
  question: 'What is the company name?',
  answerPreview: 'Acme',
  isExpanded: false,
  isAnswered: true,
};

beforeEach(() => {
  vi.useFakeTimers();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('QuestionCard', () => {
  it('shows the question and answer preview and reflects state in the class list', () => {
    const { container } = render(
      <QuestionCard {...baseProps}>
        <input aria-label="answer" />
      </QuestionCard>,
    );
    expect(screen.getByText('What is the company name?')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toHaveClass('card-answer-preview');
    expect(container.firstChild).toHaveClass('question-card', 'answered');
    expect(container.firstChild).not.toHaveClass('expanded');
  });

  it('calls onExpand when the header is clicked while collapsed, onCollapse when expanded', () => {
    const onExpand = vi.fn();
    const onCollapse = vi.fn();
    const { rerender } = render(
      <QuestionCard {...baseProps} onExpand={onExpand} onCollapse={onCollapse} />,
    );
    fireEvent.click(screen.getByText('What is the company name?'));
    expect(onExpand).toHaveBeenCalledTimes(1);
    expect(onCollapse).not.toHaveBeenCalled();

    rerender(
      <QuestionCard {...baseProps} isExpanded onExpand={onExpand} onCollapse={onCollapse} />,
    );
    fireEvent.click(screen.getByText('What is the company name?'));
    expect(onCollapse).toHaveBeenCalledTimes(1);
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('ignores header clicks when alwaysExpanded and marks the card static', () => {
    const onExpand = vi.fn();
    const onCollapse = vi.fn();
    const { container } = render(
      <QuestionCard
        {...baseProps}
        alwaysExpanded
        flat
        onExpand={onExpand}
        onCollapse={onCollapse}
      />,
    );
    fireEvent.click(screen.getByText('What is the company name?'));
    expect(onExpand).not.toHaveBeenCalled();
    expect(onCollapse).not.toHaveBeenCalled();
    expect(container.firstChild).toHaveClass('expanded', 'static', 'flat');
  });

  it('advances on Enter while expanded, except inside a textarea', () => {
    const onAdvance = vi.fn();
    render(
      <QuestionCard {...baseProps} isExpanded onAdvance={onAdvance}>
        <input aria-label="short" />
        <textarea aria-label="long" />
      </QuestionCard>,
    );
    fireEvent.keyDown(screen.getByLabelText('long'), { key: 'Enter' });
    expect(onAdvance).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByLabelText('short'), { key: 'Enter' });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('does not advance on Enter while collapsed', () => {
    const onAdvance = vi.fn();
    render(
      <QuestionCard {...baseProps} onAdvance={onAdvance}>
        <input aria-label="short" />
      </QuestionCard>,
    );
    fireEvent.keyDown(screen.getByLabelText('short'), { key: 'Enter' });
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('renders tooltip and standard hints and removes the top margin when either is set', () => {
    render(
      <QuestionCard {...baseProps} isExpanded tooltip="Why we ask" standard="Usually 4 years">
        <input aria-label="answer" />
      </QuestionCard>,
    );
    expect(screen.getByText('Why we ask')).toHaveClass('card-hint');
    expect(screen.getByText('Usually 4 years')).toHaveClass('card-hint');
    expect(screen.getByLabelText('answer').parentElement).toHaveStyle({ marginTop: '0' });
  });

  it('shows the sub-question row with its own preview', () => {
    render(<QuestionCard {...baseProps} subQuestion="Which one?" subAnswerPreview="LLC" />);
    expect(screen.getByText('Which one?').parentElement).toHaveClass('sub-question-row');
    expect(screen.getByText('LLC')).toBeInTheDocument();
  });

  it('scrolls into view shortly after expanding', () => {
    render(<QuestionCard {...baseProps} isExpanded />);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest',
    });
  });
});
