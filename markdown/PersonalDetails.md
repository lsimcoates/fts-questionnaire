# PersonalDetails Component

## Purpose

The `PersonalDetails` component is responsible for collecting identifying and consent-related information from the client at the start of the questionnaire.

This section is intentionally placed first because:
- Consent is legally required before continuing
- Identifying information is needed for case tracking
- Several later sections depend on this data for reporting

---

## File Location
frontend/src/components/sections/PersonalDetails.jsx

## Props

``js
export default function PersonalDetails({ register, errors })

register - from React Hook Form, connects inputs to the form
errors → contains validation errors for required fields
This:
-Stores the value in the form
-Handles validation
-Makes the value available when submitting

Required fields include a rule: { required: "Message shown if empty" }

