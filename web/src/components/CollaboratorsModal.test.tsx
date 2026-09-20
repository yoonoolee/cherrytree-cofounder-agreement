import { fireEvent, render, screen } from '@testing-library/react';

import { makeProject, timestamp } from '../test/fixtures/project.ts';
import CollaboratorsModal from './CollaboratorsModal.tsx';

const mocks = vi.hoisted(() => ({ managerProps: null as null | Record<string, unknown> }));

// CollaboratorManager has its own tests; here it is a stub that records its props.
vi.mock('./CollaboratorManager', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.managerProps = props;
    return <div data-testid="collaborator-manager" />;
  },
}));

const project = {
  ...makeProject({ editDeadline: timestamp('2099-01-01T00:00:00Z') }),
  id: 'org_1',
};

function renderModal() {
  const onClose = vi.fn();
  const utils = render(<CollaboratorsModal project={project} onClose={onClose} />);
  return { onClose, ...utils };
}

beforeEach(() => {
  mocks.managerProps = null;
});

describe('CollaboratorsModal', () => {
  it('shows the heading and hands the project to CollaboratorManager', () => {
    renderModal();
    expect(screen.getByRole('heading', { name: 'Collaborators' })).toBeInTheDocument();
    expect(screen.getByTestId('collaborator-manager')).toBeInTheDocument();
    expect(mocks.managerProps).toEqual({ project });
  });

  it('closes from the close button', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from the backdrop', () => {
    const { onClose, container } = renderModal();
    fireEvent.click(container.querySelector('.fixed.inset-0')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
