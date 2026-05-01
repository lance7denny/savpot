import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./config";

// ── Sign Up ──
export const signUp = async (email, password, name, phone) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  // Create user document in Firestore
  await setDoc(doc(db, "users", cred.user.uid), {
    email,
    name,
    phone,
    avatar: "a1",
    createdAt: new Date().toISOString(),
  });

  return cred.user;
};

// ── Sign In ──
export const signIn = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

// ── Google Sign In ──
export const signInWithGoogle = async () => {
  const cred = await signInWithPopup(auth, googleProvider);

  // Check if user doc exists, create if first time
  const userDoc = await getDoc(doc(db, "users", cred.user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, "users", cred.user.uid), {
      email: cred.user.email,
      name: cred.user.displayName || "",
      phone: cred.user.phoneNumber || "",
      avatar: "a1",
      createdAt: new Date().toISOString(),
    });
  }

  return cred.user;
};

// ── Sign Out ──
export const logOut = () => signOut(auth);

// ── Change Password ──
export const changePassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("Not authenticated");

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

// ── Auth State Listener ──
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
