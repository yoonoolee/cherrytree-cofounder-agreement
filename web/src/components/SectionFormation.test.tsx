import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FIELDS } from '@cherrytree/shared';

import { QUESTION_CONFIG } from '../config/questionConfig.ts';
import { completeSurveyData, makeSurveyData } from '../test/fixtures/project.ts';
import { cardFor, isAnswered, isExpanded, sectionProps } from '../test/sections.ts';
import SectionFormation from './SectionFormation.tsx';

vi.mock('../contexts/UserContext', () => ({
  useUser: () => ({ currentUser: { id: 'user_admin' } }),
}));

const COMPANY_NAME = QUESTION_CONFIG[FIELDS.COMPANY_NAME].question;
const ENTITY_TYPE = QUESTION_CONFIG[FIELDS.ENTITY_TYPE].question;
const REGISTERED_STATE = QUESTION_CONFIG[FIELDS.REGISTERED_STATE].question;
const ADDRESS = "What's your company mailing address?";
const DESCRIPTION = QUESTION_CONFIG[FIELDS.COMPANY_DESCRIPTION].question;
const INDUSTRIES = QUESTION_CONFIG[FIELDS.INDUSTRIES].question;
const ALL = [COMPANY_NAME, ENTITY_TYPE, REGISTERED_STATE, ADDRESS, DESCRIPTION, INDUSTRIES];

const streetInput = () => screen.getByPlaceholderText('Start typing address...');

/** A minimal Places (New) stub: one suggestion, one place with Delaware address components. */
function stubGoogle() {
  const fetchAutocompleteSuggestions = vi.fn().mockResolvedValue({
    suggestions: [
      {
        placePrediction: {
          placeId: 'place_1',
          text: { text: '1 Main St, Wilmington, DE, USA' },
          mainText: { text: '1 Main St' },
          secondaryText: { text: 'Wilmington, DE, USA' },
        },
      },
    ],
  });
  const fetchFields = vi.fn().mockResolvedValue(undefined);
  class Place {
    addressComponents = [
      { types: ['street_number'], longText: '1', shortText: '1' },
      { types: ['route'], longText: 'Main St', shortText: 'Main St' },
      { types: ['subpremise'], longText: 'Suite 4', shortText: '4' },
      { types: ['locality'], longText: 'Wilmington', shortText: 'Wilmington' },
      { types: ['administrative_area_level_1'], longText: 'Delaware', shortText: 'DE' },
      { types: ['postal_code'], longText: '19801', shortText: '19801' },
    ];
    constructor(public options: { id: string }) {}
    fetchFields = fetchFields;
  }
  window.google = {
    maps: {
      places: {},
      importLibrary: vi
        .fn()
        .mockResolvedValue({ AutocompleteSuggestion: { fetchAutocompleteSuggestions }, Place }),
    },
  } as unknown as typeof google;
  return { fetchAutocompleteSuggestions, fetchFields };
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  Reflect.deleteProperty(window, 'google');
});

