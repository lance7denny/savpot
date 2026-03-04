import { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { BottomNav } from "./components/ui";

// ═══════════════════════════════════════════════════
// Import your screen components here.
//
// For now, this file provides the app shell with:
// - Auth state management (auto login/logout)
// - Screen routing (splash → signup → setup → app)
// - Tab navigation (home/savpot/reports/profile)
//
// MIGRATION GUIDE:
// Your full UI is in savpot-onboarding.jsx (the artifact).
// To migrate screen by screen:
//
// 1. Copy each screen component into src/components/
//    e.g., HomeScreen.jsx, SavPotScreen.jsx, etc.
//
// 2. Replace mock data calls with Firebase imports:
//    import { addExpense, getTodayExpenses } from "../firebase/database";
//
// 3. Use the auth hook for user context:
//    const { user, config } = useAuth();
//
// 4. Replace useState mock data with useEffect + Firebase:
//    useEffect(() => {
//      getTodayExpenses(user.uid).then(setTransactions);
//    }, [user]);
//
// ═══════════════════════════════════════════════════

// Temporary: Import the monolith component for now
// Once you split into separate files, replace this import
import SavPotApp from "./SavPotApp";

function AppShell() {
  const { user, loading, config } = useAuth();
  console.log("app shell initiated")
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F5F4F0",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background:
                "linear-gradient(135deg, #1B8C5A 0%, #2CC07E 40%, #C5961B 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              animation: "bouncy 1.2s ease-in-out infinite",
            }}
          >
            <span
              className="mi mi-f"
              style={{ fontSize: 32, color: "#fff" }}
            >
              savings
            </span>
          </div>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 14,
              color: "#9A9FA5",
            }}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // For now, render the monolith component
  // It handles its own internal routing (splash/signup/setup/app)
  return <SavPotApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
