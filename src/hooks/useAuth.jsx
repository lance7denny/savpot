import { useState, useEffect, createContext, useContext } from "react";
import { onAuthChange } from "../firebase/auth";
import { getUserProfile, getSetupConfig } from "../firebase/database";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const [prof, cfg] = await Promise.all([
            getUserProfile(firebaseUser.uid),
            getSetupConfig(firebaseUser.uid),
          ]);
          setProfile(prof);
          setConfig(cfg);
        } catch (err) {
          console.error("Failed to load user data:", err);
        }
      } else {
        setUser(null);
        setProfile(null);
        setConfig(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshConfig = async () => {
    if (user) {
      const cfg = await getSetupConfig(user.uid);
      setConfig(cfg);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await getUserProfile(user.uid);
      setProfile(prof);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, config, loading, refreshConfig, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