describe('SectionFormation', () => {
  it('renders the heading and the six cards, all answered, with the address preview', () => {
    render(<SectionFormation {...sectionProps({ project: undefined })} />);
    expect(screen.getByRole('heading', { name: 'Formation & Purpose' })).toBeInTheDocument();
    for (const question of ALL) expect(isAnswered(cardFor(question))).toBe(true);
    expect(isExpanded(cardFor(COMPANY_NAME))).toBe(true);
    expect(cardFor(ADDRESS).querySelector('.card-answer-preview')).toHaveTextContent(
      '1 Main St Wilmington, DE 19801',
    );
    expect(streetInput()).toHaveValue('1 Main St');
  });

  it('opens on the address card when only the street is missing', () => {
    const formData = makeSurveyData({ ...completeSurveyData(), mailingStreet: '' });
    render(<SectionFormation {...sectionProps({ formData, showValidation: true })} />);
    expect(isExpanded(cardFor(ADDRESS))).toBe(true);
    expect(isAnswered(cardFor(ADDRESS))).toBe(false);
    expect(cardFor(ADDRESS)).toHaveTextContent('* Required');
  });

  it('writes street/city/state/zip edits, stripping non-digits from the zip', () => {
    const props = sectionProps({
      formData: makeSurveyData({ ...completeSurveyData(), mailingState: 'Delaware' }),
    });
    render(<SectionFormation {...props} />);
    fireEvent.change(screen.getByPlaceholderText('Apt, Suite, Floor, etc.'), {
      target: { value: 'Suite 9' },
    });
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.MAILING_STREET2, 'Suite 9');
    fireEvent.change(screen.getByPlaceholderText('San Francisco'), { target: { value: 'Dover' } });
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.MAILING_CITY, 'Dover');
    fireEvent.change(screen.getByPlaceholderText('94102'), { target: { value: '19a90-1' } });
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.MAILING_ZIP, '1990-1');
    fireEvent.click(screen.getByText('DE')); // the state select shows the abbreviation
    fireEvent.click(screen.getByText('California (CA)'));
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.MAILING_STATE, 'California');
  });

  it('syncs a hand-typed street on blur and clears it when emptied', () => {
    const props = sectionProps();
    render(<SectionFormation {...props} />);
    fireEvent.change(streetInput(), { target: { value: '2 Elm' } });
    expect(props.handleChange).not.toHaveBeenCalled();
    fireEvent.blur(streetInput());
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.MAILING_STREET, '2 Elm');
    fireEvent.change(streetInput(), { target: { value: '' } });
    expect(props.handleChange).toHaveBeenLastCalledWith(FIELDS.MAILING_STREET, '');
  });

  it('works without the Google Maps script: typing shows no suggestions', () => {
    render(<SectionFormation {...sectionProps()} />);
    fireEvent.change(streetInput(), { target: { value: '1 Main Street' } });
    expect(screen.queryByText('Wilmington, DE, USA')).not.toBeInTheDocument();
  });

  it('fetches US suggestions after 3 characters and fills the address from the chosen place', async () => {
    const google = stubGoogle();
    const props = sectionProps();
    render(<SectionFormation {...props} />);
    await waitFor(() => expect(window.google!.maps.importLibrary).toHaveBeenCalledWith('places'));

    fireEvent.change(streetInput(), { target: { value: '1 ' } });
    expect(google.fetchAutocompleteSuggestions).not.toHaveBeenCalled();

    fireEvent.change(streetInput(), { target: { value: '1 Ma' } });
    expect(google.fetchAutocompleteSuggestions).toHaveBeenCalledWith({
      input: '1 Ma',
      includedRegionCodes: ['us'],
    });
    // Main line and secondary line come from the prediction's structured parts.
    expect(await screen.findByText('1 Main St')).toHaveClass('text-gray-900');
    expect(screen.getByText('Wilmington, DE, USA')).toHaveClass('text-gray-500');

    fireEvent.keyDown(streetInput(), { key: 'ArrowDown' });
    fireEvent.keyDown(streetInput(), { key: 'Enter' });
    await waitFor(() =>
      expect(props.handleChange).toHaveBeenCalledWith(FIELDS.MAILING_ZIP, '19801'),
    );
    expect(google.fetchFields).toHaveBeenCalledWith({ fields: ['addressComponents'] });
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.MAILING_STREET, '1 Main St');
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.MAILING_STREET2, 'Suite 4');
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.MAILING_CITY, 'Wilmington');
    expect(props.handleChange).toHaveBeenCalledWith(FIELDS.MAILING_STATE, 'Delaware');
    expect(streetInput()).toHaveValue('1 Main St');
    expect(screen.queryByText('Wilmington, DE, USA')).not.toBeInTheDocument();
  });

  it('selects a suggestion with the mouse and closes the list on Escape', async () => {
    const google = stubGoogle();
    const props = sectionProps();
    render(<SectionFormation {...props} />);
    await waitFor(() => expect(window.google!.maps.importLibrary).toHaveBeenCalled());
    fireEvent.change(streetInput(), { target: { value: '1 Main' } });
    await screen.findByText('1 Main St');
    fireEvent.keyDown(streetInput(), { key: 'Escape' });
    expect(screen.queryByText('1 Main St')).not.toBeInTheDocument();
    fireEvent.focus(streetInput()); // re-opens the list for a long enough input
    fireEvent.mouseDown(screen.getByText('1 Main St'));
    await waitFor(() =>
      expect(props.handleChange).toHaveBeenCalledWith(FIELDS.MAILING_CITY, 'Wilmington'),
    );
    expect(google.fetchFields).toHaveBeenCalledTimes(1);
  });

  it('advances through the cards on Enter', () => {
    render(<SectionFormation {...sectionProps()} />);
    for (let i = 0; i < ALL.length - 1; i++) {
      fireEvent.keyDown(cardFor(ALL[i]!), { key: 'Enter' });
      expect(isExpanded(cardFor(ALL[i + 1]!))).toBe(true);
    }
  });

  it('disables every input when read-only and never loads autocomplete', () => {
    stubGoogle();
    const { container } = render(<SectionFormation {...sectionProps({ isReadOnly: true })} />);
    for (const input of container.querySelectorAll('input')) expect(input).toBeDisabled();
    expect(window.google!.maps.importLibrary).not.toHaveBeenCalled();
  });
});
