# Edit Window Feature - Testing Guide

## Overview

Users have a configurable time window from **purchase date** to edit their agreement. The deadline is calculated once at purchase and stored in Firestore as `editDeadline`.

## Configuration

**Location**: `functions/index.js` (lines 50-72)

```javascript
const EDIT_WINDOW_CONFIG = {
  amount: 6,
  unit: 'months'
};
```

### Supported Units
- `'years'` - For long-term windows (e.g., 1 year)
- `'months'` - For production (e.g., 6 months) **← CURRENT**
- `'days'` - For testing (e.g., 1 day)
- `'hours'` - For quick testing (e.g., 2 hours)
- `'minutes'` - For rapid testing (e.g., 30 minutes)

## Quick Testing Setup

### For Fast Testing (1 Day Window)

Edit `functions/index.js`:
```javascript
const EDIT_WINDOW_CONFIG = {
  amount: 1,
  unit: 'days'
};
```

### For Ultra-Fast Testing (2 Hours Window)

```javascript
const EDIT_WINDOW_CONFIG = {
  amount: 2,
  unit: 'hours'
};
```

**IMPORTANT**: Deploy cloud functions after changing config:
```bash
firebase deploy --only functions
```

## Testing Scenarios

### 1. New Project Creation (Within Edit Window)

**Steps**:
1. Set `EDIT_WINDOW_CONFIG` to `{ amount: 1, unit: 'days' }`
2. Deploy functions: `firebase deploy --only functions`
3. Purchase a new project via Stripe checkout
4. Verify project in Firestore has:
   - `createdAt`: Current timestamp
   - `editDeadline`: createdAt + 1 day

**Expected Behavior**:
- ✅ Can edit survey fields
- ✅ Can add/remove collaborators
- ✅ Can submit and re-edit
- ✅ All form inputs are enabled

### 2. Project Past Edit Deadline

**Option A - Wait for expiration** (If using hours/minutes):
1. Create project with `{ amount: 2, unit: 'hours' }`
2. Wait 2+ hours
3. Refresh the page

**Option B - Manual Firestore edit** (Fastest):
1. Open Firebase Console → Firestore
2. Find your project document
3. Edit `editDeadline` field to a past date (e.g., yesterday)
4. Save and refresh your app

**Expected Behavior**:
- ❌ Survey fields are read-only (disabled)
- ❌ Cannot add collaborators (button disabled)
- ❌ Cannot remove collaborators (button disabled)
- ❌ Cannot revoke pending invitations (button disabled)
- ❌ Backend blocks collaborator changes (returns error)

### 3. Legacy Projects (No Edit Deadline)

**Steps**:
1. Find an old project in Firestore without `editDeadline` field
2. OR manually delete `editDeadline` from a project

**Expected Behavior**:
- ✅ Unlimited editing (grandfathered in)
- ✅ All features work normally

### 4. Changing Config for Future Projects

**Steps**:
1. Create project with `{ amount: 6, unit: 'months' }` → Project A
2. Note Project A's `editDeadline` in Firestore
3. Change config to `{ amount: 1, unit: 'years' }`
4. Deploy functions
5. Create new project → Project B
6. Note Project B's `editDeadline` in Firestore

**Expected Behavior**:
- ✅ Project A keeps 6-month deadline (unchanged)
- ✅ Project B gets 1-year deadline
- ✅ Each project's deadline is locked in at creation

## Database Schema

### New Field Added to Projects Collection

```javascript
{
  name: "Project Name",
  createdAt: Timestamp,
  editDeadline: Timestamp,  // ← NEW! Calculated once at creation
  submitted: boolean,
  // ... other fields
}
```

## Backend Validation

**Location**: `functions/organizations.js`

The following operations are blocked after `editDeadline`:
- Creating organization invitations
- Removing organization members

**Error Message**: `"Cannot modify collaborators after edit window has expired"`

## Frontend Components

### Survey.js (Line 188)
```javascript
const isReadOnly = isAfterEditDeadline(project?.editDeadline);
```

### CollaboratorManager.js (Line 29)
```javascript
const isEditWindowExpired = isAfterEditDeadline(project?.editDeadline);
```

## Utility Function

**Location**: `src/utils/dateUtils.js`

```javascript
isAfterEditDeadline(editDeadline)
```

Returns:
- `true` if current date > editDeadline (locked)
- `false` if current date ≤ editDeadline (editable)
- `false` if editDeadline is null/undefined (legacy project)

## Production Checklist

Before going live:

- [ ] Set `EDIT_WINDOW_CONFIG` to production values:
  ```javascript
  const EDIT_WINDOW_CONFIG = {
    amount: 6,
    unit: 'months'
  };
  ```
- [ ] Deploy backend: `firebase deploy --only functions`
- [ ] Test with a real Stripe purchase
- [ ] Verify `editDeadline` is set correctly in Firestore
- [ ] Verify locking works after deadline
- [ ] Verify legacy projects (without `editDeadline`) still work

## Troubleshooting

### Issue: New projects don't have editDeadline

**Solution**: Ensure functions are deployed with latest code
```bash
firebase deploy --only functions
```

### Issue: Changes to EDIT_WINDOW_CONFIG not taking effect

**Solution**:
1. Config only applies to NEW projects
2. Existing projects keep their original deadline
3. Must deploy functions for changes to apply

### Issue: Getting "undefined" errors

**Solution**: Check that:
- Frontend is checking `project?.editDeadline` (with optional chaining)
- `isAfterEditDeadline()` handles null/undefined correctly

## Rollback Plan

If you need to disable the edit window:

1. **Option A - Very long window** (keeps feature, effectively unlimited):
   ```javascript
   const EDIT_WINDOW_CONFIG = {
     amount: 99,
     unit: 'years'
   };
   ```

2. **Option B - Remove validation** (emergency):
   - Comment out `validateEditWindow()` calls in `organizations.js`
   - Update frontend to always allow editing

## Notes

- Changing `EDIT_WINDOW_CONFIG` only affects **future** projects
- Existing projects keep their deadline forever (locked in at purchase)
- Legacy projects without `editDeadline` have unlimited editing
- The deadline is calculated on the **backend** during Stripe webhook (secure)
