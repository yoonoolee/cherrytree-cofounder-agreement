import { fireEvent, render, screen } from '@testing-library/react';
import { FIELDS } from '@cherrytree/shared';

import { QUESTION_CONFIG } from '../config/questionConfig.ts';
import { ADMIN_ID, MEMBER_ID, makeProject, makeSurveyData } from '../test/fixtures/project.ts';
import QuestionRenderer, { type QuestionRendererProps } from './QuestionRenderer.tsx';

type Config = NonNullable<QuestionRendererProps['config']>;

const mocks = vi.hoisted(() => ({ currentUser: { id: 'user_admin' } as { id: string } | null }));

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ currentUser: mocks.currentUser }),
}));

const project = makeProject();

function renderQuestion(
  fieldName: QuestionRendererProps['fieldName'],
  config: Config | undefined,
  overrides: Partial<QuestionRendererProps> = {},
) {
  const handleChange = vi.fn();
  const utils = render(
    <QuestionRenderer
      fieldName={fieldName}
      config={config}
      formData={makeSurveyData()}
      handleChange={handleChange}
      isReadOnly={false}
      showValidation={false}
      project={project}
      {...overrides}
    />,
  );
  return { handleChange, ...utils };
}

beforeEach(() => {
  mocks.currentUser = { id: ADMIN_ID };
});

