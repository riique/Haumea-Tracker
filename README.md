# Haumea Tracker

Haumea Tracker is a private, responsive substance intake tracker built with React, TypeScript, Vite and Firebase. It helps authenticated users record and review caffeine, alcohol and other consumption data through dashboard, history and scoreboard views.

## Stack

- React 19
- TypeScript
- Vite
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting
- Tailwind CSS

## Requirements

- Node.js 20 or newer
- npm
- Firebase project with Authentication and Firestore enabled
- Firebase CLI access to the `haumea-tracker` project

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file from the example:

```bash
cp .env.example .env
```

Fill `.env` with the Firebase web app values:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Run the development server:

```bash
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run deploy
npm run deploy:rules
```

## Deploy

The project is configured for Firebase Hosting in `firebase.json`, using `dist` as the public build directory and SPA rewrites to `index.html`.

Deploy the app and Firestore rules:

```bash
npm run deploy
```

Deploy only Firestore rules:

```bash
npm run deploy:rules
```

## Repository

```bash
git clone https://github.com/riique/Haumea-Tracker.git
cd Haumea-Tracker
npm install
```

## Project Structure

```text
src/components   Shared UI components and layout
src/contexts     Authentication context
src/lib          Firebase initialization
src/pages        App views
src/services     Firestore access logic
src/types        Shared TypeScript types
```

## Security

The `.env` file is intentionally ignored by Git. Commit only `.env.example` with placeholder values.
