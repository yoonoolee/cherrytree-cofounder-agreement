import { fireEvent, render, screen, within } from '@testing-library/react';
import { FIELDS, ROLES } from '@cherrytree/shared';

import { ADMIN_ID, completeSurveyData, makeSurveyData } from '../test/fixtures/project.ts';
import { sectionProps } from '../test/sections.ts';
import SectionCofounders from './SectionCofounders.tsx';

const ENGINEERING = ROLES[2]!;

/** The card whose header shows `name`. */
const cardFor = (name: string) => screen.getByText(name).closest('.question-card') as HTMLElement;

describe('SectionCofounders', () => {
  it('renders one collapsed card per cofounder with a title/email/roles preview', () => {
    render(<SectionCofounders {...sectionProps()} />);
    expect(screen.getByRole('heading', { name: 'Cofounder Information' })).toBeInTheDocument();
    const first = cardFor('Founder 1');
    expect(first).toHaveClass('answered');
    expect(first).not.toHaveClass('expanded');
    expect(first.querySelector('.card-answer-preview')).toHaveTextContent(
      'CEO founder1@example.com Engineering',
    );
    expect(cardFor('Founder 2')).toBeInTheDocument();
    // Two cofounders for two collaborators: nothing more can be added.
    expect(screen.queryByRole('button', { name: /Add Cofounder/ })).not.toBeInTheDocument();
  });

  it('expands a card on click and commits field edits into the cofounders array', () => {
    const props = sectionProps();
    render(<SectionCofounders {...props} />);
    fireEvent.click(screen.getByText('Founder 1'));
    const first = cardFor('Founder 1');
    expect(first).toHaveClass('expanded');
    fireEvent.change(within(first).getByPlaceholderText('Chief Executive Officer'), {
      target: { value: 'CTO' },
    });
    const [firstCofounder, second] = props.formData.cofounders;
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.COFOUNDERS, [
      { ...firstCofounder, title: 'CTO' },
      second,
    ]);
  });

  it('toggles roles and clears the Other text when Other is unticked', () => {
    const cofounders = completeSurveyData().cofounders.map((cf) => ({
      ...cf,
      roles: [ENGINEERING, 'Other'],
      rolesOther: 'Design',
    }));
    const props = sectionProps({
      formData: makeSurveyData({ ...completeSurveyData(), cofounders }),
    });
    render(<SectionCofounders {...props} />);
    fireEvent.click(screen.getByText('Founder 1'));
    const first = cardFor('Founder 1');
    expect(within(first).getByPlaceholderText('Please specify')).toHaveValue('Design');
    fireEvent.click(within(first).getByLabelText('Other'));
    expect(props.handleChange).toHaveBeenNthCalledWith(1, FIELDS.COFOUNDERS, [
      { ...cofounders[0], roles: [ENGINEERING] },
      cofounders[1],
    ]);
    expect(props.handleChange).toHaveBeenNthCalledWith(2, FIELDS.COFOUNDERS, [
      { ...cofounders[0], rolesOther: '' },
      cofounders[1],
    ]);
  });

  it('removes a cofounder and updates the count', () => {
    const props = sectionProps();
    render(<SectionCofounders {...props} />);
    fireEvent.click(screen.getByText('Founder 1'));
    fireEvent.click(within(cardFor('Founder 1')).getByRole('button', { name: 'Remove' }));
    expect(props.handleChange).toHaveBeenNthCalledWith(1, FIELDS.COFOUNDERS, [
      props.formData.cofounders[1],
    ]);
    expect(props.handleChange).toHaveBeenNthCalledWith(2, FIELDS.COFOUNDER_COUNT, '1');
  });

  it('adds a cofounder with a generated id and bumps the count', () => {
    const props = sectionProps({ formData: completeSurveyData([ADMIN_ID]) });
    render(<SectionCofounders {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /Add Cofounder/ }));
    const form = screen.getByText('New Cofounder').closest('.question-card') as HTMLElement;
    fireEvent.change(within(form).getByPlaceholderText('First Last'), {
      target: { value: 'Grace Hopper' },
    });
    fireEvent.change(within(form).getByPlaceholderText('first@company.com'), {
      target: { value: 'grace@example.com' },
    });
    fireEvent.click(within(form).getByLabelText(ENGINEERING));
    fireEvent.click(within(form).getByRole('button', { name: 'Add Cofounder' }));
    expect(props.handleChange).toHaveBeenNthCalledWith(1, FIELDS.COFOUNDERS, [
      props.formData.cofounders[0],
      {
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        fullName: 'Grace Hopper',
        title: '',
        email: 'grace@example.com',
        roles: [ENGINEERING],
        rolesOther: '',
      },
    ]);
    expect(props.handleChange).toHaveBeenNthCalledWith(2, FIELDS.COFOUNDER_COUNT, '2');
    expect(screen.queryByText('New Cofounder')).not.toBeInTheDocument();
  });

  it('cancelling the add form discards it', () => {
    render(<SectionCofounders {...sectionProps({ formData: makeSurveyData() })} />);
    expect(screen.getByText('Click "Add Cofounder" to get started.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Add Cofounder/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('New Cofounder')).not.toBeInTheDocument();
  });

  it('flags incomplete cofounders when validation is on and extra ones always', () => {
    const cofounders = [
      ...completeSurveyData().cofounders,
      { id: 'x', fullName: '', title: '', email: '', roles: [], rolesOther: '' },
    ];
    render(
      <SectionCofounders
        {...sectionProps({ formData: makeSurveyData({ cofounders }), showValidation: true })}
      />,
    );
    expect(
      screen.getByText('Please remove cofounders deleted from the project.'),
    ).toBeInTheDocument();
    expect(cardFor('New Cofounder')).not.toHaveClass('answered');
    expect(within(cardFor('New Cofounder')).getByText('*')).toBeInTheDocument();
    expect(within(cardFor('Founder 1')).queryByText('*')).not.toBeInTheDocument();
  });

  it('hides Add and Remove and disables inputs when read-only', () => {
    const { container } = render(
      <SectionCofounders
        {...sectionProps({ formData: completeSurveyData([ADMIN_ID]), isReadOnly: true })}
      />,
    );
    expect(screen.queryByRole('button', { name: /Add Cofounder/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    for (const input of container.querySelectorAll('input')) expect(input).toBeDisabled();
  });
});
