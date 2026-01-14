# Landing Page

## Purpose
The landing page is the entry point to the application. It allows users to select which questionnaire they want to create or edit.

## Responsibilities
- Display available questionnaire types
- Route the user to the correct questionnaire page
- Provide a clean, tablet-friendly UI

## Key Logic
- Uses `react-router-dom` navigation
- Buttons link to `/questionnaire/:type`
- No data persistence happens on this page

## Notes
- This page is intentionally lightweight
- All state is handled inside the questionnaire page
