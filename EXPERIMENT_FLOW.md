# A/B Test Creation Flow - Complete Guide

## 📋 Current Flow When Someone Creates an A/B Test

### Step 1: Create Experiment (`/experiments/new`)
**What happens:**
1. User fills out form:
   - Experiment Name (required)
   - Description (optional)
   - Test Type: A/B Test, Multivariate, or Split URL
   - Traffic Allocation: % of visitors (default 100%)
   - Primary Goal: e.g., "Button Click", "Form Submit", "Purchase"

2. **On Submit:**
   - Creates experiment in database with status = `'draft'`
   - Logs activity
   - Redirects to `/experiments/{id}` (experiment detail page)

**Current Status:** ✅ **WORKING**

---

### Step 2: Experiment Detail Page (`/experiments/{id}`)
**What the user sees:**
- Experiment overview with status, type, traffic allocation
- Three tabs: Overview, Variants, Results
- "Add Variant" button

**Current Status:** ✅ **WORKING** - But experiment is still in `draft` status

---

### Step 3: Create Variants (`/experiments/{id}/variants/new`)
**What needs to happen:**
1. User creates at least 2 variants:
   - **Control Variant** (original version) - mark as `is_control: true`
   - **Test Variant(s)** (new versions to test)

2. For each variant, user can:
   - Set name (e.g., "Control", "Variant A")
   - Set traffic percentage (how much traffic each variant gets)
   - Add visual changes (CSS/HTML modifications)
   - Add custom code (currently disabled for security)

**Current Status:** ⚠️ **PARTIALLY WORKING** - Variant creation exists but visual editor may need work

---

### Step 4: Start the Experiment
**What needs to happen:**
1. User clicks "Start" or changes status to `'running'`
2. Experiment status changes from `'draft'` → `'running'`
3. Experiment becomes active and visible to SDK

**Current Status:** ✅ **WORKING** - User can change status in experiments list page

---

### Step 5: SDK Fetches Active Experiments
**What happens on client's website:**
1. Visitor loads page with embed code
2. SDK calls `/api/v1/experiments/active?visitor_id=xxx`
3. Backend returns all `running` experiments for that account
4. SDK assigns visitor to a variant (based on traffic percentage)
5. Assignment is saved in `experiment_assignments` table
6. SDK applies changes to the page (CSS/HTML modifications)

**Current Status:** ✅ **WORKING** - Backend endpoint exists and handles assignment

---

### Step 6: Track Events
**What happens:**
1. SDK automatically tracks pageviews
2. User can manually track conversions:
   ```javascript
   Exprora.conversion('Purchase', 99.99);
   ```
3. Events are sent to `/api/v1/events`
4. Stored in `events` table with experiment_id, variant_id, visitor_id

**Current Status:** ✅ **WORKING** - Event tracking endpoint exists

---

### Step 7: View Results (`/experiments/{id}/results`)
**What the user sees:**
- Visitors per variant
- Conversions per variant
- Conversion rates
- Statistical significance (if implemented)
- Revenue (if tracked)

**Current Status:** ✅ **WORKING** - Results page exists and shows data

---

## 🔄 Complete User Journey

```
1. User logs in → Dashboard
2. Clicks "New Experiment" → /experiments/new
3. Fills form → Creates experiment (status: draft)
4. Redirected to → /experiments/{id}
5. Clicks "Add Variant" → /experiments/{id}/variants/new
6. Creates Control variant (is_control: true)
7. Creates Test variant(s)
8. Goes back to experiments list → /experiments
9. Clicks "Play" button → Status changes to 'running'
10. Experiment is now LIVE on their website
11. Visitors see different variants
12. Events are tracked automatically
13. User views results → /experiments/{id}/results
14. Can pause, resume, or complete experiment
```

---

## ⚠️ What's Missing or Needs Improvement

### 1. **Visual Editor** (`/experiments/{id}/editor`)
- Currently exists but may need enhancement
- Should allow users to visually edit page elements
- Should generate CSS/HTML changes automatically

### 2. **Variant Creation UI**
- Need to make it clearer that Control variant is required
- Better UI for setting traffic percentages
- Visual preview of changes

### 3. **Experiment Status Management**
- Better UI for starting/pausing experiments
- Confirmation dialogs before starting
- Warning if no variants exist

### 4. **Targeting Rules**
- Currently in database but UI may be missing
- Should allow targeting by:
  - URL patterns
  - Device type
  - Geographic location
  - Custom conditions

### 5. **Statistical Significance**
- Backend calculates it but UI may not show it prominently
- Should show confidence levels, p-values, lift

### 6. **Experiment Scheduling**
- Start/end dates exist in database
- Should allow scheduling experiments to start/stop automatically

---

## 🎯 What Works Right Now

✅ Experiment creation
✅ Variant creation
✅ Status management (draft → running → paused)
✅ SDK integration (fetches active experiments)
✅ Visitor assignment (with race condition protection)
✅ Event tracking
✅ Results viewing
✅ Experiment deletion

---

## 🚀 Quick Start Guide for Users

1. **Add Embed Code** to website (from dashboard)
2. **Create Experiment** → Give it a name and goal
3. **Add Variants** → Create Control + Test variants
4. **Configure Changes** → Set what's different in each variant
5. **Start Experiment** → Change status to "running"
6. **Wait for Data** → Let visitors interact
7. **View Results** → See which variant performs better
8. **Make Decision** → Keep winner, pause, or iterate

---

## 💡 Recommendations

1. **Add onboarding flow** - Guide new users through first experiment
2. **Add experiment templates** - Pre-configured common tests
3. **Add experiment cloning** - Copy successful experiments
4. **Add experiment archiving** - Keep old experiments without deleting
5. **Add email notifications** - Alert when experiment reaches significance
6. **Add experiment preview** - See how variants look before going live

