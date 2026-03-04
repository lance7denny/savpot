# SavPot PWA — Setup & Launch Guide

## Quick Start (5 minutes to live app)

### 1. Prerequisites
```bash
# Install Node.js (v18+) from https://nodejs.org
node -v   # should show v18+
npm -v    # should show v9+
```

### 2. Install Dependencies
```bash
cd savpot-pwa
npm install
```

### 3. Set Up Firebase

**A) Create Firebase Project**
1. Go to https://console.firebase.google.com
2. Click "Create a project" → name it `savpot`
3. Disable Google Analytics (not needed) → Create

**B) Enable Authentication**
1. In Firebase console → Build → Authentication → Get started
2. Sign-in method tab → Enable:
   - **Email/Password** (toggle ON)
   - **Google** (toggle ON, add your email as support email)

**C) Create Firestore Database**
1. Build → Firestore Database → Create database
2. Choose "Start in **test mode**" (we'll add rules later)
3. Select a region close to you (asia-south1 for India)

**D) Get Your Config**
1. Project Settings (gear icon) → General → scroll to "Your apps"
2. Click web icon `</>` → Register app as "savpot-web"
3. Copy the `firebaseConfig` object
4. Paste into `src/firebase/config.js` replacing the placeholder values

```js
// src/firebase/config.js — replace these:
const firebaseConfig = {
  apiKey: "AIzaSy...",            // ← your key
  authDomain: "savpot-xxxxx.firebaseapp.com",
  projectId: "savpot-xxxxx",
  storageBucket: "savpot-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 4. Run Locally
```bash
npm run dev
```
Opens at `http://localhost:5173` — test on your browser!

### 5. Test on Phone (Local Network)
```bash
npm run dev -- --host
```
This shows a network URL like `http://192.168.1.x:5173`
Open this on your phone's browser on the same WiFi.

---

## Deploy to Production

### Option A: Vercel (Easiest — Recommended)

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "SavPot v1.0"
# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/savpot.git
git push -u origin main
```

2. Go to https://vercel.com → Import project → Select your repo
3. Framework: Vite → Deploy
4. Get your URL: `https://savpot.vercel.app`
5. Open on phone → Add to Home Screen → Done!

### Option B: Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login & init
firebase login
firebase init hosting
# Select your project, public dir = "dist", SPA = yes

# Build & deploy
npm run build
firebase deploy --only hosting

# Your URL: https://savpot-xxxxx.web.app
```

### Option C: Netlify

1. Push to GitHub
2. Go to https://netlify.com → Add new site → Import from Git
3. Build command: `npm run build` | Publish dir: `dist`
4. Deploy → Get URL

---

## Add to Phone Home Screen (PWA Install)

### iPhone (Safari)
1. Open your deployed URL in Safari
2. Tap Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Name it "SavPot" → Add

### Android (Chrome)
1. Open your deployed URL in Chrome
2. Tap ⋮ menu → "Install app" or "Add to Home Screen"
3. Tap Install

The app now launches fullscreen like a native app!

---

## Firestore Data Structure

```
users/
  └── {uid}/
      ├── email, name, phone, avatar, createdAt
      │
      ├── config/
      │   ├── setup          → income, mandatory, investments, daily, incomeItems, etc.
      │   ├── savpot         → balance, isLocked, lockEnd, lockDays
      │   ├── expenseCategories → { items: [...] }
      │   ├── incomeCategories  → { items: [...] }
      │   └── vendors        → { items: [...] }
      │
      ├── accounts/
      │   └── {accountId}    → type, name, bankName, amount
      │
      ├── expenses/
      │   └── {expenseId}    → amount, category, vendor, payMethod, dateTime
      │
      ├── savpotLedger/
      │   └── {entryId}      → type, amount, reason, dateTime
      │
      ├── dailySnapshots/
      │   └── "2026-03-04"   → dailyBudget, spent, savedToPot, overspent
      │
      └── liabilities/
          └── {liabilityId}  → type, name, lender, outstanding, emi, inFixed
```

---

## Security Rules (Production)

After testing, update Firestore rules:
```bash
firebase deploy --only firestore:rules
```

The rules in `firestore.rules` ensure:
- Users can only read/write their own data
- No cross-user access
- All subcollections are protected

---

## Project Structure

```
savpot-pwa/
├── index.html              # Entry HTML with PWA meta tags
├── vite.config.js          # Vite + PWA plugin config
├── package.json            # Dependencies
├── firebase.json           # Firebase hosting config
├── firestore.rules         # Security rules
│
├── public/
│   └── favicon.svg         # App icon
│
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Root component with AuthProvider
    ├── SavPotApp.jsx       # Full app (current monolith)
    │
    ├── firebase/
    │   ├── config.js       # Firebase config (ADD YOUR KEYS)
    │   ├── auth.js         # Auth: signup, login, Google, password
    │   └── database.js     # Firestore: all CRUD operations
    │
    ├── hooks/
    │   └── useAuth.jsx     # Auth context + user state hook
    │
    ├── components/
    │   └── ui.jsx          # Shared UI: Glass, Btn, Inp, Nav, etc.
    │
    └── styles/
        └── global.css      # Global styles + animations
```

---

## Next Steps (Progressive Migration)

The app works NOW as a monolith (`SavPotApp.jsx`). Over time:

1. **Wire Firebase Auth** — Replace mock signup/login with real auth
2. **Wire Firestore** — Replace `useState` mock data with Firestore reads/writes
3. **Split components** — Move each screen to its own file
4. **Add Cloud Functions** — For midnight SavPot transfer (cron job)
5. **Add Capacitor** — Wrap as native app for App Store / Play Store

### Wiring Firebase Auth (First Priority)

In `SavPotApp.jsx`, replace the SignupScreen's `onDone` to use real auth:

```jsx
import { signUp, signInWithGoogle } from "./firebase/auth";

// In SignupScreen:
const handleSignup = async () => {
  try {
    await signUp(email, password, name, phone);
    onDone(); // proceed to setup
  } catch (err) {
    setError(err.message);
  }
};
```

### Wiring Firestore (Second Priority)

Replace mock expense data with real reads:

```jsx
import { addExpense, getTodayExpenses } from "./firebase/database";
import { useAuth } from "./hooks/useAuth";

// In HomeScreen:
const { user } = useAuth();

useEffect(() => {
  if (user) {
    getTodayExpenses(user.uid).then(setTransactions);
  }
}, [user]);

const handleAddExpense = async (expense) => {
  await addExpense(user.uid, expense);
  const updated = await getTodayExpenses(user.uid);
  setTransactions(updated);
};
```

---

## Midnight SavPot Transfer (Cloud Function)

For automatic nightly transfers, deploy a scheduled Cloud Function:

```bash
firebase init functions
```

```js
// functions/index.js
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");
admin.initializeApp();
const db = getFirestore();

exports.midnightTransfer = onSchedule("every day 00:00", async () => {
  const usersSnap = await db.collection("users").get();
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    // ... run transfer logic per user
    // (same logic as runMidnightTransfer in database.js)
  }
});
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Module not found` | Run `npm install` |
| Firebase errors | Check config.js has your real keys |
| PWA not installing | Must be served over HTTPS (deploy first) |
| Google Sign-In fails | Add your domain to Firebase Auth → Authorized domains |
| Firestore permission denied | Check you're logged in + rules allow access |

---

Built with Discipline · domore.ltd
