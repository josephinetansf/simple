# Habita — Tenancy / Rental / Expense Manager

Android-first mobile app for landlords and property managers to digitize tenancy agreements, track rental payments, and manage expenses via document upload and OCR.

## Tech Stack

- **Framework**: React Native (Expo SDK 57)
- **Build**: EAS Build for Android APK
- **OCR**: Google ML Kit (on-device text recognition)
- **Database**: SQLite (expo-sqlite) — local only
- **Notifications**: expo-notifications + WhatsApp deep links
- **Storage**: expo-file-system (device private storage)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── DocumentUploader.jsx
│   ├── TenancyCard.jsx
│   ├── RentalCard.jsx
│   └── ExpenseCard.jsx
├── pages/               # Screen components
│   ├── HomePage.jsx
│   ├── TenancyListPage.jsx
│   ├── RentalListPage.jsx
│   └── ExpenseListPage.jsx
├── db/                  # Database layer
│   ├── schema.js        # SQLite tables & migrations
│   └── queries.js       # CRUD operations
├── ocr/                 # OCR pipeline
│   ├── mlkit.js         # Google ML Kit wrapper
│   └── parsers.js       # Regex-based data extraction
├── notifications/       # Reminder system
│   ├── scheduler.js     # Local notification scheduling
│   └── whatsapp.js      # WhatsApp deep link helper
├── storage/             # Document management
│   └── fileManager.js   # FileSystem operations
└── hooks/               # Custom React hooks
    └── useOCR.js        # OCR processing hook
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI

### Installation
```bash
npm install
```

### Run Development Server
```bash
npx expo start
```

### Run on Android Emulator
```bash
npx expo run:android
```

### Build APK (via EAS)
```bash
npx eas build --platform android --profile preview
```

## Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Complete | Project setup, dependencies, folder structure, app.json config |
| 2 | ✅ Complete | Database layer (SQLite schema + CRUD + seed data + DB init) |
| 3 | ✅ Complete | OCR pipeline (ML Kit wrapper, regex parsers, useOCR hook, DocumentUploader) |
| 4 | ✅ Complete | UI pages (navigation, dashboard, list pages, card components, DocumentUploader integration) |
| 5 | ⏳ Pending | Notification system (reminders + WhatsApp) |
| 6 | ⏳ Pending | Build & release (EAS APK) |

## License

Private — Habita Project
