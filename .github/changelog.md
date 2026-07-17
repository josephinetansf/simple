# Changelog — Habita Mobile App

## Behavioral Constraint: Karpathy Guidelines
All agents MUST follow these principles:
1. **Think Before Coding** — State assumptions explicitly. Surface tradeoffs. Ask when uncertain.
2. **Simplicity First** — Minimum code that solves the problem. No speculative features.
3. **Surgical Changes** — Touch only what's required. Don't improve unrelated code.
4. **Goal-Driven Execution** — Define verifiable success criteria. Loop until verified.

---

### v1.4.0 — Phase 4: UI Pages (2026-07-17)
- Implemented bottom tab navigation: Dashboard, Tenancies, Rentals, Expenses
- Created DashboardPage with summary stats: properties count, tenancies count, upcoming rent, overdue expenses
- Implemented TenancyListPage with FlatList, delete confirmation, DocumentUploader integration
- Implemented RentalListPage with status badges (paid/unpaid/pending), receipt icon, delete action
- Implemented ExpenseListPage with category display, status badges, receipt icon, delete action
- Created TenancyCard component: tenant name, property, rent amount, due day, end date, status (active/expired)
- Created RentalCard component: title, property, amount, payment date, status badge, receipt icon (📎)
- Created ExpenseCard component: title, category, amount, payment date, status badge, receipt icon (📎)
- All cards use consistent mobile-first design with shadow, rounded corners, color-coded status badges
- DocumentUploader integrated on each list page for OCR-based record creation
- Empty states with icons and helper text for all list pages

### v1.2.0 — Phase 3: OCR Pipeline (2026-07-17)
- Implemented document storage via expo-file-system (save, delete, list, read)
- Created ML Kit text extraction wrapper (src/ocr/mlkit.js)
- Built regex parsers for 3 document types: tenancy agreements, rental slips, expense bills
- Added date parsing (DD/MM/YYYY, YYYY-MM-DD, DD Month YYYY) and amount parsing (RM format)
- Implemented auto-detect parser that identifies document type from OCR text
- Created useOCR hook for full workflow: pick → save → OCR → parse
- Built DocumentUploader UI component with progress indicator and field preview
- Note: ML Kit native module requires `npx expo install @react-native-ml-kit/text-recognition` for production

### v1.1.0 — Phase 2: Database Layer (2026-07-17)
- Implemented SQLite schema with 5 tables: properties, tenancies, rentals, expenses, notifications_log
- Created CRUD query functions for all entities (get, create, update, delete)
- Added seed data: 2 properties, 2 tenancies, 4 rentals, 3 expenses, 1 notification
- Implemented database initialization singleton (src/db/database.js)
- Added schema version tracking for future migrations
- Integrated DB init into App.js startup flow with loading/error states
- Created useDb hook for database access in React components
- Foreign key constraints enabled and enforced

### v0.1.0 — Phase 1: Project Setup & Config (2026-07-17)
- Initialized Expo SDK 57 project (blank template)
- Installed dependencies: expo-sqlite, expo-image-picker, expo-file-system, expo-notifications, expo-camera, expo-web-browser
- Created folder structure: src/components, src/pages, src/db, src/ocr, src/notifications, src/storage, src/hooks
- Configured app.json: Android package com.habita.app, EAS build profile, all plugins
- Updated App.js with placeholder screen
- Created README.md with project structure and phase tracker
- Verified Expo dev server starts without errors

### v0.0.0 — Phase 0: Team Setup (2026-07-17)
- Defined project scope and requirements
- Established multi-agent team structure (Architect, Developer, Reviewer, Tester, Documenter)
- Created coordination framework (phase tracker, review log, test report, changelog)
- Selected tech stack: React Native (Expo), Google ML Kit, SQLite, EAS Build
- Adopted Karpathy Guidelines as binding behavioral constraint for all agents
