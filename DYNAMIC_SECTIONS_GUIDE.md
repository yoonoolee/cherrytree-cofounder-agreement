# Dynamic Section Rendering Guide

Your codebase now has a **fully automatic question rendering system**. You can now add/modify/reorder questions by only editing `questionConfig.js` - no more writing manual JSX!

## What Changed

### Before (Manual JSX)
Every section component had 200-300 lines of repetitive JSX:
```jsx
// SectionDecisionMaking.js - 260 lines of manual JSX
<label className="block text-base font-medium text-gray-900 mb-2">
  What type of decisions require a discussion between all cofounders?
  {showValidation && ... && <span className="text-red-700 ml-0.5">*</span>}
  <Tooltip text="..." />
</label>
<div className="space-y-2">
  {MAJOR_DECISIONS.map((decision) => (
    <label key={decision} className="flex items-center">
      <input type="checkbox" ... />
      // ... 20 more lines per question
```

### After (Config-Driven)
```jsx
// Just 7 lines!
import DynamicSection from './DynamicSection';
import { SECTION_IDS } from '../config/sectionConfig';

function SectionDecisionMaking({ formData, handleChange, isReadOnly, showValidation, project }) {
  return <DynamicSection sectionId={SECTION_IDS.DECISION_MAKING} {...{formData, handleChange, isReadOnly, showValidation, project}} />;
}
```

## How It Works

### 1. QuestionRenderer Component
Automatically renders any question type based on its config:
- **Text inputs**: `type: 'text'`, `'number'`, `'date'`, `'textarea'`
- **Radio buttons**: `type: 'radio'` with simple options or object format with descriptions
- **Checkboxes**: `type: 'checkbox'` for multi-select
- **Dropdowns**: `type: 'dropdown'` using CustomSelect
- **Acknowledgments**: `type: 'acknowledgment'` for collaborator checkboxes
- **Custom**: `type: 'custom'` to pass through to parent (for complex components)

### 2. DynamicSection Component
Reads `questionConfig.js` and renders all questions for a section automatically:
- Fetches questions via `getQuestionsBySection(sectionId)`
- Renders section title and description from `sectionConfig`
- Passes each question to `QuestionRenderer`
- Supports custom components for special cases

### 3. Configuration Files

**sectionConfig.js** - Section metadata
```javascript
export const SECTIONS = {
  [SECTION_IDS.FORMATION]: {
    displayName: 'Formation & Purpose',
    icon: '🏢',
    description: "You've been talking about this idea for weeks...",
  },
  // ...
};
```

**questionConfig.js** - Question definitions
```javascript
export const QUESTION_CONFIG = {
  [FIELDS.COMPANY_NAME]: {
    section: SECTION_IDS.FORMATION,
    question: "What's your company's name?",
    type: INPUT_TYPES.TEXT,
    required: true,
    placeholder: 'Acme Inc.',
  },
  // ...
};
```

## Adding a New Question

Just add to `questionConfig.js`:

```javascript
[FIELDS.NEW_QUESTION]: {
  section: SECTION_IDS.YOUR_SECTION,
  question: "Your question here?",
  type: INPUT_TYPES.TEXT, // or radio, checkbox, etc.
  required: true,
  tooltip: "Optional helpful tooltip",
  helperText: "Optional text below question",
  placeholder: "Optional placeholder",
},
```

**That's it!** The UI will automatically render it.

## Supported Features

### Radio Options with Descriptions
```javascript
{
  type: INPUT_TYPES.RADIO,
  options: [
    { value: 'yes', label: 'Yes', description: 'Voting weight tied to equity %' },
    { value: 'no', label: 'No', description: 'All founders have equal vote' }
  ],
}
```

### Conditional Fields
Only show a question when another field has a specific value:
```javascript
{
  type: INPUT_TYPES.ACKNOWLEDGMENT,
  conditionalOn: { field: FIELDS.INCLUDE_SHOTGUN_CLAUSE, value: 'Yes' },
  acknowledgmentText: "I acknowledge...",
}
```

Or check if field has any value:
```javascript
{
  conditionalOn: { field: FIELDS.TIE_RESOLUTION }, // Shows if tieResolution has any value
}
```

### Dynamic Acknowledgment Text
Reference other form values:
```javascript
{
  type: INPUT_TYPES.ACKNOWLEDGMENT,
  acknowledgmentText: (formData) =>
    `In the event of a deadlock, the tie shall be resolved by ${formData[FIELDS.TIE_RESOLUTION]}.`,
}
```

### "Other" Option
Automatically shows text input when "Other" is selected:
```javascript
{
  options: MAJOR_DECISIONS, // One option is "Other"
  otherField: FIELDS.MAJOR_DECISIONS_OTHER, // Field for "Other" text
}
```

### Helper Text
```javascript
{
  question: "Select your options",
  helperText: "Select all that apply",
  type: INPUT_TYPES.CHECKBOX,
}
```

### Tooltips
```javascript
{
  question: "Your question?",
  tooltip: "Additional context shown on hover",
}
```

## Using DynamicSection

### Simple Section (Fully Automatic)
```jsx
import DynamicSection from './DynamicSection';
import { SECTION_IDS } from '../config/sectionConfig';

function SectionPerformance({ formData, handleChange, isReadOnly, showValidation, project }) {
  return (
    <DynamicSection
      sectionId={SECTION_IDS.PERFORMANCE}
      formData={formData}
      handleChange={handleChange}
      isReadOnly={isReadOnly}
      showValidation={showValidation}
      project={project}
    />
  );
}
```

### Section with Custom Components
For complex fields (like address autocomplete or equity calculator):
```jsx
import DynamicSection from './DynamicSection';
import AddressAutocomplete from './AddressAutocomplete';

function SectionFormation(props) {
  return (
    <DynamicSection
      sectionId={SECTION_IDS.FORMATION}
      {...props}
      customComponents={{
        // Provide custom component for specific fields
        mailingStreet: <AddressAutocomplete {...props} />,
        // Other fields will auto-render from config
      }}
    />
  );
}
```

### Custom Title/Description
Override config values:
```jsx
<DynamicSection
  sectionId={SECTION_IDS.FORMATION}
  customTitle="Custom Title"
  customDescription="Custom description text"
  {...props}
/>
```

## Migration Checklist

To migrate an existing section to dynamic rendering:

1. **Check questionConfig.js** - Ensure all questions are defined
2. **Add missing fields** - acknowledgmentText, tooltips, helperText, etc.
3. **Identify custom components** - Find fields that need special handling
4. **Replace section component**:
   ```jsx
   // Old: 300 lines of JSX
   // New:
   return <DynamicSection sectionId={SECTION_IDS.YOUR_SECTION} {...props} />;
   ```
5. **Add customComponents** if needed for complex fields
6. **Test** - Verify all questions render correctly

## Benefits

✅ **Add questions in seconds** - Just edit questionConfig.js
✅ **No duplicate code** - One renderer for all questions
✅ **Consistent styling** - All questions look the same
✅ **Easy maintenance** - Change one place, updates everywhere
✅ **Type safety** - Use FIELDS constants for field names
✅ **Validation** - Automatic validation indicators
✅ **Conditional logic** - Built-in conditional rendering

## Current Status

- ✅ QuestionRenderer component created
- ✅ DynamicSection wrapper created
- ✅ sectionConfig updated with descriptions
- ✅ questionConfig enhanced with acknowledgmentText and conditionals
- ⏳ Section components still use manual JSX (can be migrated individually)

You can now migrate sections one by one to use `DynamicSection`, or keep using manual JSX for sections that need heavy customization.
