import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

// ═══════════════════════════════════
// HELPER: Get month range
// ═══════════════════════════════════
const getMonthRange = (year, month) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return {
    start: Timestamp.fromDate(start),
    end: Timestamp.fromDate(end),
  };
};

// ═══════════════════════════════════
// USER PROFILE
// ═══════════════════════════════════
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
};

// ═══════════════════════════════════
// SETUP CONFIG (income, expenses, investments, daily budget)
// ═══════════════════════════════════
export const getSetupConfig = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid, "config", "setup"));
  return snap.exists() ? snap.data() : null;
};

export const saveSetupConfig = async (uid, config) => {
  await setDoc(doc(db, "users", uid, "config", "setup"), {
    ...config,
    updatedAt: serverTimestamp(),
  });
};

// ═══════════════════════════════════
// ACCOUNTS (Cash, Bank, Credit Card, Wallet)
// ═══════════════════════════════════
const accountsCol = (uid) => collection(db, "users", uid, "accounts");

export const getAccounts = async (uid) => {
  const snap = await getDocs(accountsCol(uid));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addAccount = async (uid, account) => {
  return addDoc(accountsCol(uid), { ...account, createdAt: serverTimestamp() });
};

export const updateAccount = async (uid, accountId, data) => {
  await updateDoc(doc(db, "users", uid, "accounts", accountId), data);
};

export const deleteAccount = async (uid, accountId) => {
  await deleteDoc(doc(db, "users", uid, "accounts", accountId));
};

// ═══════════════════════════════════
// EXPENSE TRANSACTIONS
// ═══════════════════════════════════
const expensesCol = (uid) => collection(db, "users", uid, "expenses");

export const addExpense = async (uid, expense) => {
  return addDoc(expensesCol(uid), {
    ...expense,
    dateTime: Timestamp.fromDate(new Date()),
    createdAt: serverTimestamp(),
  });
};

export const getExpensesByMonth = async (uid, year, month) => {
  const { start, end } = getMonthRange(year, month);
  const q = query(
    expensesCol(uid),
    where("dateTime", ">=", start),
    where("dateTime", "<=", end),
    orderBy("dateTime", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getTodayExpenses = async (uid) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const q = query(
    expensesCol(uid),
    where("dateTime", ">=", Timestamp.fromDate(start)),
    where("dateTime", "<=", Timestamp.fromDate(end)),
    orderBy("dateTime", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteExpense = async (uid, expenseId) => {
  await deleteDoc(doc(db, "users", uid, "expenses", expenseId));
};

// ═══════════════════════════════════
// SAVPOT LEDGER
// ═══════════════════════════════════
const savpotCol = (uid) => collection(db, "users", uid, "savpotLedger");

export const addSavPotEntry = async (uid, entry) => {
  return addDoc(savpotCol(uid), {
    ...entry,
    dateTime: Timestamp.fromDate(new Date()),
    createdAt: serverTimestamp(),
  });
};

export const getSavPotByMonth = async (uid, year, month) => {
  const { start, end } = getMonthRange(year, month);
  const q = query(
    savpotCol(uid),
    where("dateTime", ">=", start),
    where("dateTime", "<=", end),
    orderBy("dateTime", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ═══════════════════════════════════
// SAVPOT STATE (balance, lock)
// ═══════════════════════════════════
export const getSavPotState = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid, "config", "savpot"));
  return snap.exists()
    ? snap.data()
    : { balance: 0, isLocked: false, lockEnd: null, lockDays: 0 };
};

export const updateSavPotState = async (uid, state) => {
  await setDoc(doc(db, "users", uid, "config", "savpot"), {
    ...state,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// ═══════════════════════════════════
// DAILY BUDGET SNAPSHOTS
// ═══════════════════════════════════
const snapshotsCol = (uid) => collection(db, "users", uid, "dailySnapshots");

export const saveDailySnapshot = async (uid, snapshot) => {
  const dateKey = snapshot.date; // "YYYY-MM-DD"
  await setDoc(doc(db, "users", uid, "dailySnapshots", dateKey), {
    ...snapshot,
    updatedAt: serverTimestamp(),
  });
};

export const getDailySnapshots = async (uid, year, month) => {
  const { start, end } = getMonthRange(year, month);
  const q = query(
    snapshotsCol(uid),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => {
      const d = new Date(s.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
};

// ═══════════════════════════════════
// CATEGORIES (Income + Expense)
// ═══════════════════════════════════
export const getCategories = async (uid, type = "expense") => {
  const snap = await getDoc(doc(db, "users", uid, "config", `${type}Categories`));
  return snap.exists() ? snap.data().items || [] : [];
};

export const saveCategories = async (uid, type, items) => {
  await setDoc(doc(db, "users", uid, "config", `${type}Categories`), {
    items,
    updatedAt: serverTimestamp(),
  });
};

// ═══════════════════════════════════
// VENDORS
// ═══════════════════════════════════
export const getVendors = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid, "config", "vendors"));
  return snap.exists() ? snap.data().items || [] : [];
};

export const saveVendors = async (uid, items) => {
  await setDoc(doc(db, "users", uid, "config", "vendors"), {
    items,
    updatedAt: serverTimestamp(),
  });
};

// ═══════════════════════════════════
// LIABILITIES
// ═══════════════════════════════════
const liabilitiesCol = (uid) => collection(db, "users", uid, "liabilities");

export const getLiabilities = async (uid) => {
  const snap = await getDocs(liabilitiesCol(uid));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addLiability = async (uid, liability) => {
  return addDoc(liabilitiesCol(uid), { ...liability, createdAt: serverTimestamp() });
};

export const deleteLiability = async (uid, liabilityId) => {
  await deleteDoc(doc(db, "users", uid, "liabilities", liabilityId));
};

// ═══════════════════════════════════
// MIDNIGHT TRANSFER (run via Cloud Function or client-triggered)
// ═══════════════════════════════════
export const runMidnightTransfer = async (uid) => {
  const config = await getSetupConfig(uid);
  if (!config) return;

  const todayExpenses = await getTodayExpenses(uid);
  const spent = todayExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const daily = config.daily || 0;
  const leftover = Math.max(0, daily - spent);

  if (leftover > 0) {
    // Add to SavPot
    const state = await getSavPotState(uid);
    await updateSavPotState(uid, { balance: (state.balance || 0) + leftover });
    await addSavPotEntry(uid, {
      type: "ADD_LEFTOVER",
      amount: leftover,
      reason: "Daily leftover auto-transfer",
    });
  }

  // Save daily snapshot
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  await saveDailySnapshot(uid, {
    date: dateKey,
    dailyBudget: daily,
    spent,
    savedToPot: leftover,
    overspent: Math.max(0, spent - daily),
  });

  return { spent, leftover };
};
