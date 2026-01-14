# Questionnaire Page

## Purpose
This is the core page of the frontend. It renders the full questionnaire, manages form state, and communicates with the backend.

## Main Responsibilities
- Manage form state using React Hook Form
- Load existing questionnaire data
- Save drafts
- Finalise questionnaires
- Trigger PDF generation

## Key Libraries
- `react-hook-form`
- `react-router-dom`

## Main Hooks Used
- `useForm()` – manages all form state
- `useParams()` – determines questionnaire type
- `useNavigate()` – handles routing

## Key Functions

### createQuestionnaire()
Creates a new questionnaire record on the backend.

### updateQuestionnaire()
Saves progress without finalising.

### finalizeQuestionnaire()
Locks the questionnaire and triggers PDF generation.

### getQuestionnaire()
Loads an existing questionnaire for editing.

## Data Flow
1. User fills in form sections
2. Form state lives entirely in React Hook Form
3. On save/finalise, data is sent to FastAPI
4. Backend persists data and optionally generates PDF

## Notes
- Sections are split into separate components for maintainability
- Default values must stay in sync with backend schema
