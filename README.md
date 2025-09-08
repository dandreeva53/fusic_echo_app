# FUSIC Echo App — Starter (Clean)

Stack:
- **Next.js** (App Router, TypeScript, Tailwind)
- **Firebase**: Auth (**Email/Password**), Firestore, Storage, Functions
- **Users keyed by email**
- **Per-slot booking cap** (`dailyCapForTrainee`, default 2)
- **Logbook** with Age / Gender / BMI, Notes, Diagnosis, Comments, signatures & lock

## Quick start (GitHub Codespaces-friendly)
1. Create Firebase project; enable **Auth (Email/Password)**, **Firestore**, **Storage**, **Functions**.
2. In Firebase console, create a Web App and copy config.
3. In `web/`:
   ```bash
   cp .env.local.example .env.local
   # fill Firebase config values
   npm i
   npm run dev
   ```
4. In `functions/`:
   ```bash
   npm i
   npm run deploy   # or: npm run build && firebase deploy --only functions
   ```

## Notes
- Slots live under: `schedules/{supervisorEmail}/slots/{slotId}`
- Each slot can set `dailyCapForTrainee` (default 2). The `bookSlot` callable enforces caps per trainee per day.
- Logbook entries lock on supervisor sign-off via `signLogbookEntry` function.