describe('QuestionRenderer', () => {
  it('renders nothing without a config', () => {
    const { container } = renderQuestion(FIELDS.COMPANY_NAME, undefined);
    expect(container).toBeEmptyDOMElement();
  });

  describe('conditionalOn', () => {
    const config: Config = {
      section: 'formation',
      question: 'Which other entity type?',
      type: 'text',
      required: false,
      conditionalOn: { field: FIELDS.ENTITY_TYPE, value: 'Other' },
    };

    it('hides the question while the controlling field does not match', () => {
      const { container } = renderQuestion(FIELDS.ENTITY_TYPE_OTHER, config, {
        formData: makeSurveyData({ entityType: 'LLC' }),
      });
      expect(container).toBeEmptyDOMElement();
    });

    it('shows the question once the controlling field matches', () => {
      renderQuestion(FIELDS.ENTITY_TYPE_OTHER, config, {
        formData: makeSurveyData({ entityType: 'Other' }),
      });
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('treats a missing value as "any truthy value"', () => {
      const anyTruthy: Config = {
        ...config,
        conditionalOn: { field: FIELDS.ENTITY_TYPE },
      };
      const { container } = renderQuestion(FIELDS.ENTITY_TYPE_OTHER, anyTruthy);
      expect(container).toBeEmptyDOMElement();
      renderQuestion(FIELDS.ENTITY_TYPE_OTHER, anyTruthy, {
        formData: makeSurveyData({ entityType: 'LLC' }),
      });
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('text inputs', () => {
    const config = QUESTION_CONFIG[FIELDS.COMPANY_NAME];

    it('renders the label, value and placeholder and reports edits', () => {
      const { handleChange } = renderQuestion(FIELDS.COMPANY_NAME, config, {
        formData: makeSurveyData({ companyName: 'Acme' }),
      });
      expect(screen.getByText(config.question!)).toBeInTheDocument();
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('Acme');
      expect(input).toHaveAttribute('placeholder', config.placeholder);
      fireEvent.change(input, { target: { value: 'Acme Inc' } });
      expect(handleChange).toHaveBeenCalledWith(FIELDS.COMPANY_NAME, 'Acme Inc');
    });

    it('hides the label with hideLabel and disables the input when read-only', () => {
      renderQuestion(FIELDS.COMPANY_NAME, config, { hideLabel: true, isReadOnly: true });
      expect(screen.queryByText(config.question!)).toBeNull();
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('marks a required empty field only while validation is shown', () => {
      const { rerender } = renderQuestion(FIELDS.COMPANY_NAME, config);
      expect(screen.queryByText('*')).toBeNull();
      rerender(
        <QuestionRenderer
          fieldName={FIELDS.COMPANY_NAME}
          config={config}
          formData={makeSurveyData()}
          handleChange={() => {}}
          isReadOnly={false}
          showValidation
        />,
      );
      expect(screen.getByText('*')).toHaveClass('text-red-700');
    });

    it('renders a textarea for textarea questions', () => {
      const { handleChange } = renderQuestion(FIELDS.COMPANY_DESCRIPTION, {
        ...QUESTION_CONFIG[FIELDS.COMPANY_DESCRIPTION],
        type: 'textarea',
      });
      const area = screen.getByRole('textbox');
      expect(area.tagName).toBe('TEXTAREA');
      fireEvent.change(area, { target: { value: 'Widgets' } });
      expect(handleChange).toHaveBeenCalledWith(FIELDS.COMPANY_DESCRIPTION, 'Widgets');
    });
  });

  describe('radio', () => {
    const config = QUESTION_CONFIG[FIELDS.ENTITY_TYPE]; // has otherField

    it('selects an option, clears it on a second click and resets the Other field', () => {
      const { handleChange } = renderQuestion(FIELDS.ENTITY_TYPE, config);
      fireEvent.click(screen.getByLabelText('LLC'));
      expect(handleChange).toHaveBeenCalledWith(FIELDS.ENTITY_TYPE, 'LLC');
      expect(handleChange).toHaveBeenCalledWith(FIELDS.ENTITY_TYPE_OTHER, '');
      expect(screen.queryByPlaceholderText('Please specify')).toBeNull();
    });

    it('clears the selection when the chosen option is clicked again', () => {
      const { handleChange } = renderQuestion(FIELDS.ENTITY_TYPE, config, {
        formData: makeSurveyData({ entityType: 'LLC' }),
      });
      expect(screen.getByLabelText('LLC')).toBeChecked();
      fireEvent.click(screen.getByLabelText('LLC'));
      expect(handleChange).toHaveBeenCalledWith(FIELDS.ENTITY_TYPE, '');
    });

    it('shows the "Please specify" input for Other and forwards its text', () => {
      const { handleChange } = renderQuestion(FIELDS.ENTITY_TYPE, config, {
        formData: makeSurveyData({ entityType: 'Other', entityTypeOther: 'Trust' }),
      });
      const other = screen.getByPlaceholderText('Please specify');
      expect(other).toHaveValue('Trust');
      fireEvent.change(other, { target: { value: 'Co-op' } });
      expect(handleChange).toHaveBeenCalledWith(FIELDS.ENTITY_TYPE_OTHER, 'Co-op');
    });

    it('ignores clicks when read-only', () => {
      const { handleChange } = renderQuestion(FIELDS.ENTITY_TYPE, config, { isReadOnly: true });
      fireEvent.click(screen.getByLabelText('LLC'));
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('renders option descriptions for object options', () => {
      const withDescriptions: Config = {
        section: 'formation',
        question: 'Pick one',
        type: 'radio',
        required: false,
        options: [{ value: 'a', label: 'Option A', description: 'The first one' }, 'B'],
      };
      renderQuestion(FIELDS.ENTITY_TYPE, withDescriptions);
      expect(screen.getByText('The first one')).toBeInTheDocument();
      expect(screen.getByLabelText(/Option A/)).toHaveAttribute('value', 'a');
      expect(screen.getByLabelText('B')).toHaveAttribute('value', 'B');
    });

    it('re-initializes acknowledgments when the clearsFields value is chosen, nulls them otherwise', () => {
      const config = QUESTION_CONFIG[FIELDS.HAS_PRE_EXISTING_IP];
      const { handleChange } = renderQuestion(FIELDS.HAS_PRE_EXISTING_IP, config);
      fireEvent.click(screen.getByLabelText('Yes'));
      expect(handleChange).toHaveBeenCalledWith(FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT, {
        [ADMIN_ID]: false,
        [MEMBER_ID]: false,
      });

      handleChange.mockClear();
      fireEvent.click(screen.getByLabelText('No'));
      expect(handleChange).toHaveBeenCalledWith(FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT, null);
    });

    it('flags Other without its text as invalid', () => {
      renderQuestion(FIELDS.ENTITY_TYPE, config, {
        showValidation: true,
        formData: makeSurveyData({ entityType: 'Other', entityTypeOther: '  ' }),
      });
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('checkbox', () => {
    const config = QUESTION_CONFIG[FIELDS.INDUSTRIES]; // has otherField

    it('adds and removes values keeping the option order', () => {
      const [first, second, third] = config.options as readonly string[];
      const { handleChange } = renderQuestion(FIELDS.INDUSTRIES, config, {
        formData: makeSurveyData({ industries: [third!] }),
      });
      fireEvent.click(screen.getByLabelText(first!));
      expect(handleChange).toHaveBeenCalledWith(FIELDS.INDUSTRIES, [first, third]);

      handleChange.mockClear();
      fireEvent.click(screen.getByLabelText(third!));
      expect(handleChange).toHaveBeenCalledWith(FIELDS.INDUSTRIES, []);
      expect(screen.getByLabelText(second!)).not.toBeChecked();
    });

    it('clears the Other text when Other is unticked', () => {
      const { handleChange } = renderQuestion(FIELDS.INDUSTRIES, config, {
        formData: makeSurveyData({ industries: ['Other'], industryOther: 'Space' }),
      });
      expect(screen.getByPlaceholderText('Please specify')).toHaveValue('Space');
      fireEvent.click(screen.getByLabelText('Other'));
      expect(handleChange).toHaveBeenCalledWith(FIELDS.INDUSTRIES, []);
      expect(handleChange).toHaveBeenCalledWith(FIELDS.INDUSTRY_OTHER, '');
    });

    it('flags an empty selection, and Other without text, as invalid', () => {
      const { unmount } = renderQuestion(FIELDS.INDUSTRIES, config, { showValidation: true });
      expect(screen.getByText('*')).toBeInTheDocument();
      unmount();
      renderQuestion(FIELDS.INDUSTRIES, config, {
        showValidation: true,
        formData: makeSurveyData({ industries: ['Other'], industryOther: '' }),
      });
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('dropdown', () => {
    it('renders the state list through CustomSelect and forwards the choice', () => {
      const config = QUESTION_CONFIG[FIELDS.REGISTERED_STATE];
      const { handleChange } = renderQuestion(FIELDS.REGISTERED_STATE, config, {
        formData: makeSurveyData({ registeredState: 'Delaware' }),
      });
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveTextContent('Delaware (DE)');
      fireEvent.click(trigger);
      fireEvent.click(screen.getByText('Nevada (NV)'));
      expect(handleChange).toHaveBeenCalledWith(FIELDS.REGISTERED_STATE, 'Nevada');
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    // No shipped dropdown has an Other option; the branch exists, so pin it with a local config.
    const config: Config = {
      section: 'general-provisions',
      question: 'How should disputes be resolved?',
      type: 'dropdown',
      required: true,
      options: [
        { value: 'Mediation', label: 'Mediation' },
        { value: 'Other', label: 'Other' },
      ],
      otherField: FIELDS.DISPUTE_RESOLUTION_OTHER,
    };

    it('clears the Other text for non-Other choices', () => {
      const { handleChange } = renderQuestion(FIELDS.DISPUTE_RESOLUTION, config);
      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Mediation'));
      expect(handleChange).toHaveBeenCalledWith(FIELDS.DISPUTE_RESOLUTION, 'Mediation');
      expect(handleChange).toHaveBeenCalledWith(FIELDS.DISPUTE_RESOLUTION_OTHER, '');
    });

    it('shows the Other input when Other is selected', () => {
      const { handleChange } = renderQuestion(FIELDS.DISPUTE_RESOLUTION, config, {
        formData: makeSurveyData({ disputeResolution: 'Other' }),
      });
      fireEvent.change(screen.getByPlaceholderText('Please specify'), {
        target: { value: 'Coin toss' },
      });
      expect(handleChange).toHaveBeenCalledWith(FIELDS.DISPUTE_RESOLUTION_OTHER, 'Coin toss');
    });
  });

  describe('acknowledgment', () => {
    const config = QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_CONFIDENTIALITY];

    it('lists every collaborator, enabling only the current user, and writes the whole map', () => {
      const { handleChange } = renderQuestion(FIELDS.ACKNOWLEDGE_CONFIDENTIALITY, config, {
        formData: makeSurveyData({ acknowledgeConfidentiality: { [MEMBER_ID]: true } }),
      });
      const mine = screen.getByLabelText(/Ada Lovelace/);
      const theirs = screen.getByLabelText(/Grace Hopper/);
      expect(mine).toBeEnabled();
      expect(theirs).toBeDisabled();
      expect(theirs).toBeChecked();
      expect(screen.getByText('(Admin)')).toBeInTheDocument();

      fireEvent.click(mine);
      expect(handleChange).toHaveBeenCalledWith(FIELDS.ACKNOWLEDGE_CONFIDENTIALITY, {
        [MEMBER_ID]: true,
        [ADMIN_ID]: true,
      });
    });

    it('renders the acknowledgment text, calling it with the form data when it is a function', () => {
      const dynamic: Config = {
        ...config,
        acknowledgmentText: (data) => `Governed by ${data.governingLaw}`,
      };
      renderQuestion(FIELDS.ACKNOWLEDGE_CONFIDENTIALITY, dynamic, {
        formData: makeSurveyData({ governingLaw: 'Delaware' }),
      });
      expect(screen.getByText('Governed by Delaware')).toBeInTheDocument();
    });

    it('shows "* Required" until every collaborator has ticked', () => {
      const { unmount } = renderQuestion(FIELDS.ACKNOWLEDGE_CONFIDENTIALITY, config, {
        showValidation: true,
        formData: makeSurveyData({ acknowledgeConfidentiality: { [ADMIN_ID]: true } }),
      });
      expect(screen.getByText('* Required')).toBeInTheDocument();
      unmount();
      renderQuestion(FIELDS.ACKNOWLEDGE_CONFIDENTIALITY, config, {
        showValidation: true,
        formData: makeSurveyData({
          acknowledgeConfidentiality: { [ADMIN_ID]: true, [MEMBER_ID]: true },
        }),
      });
      expect(screen.queryByText('* Required')).toBeNull();
    });

    it('disables every box when read-only', () => {
      renderQuestion(FIELDS.ACKNOWLEDGE_CONFIDENTIALITY, config, { isReadOnly: true });
      expect(screen.getByLabelText(/Ada Lovelace/)).toBeDisabled();
    });
  });

  it('renders nothing for custom questions and a notice for unknown types', () => {
    const { container, unmount } = renderQuestion(
      FIELDS.COMPENSATIONS,
      QUESTION_CONFIG[FIELDS.COMPENSATIONS],
      { formData: makeSurveyData({ takingCompensation: 'Yes' }) },
    );
    expect(container).toBeEmptyDOMElement();
    unmount();
    renderQuestion(FIELDS.COMPANY_NAME, {
      ...QUESTION_CONFIG[FIELDS.COMPANY_NAME],
      type: 'slider' as never,
    });
    expect(screen.getByText('Unknown question type: slider')).toBeInTheDocument();
  });
});
