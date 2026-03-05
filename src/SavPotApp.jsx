import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { signUp, signIn, signInWithGoogle, logOut, changePassword } from "./firebase/auth";
import {
  saveSetupConfig, updateUserProfile,
  getAccounts, addAccount, updateAccount, deleteAccount,
  addExpense, getExpensesByMonth,
  getSavPotState, updateSavPotState, addSavPotEntry, getSavPotByMonth,
  getDailySnapshots,
  getCategories, saveCategories, getVendors, saveVendors,
  getLiabilities, addLiability, deleteLiability,
} from "./firebase/database";

// ─── DESIGN TOKENS ───
const F = "'Poppins', sans-serif";
const C = {
  bg: "#F5F4F0",
  card: "rgba(255,255,255,0.58)",
  bdr: "rgba(255,255,255,0.72)",
  g1: "#1B8C5A",
  g2: "#2CC07E",
  gp: "#E8F7EF",
  au: "#C5961B",
  auL: "#E8C84A",
  auP: "#FDF6E3",
  grad: "linear-gradient(135deg, #1B8C5A 0%, #2CC07E 40%, #C5961B 100%)",
  tx: "#1A1D1F",
  t2: "#6F767E",
  t3: "#9A9FA5",
  red: "#E53E3E",
};

const INCOME_CATS = [
  { id: "salary", label: "Salary", icon: "work" },
  { id: "cash", label: "Cash", icon: "payments" },
  { id: "freelance", label: "Freelance", icon: "laptop" },
  { id: "business", label: "Business", icon: "storefront" },
  { id: "rental", label: "Rental", icon: "apartment" },
  { id: "other_inc", label: "Others", icon: "more_horiz" },
];

const EXPENSE_CATS = [
  { id: "rent", label: "Rent", icon: "home" },
  { id: "loan", label: "Loan EMI", icon: "account_balance" },
  { id: "cc", label: "Credit Card", icon: "credit_card" },
  { id: "internet", label: "Internet", icon: "wifi" },
  { id: "eb", label: "EB Bill", icon: "bolt" },
  { id: "water", label: "Water", icon: "water_drop" },
  { id: "insurance", label: "Insurance", icon: "shield" },
  { id: "other_exp", label: "Others", icon: "more_horiz" },
];

const INVEST_CATS = [
  { id: "stocks", label: "Stocks", icon: "trending_up" },
  { id: "mf", label: "Mutual Funds", icon: "pie_chart" },
  { id: "gold", label: "Gold", icon: "diamond" },
  { id: "fd", label: "Fixed Deposit", icon: "lock" },
  { id: "ppf", label: "PPF / EPF", icon: "savings" },
  { id: "crypto", label: "Crypto", icon: "currency_bitcoin" },
  { id: "other_inv", label: "Others", icon: "more_horiz" },
];

// ─── PRIMITIVES ───
const FontLoader = () => {
  useEffect(() => {
    [
      "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap",
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200",
    ].forEach((h) => {
      if (!document.querySelector(`link[href="${h}"]`)) {
        const el = document.createElement("link");
        el.rel = "stylesheet";
        el.href = h;
        document.head.appendChild(el);
      }
    });
  }, []);
  return null;
};

const CSS = () => (
  <style>{`
    .mi{font-family:'Material Symbols Rounded';font-style:normal;display:inline-block;line-height:1;
      text-transform:none;letter-spacing:normal;white-space:nowrap;direction:ltr;
      -webkit-font-smoothing:antialiased;font-variation-settings:'FILL' 0,'wght' 400;vertical-align:middle}
    .mi-f{font-variation-settings:'FILL' 1,'wght' 500}
    @keyframes bouncy{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideR{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
    @keyframes pop{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
    input[type=number]{-moz-appearance:textfield;appearance:textfield}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:${F};background:${C.bg};-webkit-font-smoothing:antialiased;overflow-x:hidden}
    ::selection{background:rgba(27,140,90,0.15)}
  `}</style>
);

const Ic = ({ n, s = 24, c, f, st }) => (
  <span className={`mi${f ? " mi-f" : ""}`} style={{ fontSize: s, color: c || C.tx, ...(st || {}) }}>
    {n}
  </span>
);

const Skeleton = ({ h = 60, mb = 8, r = 16 }) => (
  <div style={{
    height: h, borderRadius: r, marginBottom: mb,
    background: "linear-gradient(90deg,rgba(0,0,0,0.04) 25%,rgba(0,0,0,0.07) 50%,rgba(0,0,0,0.04) 75%)",
    backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
  }} />
);

const Blob = ({ t, l, sz = 320, c = "rgba(27,140,90,0.06)" }) => (
  <div
    style={{
      position: "absolute", top: t, left: l, width: sz, height: sz, borderRadius: "50%",
      background: `radial-gradient(circle,${c} 0%,transparent 70%)`,
      filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
    }}
  />
);

const Glass = ({ children, style, onClick, grad }) => (
  <div
    onClick={onClick}
    style={{
      background: grad
        ? `linear-gradient(135deg,rgba(27,140,90,0.05),rgba(197,150,27,0.05)),${C.card}`
        : C.card,
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${C.bdr}`, borderRadius: 22, padding: 20,
      position: "relative", overflow: "hidden",
      boxShadow: "0 2px 20px rgba(0,0,0,0.04),inset 0 0 0 .5px rgba(255,255,255,0.6)",
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}
  >
    {children}
  </div>
);

const Btn = ({ children, onClick, style, sec, disabled }) => (
  <button
    onClick={disabled ? undefined : onClick}
    style={{
      width: "100%", padding: "16px 24px", borderRadius: 16,
      border: sec ? "1px solid rgba(0,0,0,0.08)" : "none",
      background: sec ? "rgba(0,0,0,0.03)" : C.grad,
      color: sec ? C.t2 : "#fff",
      fontFamily: F, fontSize: 15, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: sec ? "none" : "0 4px 20px rgba(27,140,90,0.2)",
      opacity: disabled ? 0.4 : 1, transition: "all 0.3s",
      ...style,
    }}
  >
    {children}
  </button>
);

const Inp = ({ label, value, onChange, type = "text", placeholder, prefix, autoFocus, note }) => (
  <div style={{ marginBottom: 16 }}>
    {label && (
      <label style={{ fontFamily: F, fontSize: 12, color: C.t3, display: "block", marginBottom: 6, fontWeight: 500, letterSpacing: "0.2px" }}>
        {label}
      </label>
    )}
    <div style={{ position: "relative" }}>
      {prefix && (
        <span
          style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            color: C.g1, fontFamily: F, fontSize: 16, fontWeight: 700,
          }}
        >
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: "100%", padding: prefix ? "14px 16px 14px 32px" : "14px 16px",
          borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)",
          background: "rgba(255,255,255,0.55)", color: C.tx,
          fontFamily: F, fontSize: 15, fontWeight: 500, outline: "none",
          transition: "border-color 0.3s,box-shadow 0.3s",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "rgba(27,140,90,0.3)";
          e.target.style.boxShadow = "0 0 0 3px rgba(27,140,90,0.08)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "rgba(0,0,0,0.06)";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
    {note && <p style={{ fontFamily: F, fontSize: 11, color: C.t3, marginTop: 4 }}>{note}</p>}
  </div>
);

const Steps = ({ cur, total }) => (
  <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
    {Array.from({ length: total }, (_, i) => (
      <div
        key={i}
        style={{
          flex: 1, height: 4, borderRadius: 2,
          background: i <= cur ? C.grad : "rgba(0,0,0,0.06)",
          transition: "all 0.5s",
        }}
      />
    ))}
  </div>
);

const Divider = () => (
  <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(0,0,0,0.06),transparent)", margin: "18px 0" }} />
);

// ─── CATEGORY EDITOR ───
const CatEditor = ({ cats, items, setItems, accent = C.g1 }) => {
  const [picking, setPicking] = useState(false);
  const total = items.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const available = cats.filter((c) => !items.find((x) => x.catId === c.id));

  const add = (cat) => {
    setItems([...items, { catId: cat.id, label: cat.label, icon: cat.icon, amount: "" }]);
    setPicking(false);
  };

  const update = (idx, val) => {
    const n = [...items];
    n[idx] = { ...n[idx], amount: val };
    setItems(n);
  };

  const remove = (idx) => setItems(items.filter((_, i) => i !== idx));

  return (
    <div>
      {items.map((item, idx) => (
        <div
          key={item.catId}
          style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
            animation: "pop 0.3s ease-out",
          }}
        >
          <div
            style={{
              width: 42, height: 42, borderRadius: 14, background: `${accent}12`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <Ic n={item.icon} s={20} c={accent} f />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: F, fontSize: 11, color: C.t2, fontWeight: 500, marginBottom: 3 }}>
              {item.label}
            </p>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  color: accent, fontFamily: F, fontSize: 14, fontWeight: 700,
                }}
              >
                ₹
              </span>
              <input
                type="number"
                value={item.amount}
                onChange={(e) => update(idx, e.target.value)}
                placeholder="0"
                style={{
                  width: "100%", padding: "10px 12px 10px 28px", borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.5)",
                  fontFamily: F, fontSize: 15, fontWeight: 600, color: C.tx, outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = `${accent}50`)}
                onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.06)")}
              />
            </div>
          </div>
          <button
            onClick={() => remove(idx)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}
          >
            <Ic n="close" s={18} c={C.t3} />
          </button>
        </div>
      ))}

      {available.length > 0 && (
        <>
          <button
            onClick={() => setPicking(!picking)}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 14,
              border: `1.5px dashed ${accent}40`, background: `${accent}06`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: F, fontSize: 13, fontWeight: 600, color: accent,
              cursor: "pointer", transition: "all 0.2s", marginTop: 4,
            }}
          >
            <Ic n={picking ? "close" : "add"} s={18} c={accent} />
            {picking ? "Close" : "Add Category"}
          </button>

          {picking && (
            <div
              style={{
                marginTop: 10, display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
                animation: "fadeUp 0.25s ease-out",
              }}
            >
              {available.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => add(cat)}
                  style={{
                    padding: "14px 6px", borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.06)",
                    background: "rgba(255,255,255,0.5)", textAlign: "center",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <Ic n={cat.icon} s={22} c={accent} st={{ display: "block", margin: "0 auto 4px" }} />
                  <p style={{ fontFamily: F, fontSize: 10, color: C.t2, fontWeight: 500 }}>{cat.label}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {items.length > 0 && (
        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: 16, padding: "12px 16px", borderRadius: 14, background: `${accent}08`,
          }}
        >
          <span style={{ fontFamily: F, fontSize: 13, color: C.t2, fontWeight: 500 }}>Total</span>
          <span style={{ fontFamily: F, fontSize: 20, color: accent, fontWeight: 700 }}>
            ₹{total.toLocaleString("en-IN")}
          </span>
        </div>
      )}
    </div>
  );
};

// ─── MODE TOGGLE ───
const ModeToggle = ({ active, onSwitch, accent }) => (
  <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
    {[
      { id: "cats", label: "By Category", icon: "category" },
      { id: "total", label: "Total Only", icon: "calculate" },
    ].map((o) => (
      <div
        key={o.id}
        onClick={() => onSwitch(o.id)}
        style={{
          flex: 1, padding: "12px 8px", borderRadius: 14, textAlign: "center",
          cursor: "pointer", transition: "all 0.2s",
          border: active === o.id ? `2px solid ${accent}` : "1px solid rgba(0,0,0,0.06)",
          background: active === o.id ? `${accent}08` : "rgba(255,255,255,0.4)",
        }}
      >
        <Ic
          n={o.icon}
          s={20}
          c={active === o.id ? accent : C.t3}
          f={active === o.id}
          st={{ display: "block", margin: "0 auto 4px" }}
        />
        <p style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: active === o.id ? accent : C.t3 }}>
          {o.label}
        </p>
      </div>
    ))}
  </div>
);

// ─── CHECKBOX ───
const Check = ({ checked, onClick, label, accent = C.au }) => (
  <div
    onClick={onClick}
    style={{
      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
      borderRadius: 14, cursor: "pointer", transition: "all 0.2s",
      border: checked ? `2px solid ${accent}` : "1px solid rgba(0,0,0,0.06)",
      background: checked ? `${accent}08` : "rgba(255,255,255,0.4)",
      marginBottom: 16,
    }}
  >
    <div
      style={{
        width: 22, height: 22, borderRadius: 7, flexShrink: 0,
        border: checked ? `2px solid ${accent}` : "2px solid rgba(0,0,0,0.15)",
        background: checked ? accent : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}
    >
      {checked && <Ic n="check" s={14} c="#fff" />}
    </div>
    <p style={{ fontFamily: F, fontSize: 13, color: checked ? accent : C.t2, fontWeight: 500 }}>
      {label}
    </p>
  </div>
);

// ═══════════════════════════════════
// ─── SPLASH SCREENS ───
// ═══════════════════════════════════
const SplashScreen = ({ onDone }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "Discipline",
      sub: "Your money. Your rules.",
      desc: "Stop just tracking expenses. Start building real financial discipline — one day at a time.",
      icon: "self_improvement",
    },
    {
      title: "Save Daily",
      sub: "Every rupee counts.",
      desc: "Unspent money flows into your pot every night. Watch savings grow without sacrificing lifestyle.",
      icon: "savings",
    },
    {
      title: "Stay in Control",
      sub: "Know your daily limit.",
      desc: "Set a daily budget. Stick to it. Build the habit that transforms your finances forever.",
      icon: "bolt",
    },
  ];

  const sl = slides[step];

  return (
    <div
      style={{
        minHeight: "100dvh", background: C.bg, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 32, position: "relative", overflow: "hidden",
      }}
    >
      <Blob t="-120px" l="-60px" sz={500} />
      <Blob t="55%" l="65%" sz={400} c="rgba(197,150,27,0.05)" />

      <div
        key={step}
        style={{
          position: "relative", zIndex: 1, textAlign: "center",
          maxWidth: 340, animation: "fadeUp 0.5s ease-out",
        }}
      >
        <div
          style={{
            width: 110, height: 110, borderRadius: 32, background: C.grad,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 36px", boxShadow: "0 8px 40px rgba(27,140,90,0.2)",
            animation: "bouncy 3s ease-in-out infinite",
          }}
        >
          <Ic n={sl.icon} s={48} c="#fff" f />
        </div>

        <h1 style={{ fontFamily: F, fontSize: 34, color: C.tx, fontWeight: 700, marginBottom: 8 }}>
          {sl.title}
        </h1>
        <p style={{ fontFamily: F, fontSize: 16, color: C.g1, fontWeight: 600, marginBottom: 12 }}>
          {sl.sub}
        </p>
        <p style={{ fontFamily: F, fontSize: 14, color: C.t2, lineHeight: 1.7, marginBottom: 48 }}>
          {sl.desc}
        </p>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32 }}>
          {slides.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 28 : 8, height: 8, borderRadius: 4,
                background: i === step ? C.grad : "rgba(0,0,0,0.08)",
                transition: "all 0.4s",
              }}
            />
          ))}
        </div>

        <Btn onClick={() => (step < 2 ? setStep(step + 1) : onDone())}>
          {step < 2 ? "Next" : "Get Started"}
        </Btn>

        {step < 2 && (
          <button
            onClick={onDone}
            style={{
              background: "none", border: "none", fontFamily: F,
              fontSize: 13, color: C.t3, marginTop: 16, cursor: "pointer",
            }}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// ─── SIGNUP SCREEN ───
// ═══════════════════════════════════
const mapFirebaseError = (code) => ({
  "auth/email-already-in-use": "An account with this email already exists. Try logging in.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/user-not-found": "No account found with this email. Try signing up.",
  "auth/invalid-credential": "Invalid email or password. Please try again.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/popup-closed-by-user": null, // silent — user closed the Google popup
  "auth/popup-blocked": "Popup was blocked by your browser. Please allow popups and try again.",
  "auth/unauthorized-domain": "This domain isn't authorized for Google sign-in. Please contact support.",
  "auth/cancelled-popup-request": null, // silent — another popup opened
}[code] ?? "Something went wrong. Please try again.");

const SignupScreen = ({ onDone }) => {
  const [mode, setMode] = useState("signup"); // "signup" | "login"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");

  const isSignup = mode === "signup";
  const valid = isSignup
    ? name.trim().length > 0 && email.includes("@") && pass.length >= 6
    : email.includes("@") && pass.length >= 6;

  const handleSubmit = async () => {
    if (authLoading || !valid) return;
    setError("");
    setAuthLoading(true);
    try {
      if (isSignup) await signUp(email, pass, name, phone);
      else await signIn(email, pass);
      onDone(); // no-op; useEffect in SavPotApp handles routing
    } catch (err) {
      const msg = mapFirebaseError(err.code);
      if (msg) setError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      onDone();
    } catch (err) {
      const msg = mapFirebaseError(err.code);
      if (msg) setError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const toggleMode = () => { setMode(isSignup ? "login" : "signup"); setError(""); };

  return (
    <div
      style={{
        minHeight: "100dvh", background: C.bg, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 24, position: "relative", overflow: "hidden",
      }}
    >
      <Blob t="-80px" l="45%" sz={500} />
      <Blob t="72%" l="-15%" sz={350} c="rgba(197,150,27,0.05)" />

      <div
        style={{
          position: "relative", zIndex: 1, width: "100%",
          maxWidth: 380, animation: "fadeUp 0.5s ease-out",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 20, background: C.grad,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px", boxShadow: "0 6px 24px rgba(27,140,90,0.2)",
            }}
          >
            <Ic n="savings" s={32} c="#fff" f />
          </div>
          <h1 style={{ fontFamily: F, fontSize: 26, color: C.tx, fontWeight: 700 }}>
            {isSignup ? "Create Account" : "Welcome Back"}
          </h1>
          <p style={{ fontFamily: F, fontSize: 13, color: C.t3, marginTop: 4 }}>
            {isSignup ? "Start your financial discipline journey" : "Sign in to continue to SavPot"}
          </p>
        </div>

        <Glass grad style={{ padding: 24 }}>
          {isSignup && (
            <Inp label="Full Name" value={name} onChange={setName} placeholder="Den" autoFocus />
          )}
          <Inp
            label="Email Address"
            value={email}
            onChange={setEmail}
            placeholder="you@email.com"
            type="email"
          />
          {isSignup && (
            <Inp
              label="Phone Number"
              value={phone}
              onChange={setPhone}
              placeholder="+91 98765 43210"
              type="tel"
            />
          )}
          <Inp
            label="Password"
            value={pass}
            onChange={setPass}
            placeholder="Min 6 characters"
            type="password"
          />

          {/* Inline error display */}
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 12,
              background: `${C.red}10`, border: `1px solid ${C.red}20`,
              marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <Ic n="warning" s={16} c={C.red} st={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontFamily: F, fontSize: 12, color: C.red, lineHeight: 1.4 }}>{error}</span>
            </div>
          )}

          <Btn onClick={handleSubmit} disabled={!valid || authLoading} style={{ marginTop: 4 }}>
            {authLoading ? "Please wait…" : isSignup ? "Create Account" : "Log In"}
          </Btn>

          <Divider />

          <Btn
            sec
            onClick={handleGoogle}
            disabled={authLoading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.9 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.7 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.2-2.7-.4-3.9z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 15.5 18.8 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.7 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5 0 9.7-1.6 13.4-4.4l-6.2-5.2C29.2 35.9 26.7 36 24 36c-5.2 0-9.8-2.3-11.2-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.4l6.2 5.2C36.7 39.2 44 34 44 24c0-1.3-.2-2.7-.4-3.9z" />
            </svg>
            Continue with Google
          </Btn>
        </Glass>

        <p style={{ fontFamily: F, fontSize: 11, color: C.t3, textAlign: "center", marginTop: 16 }}>
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <span
            onClick={toggleMode}
            style={{ color: C.g1, fontWeight: 600, cursor: "pointer" }}
          >
            {isSignup ? "Log In" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// ─── SETUP WIZARD (4 PAGES) ───
// ═══════════════════════════════════
const SetupWizard = ({ onDone }) => {
  const [pg, setPg] = useState(0);
  const [saving, setSaving] = useState(false);

  // Page 1 - Income
  const [incItems, setIncItems] = useState([
    { catId: "salary", label: "Salary", icon: "work", amount: "" },
  ]);

  // Page 2 - Fixed Expenses
  const [expMode, setExpMode] = useState("cats");
  const [expItems, setExpItems] = useState([]);
  const [expTotal, setExpTotal] = useState("");

  // Page 3 - Investments
  const [invMode, setInvMode] = useState("cats");
  const [invItems, setInvItems] = useState([]);
  const [invTotal, setInvTotal] = useState("");
  const [noInvest, setNoInvest] = useState(false);

  // Page 4 - Daily Budget
  const [customDaily, setCustomDaily] = useState("");

  // ── Calculations ──
  const incomeSum = incItems.reduce((s, x) => s + (Number(x.amount) || 0), 0);

  const expenseSum =
    expMode === "total"
      ? Number(expTotal) || 0
      : expItems.reduce((s, x) => s + (Number(x.amount) || 0), 0);

  const investSum = noInvest
    ? 0
    : invMode === "total"
    ? Number(invTotal) || 0
    : invItems.reduce((s, x) => s + (Number(x.amount) || 0), 0);

  const balance = incomeSum - expenseSum - investSum;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth + 1;
  const monthName = now.toLocaleString("en-IN", { month: "long" });

  const suggestedDaily = daysLeft > 0 && balance > 0 ? Math.floor(balance / daysLeft) : 0;

  const customNum = Number(customDaily) || 0;
  const effectiveDaily = customNum > 0 ? Math.min(customNum, suggestedDaily) : suggestedDaily;
  const excessToSavpot =
    customNum > 0 && customNum < suggestedDaily ? balance - customNum * daysLeft : 0;

  const canNext = [
    incomeSum > 0,
    true,
    true,
    effectiveDaily > 0 && balance > 0,
  ];

  const headers = [
    { title: "Monthly Income", sub: "What are your income sources?", icon: "account_balance_wallet", clr: C.g1 },
    { title: "Fixed Expenses", sub: "Mandatory monthly outflows", icon: "receipt_long", clr: C.red },
    { title: "Investments", sub: "Where does your money grow?", icon: "trending_up", clr: C.au },
    { title: "Daily Budget", sub: `${monthName} — ${daysLeft} days remaining`, icon: "calendar_month", clr: C.g1 },
  ];

  const h = headers[pg];

  return (
    <div
      style={{
        minHeight: "100dvh", background: C.bg, padding: "24px 24px 40px",
        position: "relative", overflow: "hidden",
      }}
    >
      <Blob t="-80px" l={pg % 2 === 0 ? "-30px" : "60%"} sz={450} />
      <Blob t="60%" l={pg % 2 === 0 ? "70%" : "-20%"} sz={350} c="rgba(197,150,27,0.05)" />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 400, margin: "0 auto", paddingTop: 16 }}>
        <Steps cur={pg} total={4} />

        {/* Header */}
        <div
          key={`hdr-${pg}`}
          style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 6,
            animation: "slideR 0.4s ease-out",
          }}
        >
          <div
            style={{
              width: 44, height: 44, borderRadius: 14, background: `${h.clr}12`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Ic n={h.icon} s={24} c={h.clr} f />
          </div>
          <div>
            <h2 style={{ fontFamily: F, fontSize: 22, color: C.tx, fontWeight: 700 }}>
              {h.title}
            </h2>
            <p style={{ fontFamily: F, fontSize: 13, color: C.t3 }}>{h.sub}</p>
          </div>
        </div>

        <Divider />

        {/* Content */}
        <div key={`pg-${pg}`} style={{ animation: "fadeUp 0.4s ease-out", minHeight: 280 }}>
          {/* ─── PAGE 1: INCOME ─── */}
          {pg === 0 && (
            <Glass grad style={{ padding: 24 }}>
              <p style={{ fontFamily: F, fontSize: 13, color: C.t2, fontWeight: 500, marginBottom: 16 }}>
                Add your income sources and amounts
              </p>
              <CatEditor cats={INCOME_CATS} items={incItems} setItems={setIncItems} accent={C.g1} />
            </Glass>
          )}

          {/* ─── PAGE 2: FIXED EXPENSES ─── */}
          {pg === 1 && (
            <Glass grad style={{ padding: 24 }}>
              <p style={{ fontFamily: F, fontSize: 13, color: C.t2, fontWeight: 500, marginBottom: 16 }}>
                Add mandatory monthly expenses
              </p>
              <ModeToggle active={expMode} onSwitch={setExpMode} accent={C.red} />

              {expMode === "total" ? (
                <Inp
                  label="Total Fixed Expenses"
                  value={expTotal}
                  onChange={setExpTotal}
                  prefix="₹"
                  type="number"
                  placeholder="50000"
                />
              ) : (
                <CatEditor
                  cats={EXPENSE_CATS}
                  items={expItems}
                  setItems={setExpItems}
                  accent={C.red}
                />
              )}
            </Glass>
          )}

          {/* ─── PAGE 3: INVESTMENTS ─── */}
          {pg === 2 && (
            <Glass grad style={{ padding: 24 }}>
              <p style={{ fontFamily: F, fontSize: 13, color: C.t2, fontWeight: 500, marginBottom: 16 }}>
                Where do you invest every month?
              </p>

              <Check
                checked={noInvest}
                onClick={() => setNoInvest(!noInvest)}
                label="I don't invest currently"
                accent={C.au}
              />

              {!noInvest && (
                <>
                  <ModeToggle active={invMode} onSwitch={setInvMode} accent={C.au} />
                  {invMode === "total" ? (
                    <Inp
                      label="Total Monthly Investments"
                      value={invTotal}
                      onChange={setInvTotal}
                      prefix="₹"
                      type="number"
                      placeholder="20000"
                    />
                  ) : (
                    <CatEditor
                      cats={INVEST_CATS}
                      items={invItems}
                      setItems={setInvItems}
                      accent={C.au}
                    />
                  )}
                </>
              )}
            </Glass>
          )}

          {/* ─── PAGE 4: DAILY BUDGET ─── */}
          {pg === 3 && (
            <>
              {/* Summary */}
              <Glass style={{ padding: 18, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Ic n="summarize" s={18} c={C.t2} />
                  <p
                    style={{
                      fontFamily: F, fontSize: 12, color: C.t2, fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.5px",
                    }}
                  >
                    Monthly Summary
                  </p>
                </div>
                {[
                  { label: "Total Income", val: incomeSum, clr: C.g1, ic: "arrow_downward" },
                  { label: "Fixed Expenses", val: expenseSum, clr: C.red, ic: "arrow_upward" },
                  { label: "Investments", val: investSum, clr: C.au, ic: "trending_up" },
                ].map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 0",
                      borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.04)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Ic n={r.ic} s={16} c={r.clr} />
                      <span style={{ fontFamily: F, fontSize: 13, color: C.t2 }}>{r.label}</span>
                    </div>
                    <span style={{ fontFamily: F, fontSize: 15, color: r.clr, fontWeight: 700 }}>
                      ₹{r.val.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
                <div style={{ height: 2, background: C.grad, margin: "10px 0", opacity: 0.2, borderRadius: 1 }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: F, fontSize: 14, color: C.tx, fontWeight: 600 }}>
                    Available Balance
                  </span>
                  <span
                    style={{
                      fontFamily: F, fontSize: 22, fontWeight: 700,
                      color: balance > 0 ? C.g1 : C.red,
                    }}
                  >
                    ₹{balance.toLocaleString("en-IN")}
                  </span>
                </div>
              </Glass>

              {/* Big budget card */}
              <Glass grad style={{ textAlign: "center", padding: 28, marginBottom: 14 }}>
                <p style={{ fontFamily: F, fontSize: 12, color: C.t3, marginBottom: 4 }}>
                  Your daily budget for {monthName}
                </p>
                <p
                  style={{
                    fontFamily: F, fontSize: 52, fontWeight: 800, margin: "4px 0",
                    background: C.grad,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  ₹{suggestedDaily.toLocaleString("en-IN")}
                </p>
                <p style={{ fontFamily: F, fontSize: 12, color: C.t3 }}>
                  ₹{balance.toLocaleString("en-IN")} ÷ {daysLeft} days remaining
                </p>
              </Glass>

              {/* Custom edit */}
              <Glass style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Ic n="edit" s={18} c={C.t2} />
                  <p
                    style={{
                      fontFamily: F, fontSize: 12, color: C.t2, fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.5px",
                    }}
                  >
                    Customize
                  </p>
                </div>
                <Inp
                  label={`Set custom daily budget (max ₹${suggestedDaily.toLocaleString("en-IN")})`}
                  value={customDaily}
                  onChange={(v) => {
                    if (v === "" || Number(v) <= suggestedDaily) setCustomDaily(v);
                  }}
                  prefix="₹"
                  type="number"
                  placeholder={suggestedDaily.toString()}
                />

                {excessToSavpot > 0 && (
                  <div
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
                      borderRadius: 14, background: `${C.g1}08`, border: `1px solid ${C.g1}18`,
                    }}
                  >
                    <Ic n="savings" s={20} c={C.g1} f st={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontFamily: F, fontSize: 13, color: C.g1, fontWeight: 600 }}>
                        ₹{excessToSavpot.toLocaleString("en-IN")} goes to SavPot!
                      </p>
                      <p style={{ fontFamily: F, fontSize: 11, color: C.t2, marginTop: 2, lineHeight: 1.5 }}>
                        The balance amount will be moved directly to your SavPot savings.
                      </p>
                    </div>
                  </div>
                )}
              </Glass>
            </>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          {pg > 0 && (
            <Btn sec onClick={() => setPg(pg - 1)} style={{ width: "auto", flex: "0 0 100px" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Ic n="arrow_back" s={18} c={C.t2} /> Back
              </span>
            </Btn>
          )}
          <Btn
            onClick={async () => {
              if (pg < 3) {
                setPg(pg + 1);
              } else {
                setSaving(true);
                try {
                  await onDone({
                    income: incomeSum,
                    incomeItems: incItems.filter((x) => Number(x.amount) > 0),
                    mandatory: expenseSum,
                    expenseItems:
                      expMode === "total" ? [] : expItems.filter((x) => Number(x.amount) > 0),
                    investments: investSum,
                    investItems:
                      noInvest || invMode === "total"
                        ? []
                        : invItems.filter((x) => Number(x.amount) > 0),
                    daily: effectiveDaily,
                    savpotDirect: excessToSavpot,
                  });
                } finally {
                  setSaving(false);
                }
              }
            }}
            disabled={!canNext[pg] || saving}
          >
            {pg < 3 ? "Continue" : saving ? "Saving…" : "Start Saving"}
          </Btn>
        </div>

        {/* Skip on pages 1 & 2 */}
        {(pg === 1 || pg === 2) && (
          <button
            onClick={() => {
              if (pg === 1 && expMode === "cats" && expItems.length === 0) {
                setExpMode("total");
                setExpTotal("0");
              }
              if (pg === 2 && !noInvest && invMode === "cats" && invItems.length === 0) {
                setNoInvest(true);
              }
              setPg(pg + 1);
            }}
            style={{
              width: "100%", background: "none", border: "none", fontFamily: F,
              fontSize: 13, color: C.t3, marginTop: 14, cursor: "pointer", padding: 8,
            }}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// ─── COMPLETION SCREEN ───
// ═══════════════════════════════════
const DoneScreen = ({ config, onGo }) => (
  <div
    style={{
      minHeight: "100dvh", background: C.bg, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 32, position: "relative", overflow: "hidden",
    }}
  >
    <Blob t="-100px" l="50%" sz={400} />
    <Blob t="60%" l="-10%" sz={300} c="rgba(197,150,27,0.05)" />

    <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 380, animation: "fadeUp 0.5s ease-out" }}>
      <div
        style={{
          width: 90, height: 90, borderRadius: 28, background: C.grad,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px", boxShadow: "0 8px 40px rgba(27,140,90,0.2)",
        }}
      >
        <Ic n="check_circle" s={44} c="#fff" f />
      </div>

      <h1 style={{ fontFamily: F, fontSize: 28, color: C.tx, fontWeight: 700, marginBottom: 8 }}>
        You're all set!
      </h1>
      <p style={{ fontFamily: F, fontSize: 14, color: C.t2, lineHeight: 1.7, marginBottom: 28 }}>
        Your daily budget is{" "}
        <span style={{ color: C.g1, fontWeight: 700 }}>
          ₹{(config?.daily || 0).toLocaleString("en-IN")}
        </span>{" "}
        per day.
      </p>

      <Glass grad style={{ textAlign: "left", marginBottom: 20 }}>
        {[
          { label: "Income", val: config?.income, clr: C.g1, ic: "arrow_downward" },
          { label: "Fixed Expenses", val: config?.mandatory, clr: C.red, ic: "arrow_upward" },
          { label: "Investments", val: config?.investments, clr: C.au, ic: "trending_up" },
          { label: "Daily Budget", val: config?.daily, clr: C.g1, ic: "today" },
        ].map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0",
              borderBottom: i < 3 ? "1px solid rgba(0,0,0,0.04)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Ic n={r.ic} s={18} c={r.clr} />
              <span style={{ fontFamily: F, fontSize: 13, color: C.t2 }}>{r.label}</span>
            </div>
            <span style={{ fontFamily: F, fontSize: 15, color: r.clr, fontWeight: 700 }}>
              ₹{(r.val || 0).toLocaleString("en-IN")}
            </span>
          </div>
        ))}

        {config?.savpotDirect > 0 && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 14px",
              marginTop: 10, borderRadius: 14, background: `${C.g1}08`,
              border: `1px solid ${C.g1}18`,
            }}
          >
            <Ic n="savings" s={20} c={C.g1} f />
            <p style={{ fontFamily: F, fontSize: 12, color: C.g1, fontWeight: 500 }}>
              ₹{config.savpotDirect.toLocaleString("en-IN")} goes directly to SavPot monthly
            </p>
          </div>
        )}
      </Glass>

      <Btn onClick={onGo}>Go to Dashboard</Btn>
    </div>
  </div>
);



// ═══════════════════════════════════
// ─── BOTTOM NAV ───
// ═══════════════════════════════════
const BottomNav = ({ active, onNav }) => {
  const tabs = [
    { id: "home", icon: "home", label: "Home" },
    { id: "savpot", icon: "savings", label: "SavPot" },
    { id: "reports", icon: "bar_chart", label: "Reports" },
    { id: "profile", icon: "person", label: "Profile" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(245,244,240,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-around", padding: "8px 0 26px", zIndex: 100 }}>
      {tabs.map((t) => (
        <div key={t.id} onClick={() => onNav(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", position: "relative", padding: "4px 16px" }}>
          {active === t.id && <div style={{ position: "absolute", top: -8, width: 24, height: 3, borderRadius: 2, background: C.grad }} />}
          <Ic n={t.icon} s={24} c={active === t.id ? C.g1 : C.t3} f={active === t.id} />
          <span style={{ fontSize: 10, fontFamily: F, fontWeight: active === t.id ? 600 : 400, marginTop: 2, color: active === t.id ? C.g1 : C.t3 }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════
// ─── SECTION WRAPPER ───
// ═══════════════════════════════════
const Section = ({ icon, title, children, accent = C.t2 }) => (
  <Glass style={{ marginBottom: 14, padding: 20 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <Ic n={icon} s={18} c={accent} />
      <p style={{ fontFamily: F, fontSize: 12, color: accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</p>
    </div>
    {children}
  </Glass>
);

// ═══════════════════════════════════
// ─── EDITABLE LIST MANAGER ───
// ═══════════════════════════════════
const ListManager = ({ items, setItems, accent = C.g1, nameLabel = "Name", iconField = true }) => {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("label");
  const [editIdx, setEditIdx] = useState(null);
  const [editName, setEditName] = useState("");

  const add = () => {
    if (newName.trim()) {
      setItems([...items, { id: Date.now().toString(), label: newName.trim(), icon: newIcon }]);
      setNewName(""); setNewIcon("label"); setAdding(false);
    }
  };
  const remove = (idx) => setItems(items.filter((_, i) => i !== idx));
  const startEdit = (idx) => { setEditIdx(idx); setEditName(items[idx].label); };
  const saveEdit = () => {
    if (editName.trim()) {
      const n = [...items]; n[editIdx] = { ...n[editIdx], label: editName.trim() }; setItems(n);
    }
    setEditIdx(null); setEditName("");
  };

  return (
    <div>
      {items.map((item, idx) => (
        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: idx < items.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic n={item.icon} s={18} c={accent} f />
          </div>
          {editIdx === idx ? (
            <div style={{ flex: 1, display: "flex", gap: 6 }}>
              <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit()} autoFocus style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `1px solid ${accent}40`, background: "rgba(255,255,255,0.6)", fontFamily: F, fontSize: 13, fontWeight: 500, color: C.tx, outline: "none" }} />
              <button onClick={saveEdit} style={{ background: "none", border: "none", cursor: "pointer" }}><Ic n="check" s={20} c={accent} /></button>
            </div>
          ) : (
            <>
              <span style={{ flex: 1, fontFamily: F, fontSize: 13, color: C.tx, fontWeight: 500 }}>{item.label}</span>
              <button onClick={() => startEdit(idx)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Ic n="edit" s={16} c={C.t3} /></button>
              <button onClick={() => remove(idx)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Ic n="delete" s={16} c={C.red} /></button>
            </>
          )}
        </div>
      ))}
      {adding ? (
        <div style={{ display: "flex", gap: 8, marginTop: 10, animation: "fadeUp 0.2s ease-out" }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={nameLabel} onKeyDown={e => e.key === "Enter" && add()} autoFocus style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.6)", fontFamily: F, fontSize: 13, color: C.tx, outline: "none" }} />
          <button onClick={add} style={{ width: 40, height: 40, borderRadius: 12, background: accent, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Ic n="check" s={20} c="#fff" /></button>
          <button onClick={() => { setAdding(false); setNewName(""); }} style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,0,0,0.04)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Ic n="close" s={20} c={C.t3} /></button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: "100%", marginTop: 10, padding: "10px 16px", borderRadius: 12, border: `1.5px dashed ${accent}40`, background: `${accent}06`, fontFamily: F, fontSize: 12, fontWeight: 600, color: accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Ic n="add" s={16} c={accent} /> Add New
        </button>
      )}
    </div>
  );
};


// ═══════════════════════════════════
// ─── HOME SCREEN (COMMAND CENTER) ──
// ═══════════════════════════════════
const HomeScreen = ({ config, onNav }) => {
  const now = new Date();
  const day = now.getDate();
  const dIM = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = dIM - day;
  const monthName = now.toLocaleString("en-IN", { month: "long" });
  const dailyBudget = config?.daily || 1000;

  const [homeTab, setHomeTab] = useState("today");
  const [showExpense, setShowExpense] = useState(false);
  const [prefill, setPrefill] = useState(null);

  // Real transactions from Firestore
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);

  const mapTxn = (t) => {
    const d = t.dateTime?.toDate ? t.dateTime.toDate() : new Date();
    return { ...t, day: t.day ?? d.getDate(), hour: t.hour ?? d.getHours(), minute: t.minute ?? d.getMinutes() };
  };

  useEffect(() => {
    if (!user) return;
    setTxLoading(true);
    getExpensesByMonth(user.uid, now.getFullYear(), now.getMonth())
      .then(txns => setTransactions(txns.map(mapTxn)))
      .catch(console.error)
      .finally(() => setTxLoading(false));
  }, [user]);

  const todayTxns = transactions.filter(t => t.day === day);
  const spentToday = todayTxns.reduce((s, t) => s + t.amount, 0);
  const remaining = Math.max(0, dailyBudget - spentToday);
  const overspent = Math.max(0, spentToday - dailyBudget);
  const spentPct = dailyBudget > 0 ? Math.min((spentToday / dailyBudget) * 100, 100) : 0;

  const [savpotBal, setSavpotBal] = useState(0);
  useEffect(() => {
    if (!user) return;
    getSavPotState(user.uid).then(s => setSavpotBal(s?.balance ?? 0)).catch(console.error);
  }, [user]);

  // Streak
  const streak = (() => {
    let s = 0;
    for (let d = day - 1; d >= 1; d--) {
      const daySpent = transactions.filter(t => t.day === d).reduce((a, t) => a + t.amount, 0);
      if (daySpent <= dailyBudget) s++;
      else break;
    }
    return s;
  })();

  // Top spend today
  const topCatToday = (() => {
    const map = {};
    todayTxns.forEach(t => { map[t.catLabel] = (map[t.catLabel] || 0) + t.amount; });
    let best = null;
    Object.entries(map).forEach(([k, v]) => { if (!best || v > best[1]) best = [k, v]; });
    return best;
  })();

  // Runway
  const totalSpentMonth = transactions.reduce((s, t) => s + t.amount, 0);
  const avgDaily = day > 0 ? totalSpentMonth / day : dailyBudget;
  const monthRemaining = (config?.income || 0) - (config?.mandatory || 0) - (config?.investments || 0) - totalSpentMonth;
  const runwayDays = avgDaily > 0 ? Math.floor(monthRemaining / avgDaily) : daysLeft;
  const surviveDate = new Date(now.getTime() + Math.max(0, runwayDays) * 86400000);

  // Month stats
  const approvedBal = (config?.income || 0) - (config?.mandatory || 0) - (config?.investments || 0);

  // Insights
  const insights = [
    streak >= 3
      ? { title: "Great discipline!", desc: `${streak}-day streak under budget. Keep going!`, icon: "military_tech", color: C.g1, cta: "View SavPot", action: () => onNav("savpot") }
      : { title: "Build your streak", desc: "Stay under budget today to start a streak.", icon: "flag", color: C.au, cta: "View Budget", action: null },
    spentToday > dailyBudget * 0.8 && spentToday <= dailyBudget
      ? { title: "Careful!", desc: `Only ₹${remaining.toLocaleString("en-IN")} left today. Watch spending.`, icon: "warning", color: "#E8C84A", cta: "What If", action: null }
      : topCatToday
      ? { title: `Top: ${topCatToday[0]}`, desc: `₹${topCatToday[1].toLocaleString("en-IN")} spent on ${topCatToday[0]} today.`, icon: "insights", color: C.au, cta: "See Category", action: () => onNav("reports") }
      : { title: "No spend yet", desc: "You haven't spent anything today. Nice!", icon: "thumb_up", color: C.g1, cta: null, action: null },
    runwayDays > daysLeft
      ? { title: "Looking good", desc: `Money can last ~${runwayDays} days. You're ahead.`, icon: "trending_up", color: C.g1, cta: "Reports", action: () => onNav("reports") }
      : { title: "Runway tight", desc: `Only ~${Math.max(0, runwayDays)} days of spend left at this pace.`, icon: "trending_down", color: C.red, cta: "See Trends", action: () => onNav("reports") },
  ];

  const [insightIdx, setInsightIdx] = useState(0);

  // Category summary (month tab)
  const catMap = {};
  transactions.forEach(t => { catMap[t.catLabel] = { total: (catMap[t.catLabel]?.total || 0) + t.amount, icon: t.catIcon, color: t.catColor }; });
  const topCats = Object.entries(catMap).map(([k, v]) => ({ label: k, ...v })).sort((a, b) => b.total - a.total).slice(0, 3);

  // Add expense handler — saves to Firestore and optimistically updates UI
  const handleAddExpense = async (exp) => {
    try {
      const ref = await addExpense(user.uid, exp);
      const newTxn = { id: ref.id, day, hour: now.getHours(), minute: now.getMinutes(), ...exp };
      setTransactions(prev => [newTxn, ...prev]);
    } catch (err) {
      console.error("Failed to save expense:", err);
    }
    setShowExpense(false);
    setPrefill(null);
  };

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, padding: "24px 20px 100px", position: "relative", overflow: "hidden" }}>
      <Blob t="-100px" l="50%" sz={450} />
      <Blob t="45%" l="-30%" sz={300} c="rgba(197,150,27,0.05)" />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 400, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: C.grad, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic n="savings" s={20} c="#fff" f />
            </div>
            <h1 style={{ fontFamily: F, fontSize: 20, color: C.tx, fontWeight: 700 }}>SavPot</h1>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onNav("reports")} style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(0,0,0,0.04)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Ic n="bar_chart" s={18} c={C.t2} /></button>
            <button onClick={() => onNav("profile")} style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(0,0,0,0.04)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Ic n="settings" s={18} c={C.t2} /></button>
          </div>
        </div>

        {/* Toggle Tabs */}
        <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 14, background: "rgba(0,0,0,0.04)", marginBottom: 18 }}>
          {["today", "month"].map(t => (
            <button key={t} onClick={() => setHomeTab(t)} style={{
              flex: 1, padding: "10px", borderRadius: 12, border: "none", fontFamily: F, fontSize: 13, fontWeight: 600,
              background: homeTab === t ? "#fff" : "transparent", color: homeTab === t ? C.tx : C.t3,
              boxShadow: homeTab === t ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              cursor: "pointer", transition: "all 0.2s", textTransform: "capitalize",
            }}>{t}</button>
          ))}
        </div>

        {/* ══ TODAY TAB ══ */}
        {homeTab === "today" && (
          <div style={{ animation: "fadeUp 0.3s ease-out" }}>
            {/* Insights Carousel */}
            <div style={{ marginBottom: 16 }}>
              <div key={insightIdx} style={{ animation: "fadeUp 0.3s ease-out" }}>
                <Glass style={{ padding: 16, borderLeft: `3px solid ${insights[insightIdx].color}` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${insights[insightIdx].color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Ic n={insights[insightIdx].icon} s={18} c={insights[insightIdx].color} f />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: F, fontSize: 14, color: C.tx, fontWeight: 600 }}>{insights[insightIdx].title}</p>
                      <p style={{ fontFamily: F, fontSize: 12, color: C.t3, marginTop: 2 }}>{insights[insightIdx].desc}</p>
                      {insights[insightIdx].cta && (
                        <button onClick={insights[insightIdx].action} style={{ background: "none", border: "none", fontFamily: F, fontSize: 11, fontWeight: 600, color: insights[insightIdx].color, cursor: "pointer", marginTop: 6, padding: 0 }}>
                          {insights[insightIdx].cta} →
                        </button>
                      )}
                    </div>
                  </div>
                </Glass>
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>
                {insights.map((_, i) => (
                  <div key={i} onClick={() => setInsightIdx(i)} style={{ width: i === insightIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === insightIdx ? C.grad : "rgba(0,0,0,0.08)", cursor: "pointer", transition: "all 0.3s" }} />
                ))}
              </div>
            </div>

            {/* Today's Budget Card */}
            <Glass grad style={{ padding: 20, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <p style={{ fontFamily: F, fontSize: 11, color: C.t3, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Today's Budget</p>
                  <p style={{ fontFamily: F, fontSize: 28, color: C.tx, fontWeight: 700, margin: "2px 0" }}>₹{dailyBudget.toLocaleString("en-IN")}</p>
                </div>
                {streak > 0 && (
                  <div style={{ padding: "4px 10px", borderRadius: 10, background: `${C.g1}10`, display: "flex", alignItems: "center", gap: 4 }}>
                    <Ic n="local_fire_department" s={14} c={C.g1} f />
                    <span style={{ fontFamily: F, fontSize: 11, color: C.g1, fontWeight: 700 }}>{streak}d streak</span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <p style={{ fontFamily: F, fontSize: 10, color: C.t3 }}>Spent</p>
                  <p style={{ fontFamily: F, fontSize: 18, color: overspent > 0 ? C.red : C.tx, fontWeight: 700 }}>₹{spentToday.toLocaleString("en-IN")}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: F, fontSize: 10, color: C.t3 }}>{overspent > 0 ? "Overspent" : "Remaining"}</p>
                  <p style={{ fontFamily: F, fontSize: 18, color: overspent > 0 ? C.red : C.g1, fontWeight: 700 }}>₹{(overspent > 0 ? overspent : remaining).toLocaleString("en-IN")}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 8, background: "rgba(0,0,0,0.04)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", width: `${spentPct}%`, borderRadius: 4, background: overspent > 0 ? "linear-gradient(90deg,#E8C84A,#E53E3E)" : C.grad, transition: "width 0.5s" }} />
              </div>

              {/* Midnight transfer */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, background: overspent > 0 ? `${C.red}06` : `${C.g1}06` }}>
                <Ic n={overspent > 0 ? "warning" : "bedtime"} s={16} c={overspent > 0 ? C.red : C.g1} />
                <p style={{ fontFamily: F, fontSize: 11, color: overspent > 0 ? C.red : C.g1, fontWeight: 500 }}>
                  {overspent > 0 ? "Overspend adjusts upcoming days — SavPot stays safe." : `₹${remaining.toLocaleString("en-IN")} will move to SavPot at 12:00 AM`}
                </p>
              </div>
            </Glass>

            {/* Runway Chip */}
            <div onClick={() => onNav("reports")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 14, background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.72)", marginBottom: 14, cursor: "pointer" }}>
              <Ic n="speed" s={18} c={runwayDays > daysLeft ? C.g1 : C.au} />
              <span style={{ fontFamily: F, fontSize: 12, color: C.tx, fontWeight: 500, flex: 1 }}>
                {day < 3 ? "Not enough data yet" : `At this pace: survives till ${surviveDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} (~${Math.max(0, runwayDays)}d)`}
              </span>
              <Ic n="chevron_right" s={16} c={C.t3} />
            </div>

            {/* SavPot Quick */}
            <Glass onClick={() => onNav("savpot")} style={{ padding: 16, marginBottom: 14, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: C.grad, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic n="savings" s={20} c="#fff" f />
                </div>
                <div>
                  <p style={{ fontFamily: F, fontSize: 11, color: C.t3 }}>SavPot Balance</p>
                  <p style={{ fontFamily: F, fontSize: 18, color: C.tx, fontWeight: 700 }}>₹{savpotBal.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {remaining > 0 && <p style={{ fontFamily: F, fontSize: 10, color: C.g1, fontWeight: 500 }}>+₹{remaining.toLocaleString("en-IN")} tonight</p>}
                <Ic n="chevron_right" s={16} c={C.t3} />
              </div>
            </Glass>

            {/* Top Spend Today */}
            {topCatToday && (
              <div onClick={() => onNav("reports")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 14, background: `${topCatToday ? C.au : C.t3}06`, border: "1px solid rgba(0,0,0,0.04)", marginBottom: 14, cursor: "pointer" }}>
                <Ic n="local_fire_department" s={16} c={C.au} />
                <span style={{ fontFamily: F, fontSize: 12, color: C.tx, fontWeight: 500, flex: 1 }}>Top spend today: <strong>{topCatToday[0]}</strong> ₹{topCatToday[1].toLocaleString("en-IN")}</span>
                <Ic n="chevron_right" s={14} c={C.t3} />
              </div>
            )}

            {/* Recent Transactions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontFamily: F, fontSize: 12, color: C.t2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent Transactions</p>
            </div>
            {txLoading ? (
              <>{[56,48,56].map((h, i) => <Skeleton key={i} h={h} mb={6} />)}</>
            ) : transactions.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <Ic n="receipt_long" s={40} c={C.t3} />
                <p style={{ fontFamily: F, fontSize: 13, color: C.t3, marginTop: 8 }}>No transactions yet. Add your first expense!</p>
              </div>
            ) : null}
            {!txLoading && transactions.slice(0, 10).map((t, idx) => {
              const isToday = t.day === day;
              const time = isToday ? `${t.hour}:${String(t.minute).padStart(2, "0")}` : `Day ${t.day}`;
              return (
                <Glass key={t.id} style={{ padding: 12, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${t.catColor}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Ic n={t.catIcon} s={18} c={t.catColor} f />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: F, fontSize: 13, color: C.tx, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.vendor}</p>
                    <p style={{ fontFamily: F, fontSize: 10, color: C.t3 }}>{t.catLabel} · {t.payMethod} · {time}</p>
                  </div>
                  <span style={{ fontFamily: F, fontSize: 14, color: C.red, fontWeight: 700, flexShrink: 0 }}>-₹{t.amount.toLocaleString("en-IN")}</span>
                  <button onClick={(e) => { e.stopPropagation(); setPrefill({ amount: String(t.amount), category: t.catLabel, catIcon: t.catIcon, catColor: t.catColor, vendor: t.vendor, payMethod: t.payMethod }); setShowExpense(true); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}>
                    <Ic n="replay" s={16} c={C.t3} />
                  </button>
                </Glass>
              );
            })}
          </div>
        )}

        {/* ══ MONTH TAB ══ */}
        {homeTab === "month" && (
          <div style={{ animation: "fadeUp 0.3s ease-out" }}>
            {/* Monthly Snapshot */}
            <Glass grad style={{ padding: 20, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Ic n="calendar_month" s={18} c={C.g1} />
                <p style={{ fontFamily: F, fontSize: 12, color: C.g1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{monthName} Snapshot</p>
              </div>
              {[
                { label: "Approved Balance", val: approvedBal, clr: C.g1 },
                { label: "Month Spent", val: totalSpentMonth, clr: C.red },
                { label: "Month Remaining", val: monthRemaining, clr: monthRemaining > 0 ? C.g1 : C.red },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                  <span style={{ fontFamily: F, fontSize: 13, color: C.t2 }}>{r.label}</span>
                  <span style={{ fontFamily: F, fontSize: 15, color: r.clr, fontWeight: 700 }}>₹{r.val.toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontFamily: F, fontSize: 12, color: C.t3 }}>{daysLeft} days left</span>
                <button onClick={() => onNav("reports")} style={{ background: "none", border: "none", fontFamily: F, fontSize: 11, color: C.g1, fontWeight: 600, cursor: "pointer" }}>View Full Reports →</button>
              </div>
            </Glass>

            {/* Category Summary */}
            <Glass style={{ padding: 20, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Ic n="donut_small" s={18} c={C.au} />
                <p style={{ fontFamily: F, fontSize: 12, color: C.au, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Top Categories</p>
              </div>
              {topCats.map((cat, i) => (
                <div key={cat.label} onClick={() => onNav("reports")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < topCats.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none", cursor: "pointer" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Ic n={cat.icon} s={18} c={cat.color} f />
                  </div>
                  <span style={{ flex: 1, fontFamily: F, fontSize: 13, color: C.tx, fontWeight: 500 }}>{cat.label}</span>
                  <span style={{ fontFamily: F, fontSize: 14, color: C.tx, fontWeight: 700 }}>₹{cat.total.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </Glass>

            {/* SavPot Month Stats */}
            <Glass grad onClick={() => onNav("savpot")} style={{ padding: 20, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Ic n="savings" s={22} c={C.g1} f />
                <div>
                  <p style={{ fontFamily: F, fontSize: 11, color: C.t3 }}>Saved this month</p>
                  <p style={{ fontFamily: F, fontSize: 18, color: C.g1, fontWeight: 700 }}>₹{Math.round(savpotBal * 0.8).toLocaleString("en-IN")}</p>
                </div>
              </div>
              <Ic n="chevron_right" s={18} c={C.t3} />
            </Glass>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 40, paddingBottom: 20 }}>
          <p style={{ fontFamily: F, fontSize: 28, color: "#B0ADA8", fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.15 }}>
            Built with<br />Discipline
          </p>
          <p style={{ fontFamily: F, fontSize: 11, color: "#C8C5BF", fontWeight: 400, marginTop: 10, letterSpacing: "0.5px" }}>
            domore.ltd
          </p>
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => { setPrefill(null); setShowExpense(true); }} style={{ position: "fixed", bottom: 90, right: "calc(50% - 190px)", width: 56, height: 56, borderRadius: 18, background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 28px rgba(27,140,90,0.3)", cursor: "pointer", zIndex: 50, border: "none" }}>
        <Ic n="add" s={28} c="#fff" />
      </button>

      {/* ── ADD EXPENSE SHEET ── */}
      {showExpense && <AddExpenseSheet remaining={remaining} overspent={overspent} dailyBudget={dailyBudget} prefill={prefill} onSave={handleAddExpense} onClose={() => { setShowExpense(false); setPrefill(null); }} />}
    </div>
  );
};

// ─── ADD EXPENSE BOTTOM SHEET ───
const EXPENSE_CATEGORIES = [
  { id: "food", label: "Food", icon: "restaurant", color: "#2CC07E" },
  { id: "groceries", label: "Groceries", icon: "shopping_cart", color: "#1B8C5A" },
  { id: "fuel", label: "Fuel", icon: "local_gas_station", color: "#C5961B" },
  { id: "drinks", label: "Drinks", icon: "local_cafe", color: "#E8C84A" },
  { id: "bills", label: "Bills", icon: "receipt_long", color: "#6F767E" },
  { id: "home_cat", label: "Home", icon: "home", color: "#3BA1C8" },
  { id: "debt", label: "Debt", icon: "credit_card", color: "#E53E3E" },
  { id: "other", label: "Other", icon: "more_horiz", color: "#9A9FA5" },
];

const AddExpenseSheet = ({ remaining, overspent, dailyBudget, prefill, onSave, onClose }) => {
  const [amt, setAmt] = useState(prefill?.amount || "");
  const [cat, setCat] = useState(prefill?.category || "Food");
  const [catIcon, setCatIcon] = useState(prefill?.catIcon || "restaurant");
  const [catColor, setCatColor] = useState(prefill?.catColor || "#2CC07E");
  const [vendor, setVendor] = useState(prefill?.vendor || "");
  const [pay, setPay] = useState(prefill?.payMethod || "Cash");

  const amtNum = Number(amt) || 0;
  const actualRemaining = overspent > 0 ? -overspent : remaining;
  const afterRemaining = actualRemaining - amtNum;
  const willOverspend = afterRemaining < 0;
  const expectedSavpot = Math.max(0, remaining - amtNum);

  const suggestions = ["Swiggy", "Zomato", "Starbucks", "Amazon", "Shell", "DMart", "BigBasket", "Zepto"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 430, maxHeight: "88dvh", background: C.bg, borderRadius: "24px 24px 0 0", padding: "20px 24px 32px", overflowY: "auto", animation: "fadeUp 0.3s ease-out" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontFamily: F, fontSize: 18, color: C.tx, fontWeight: 700 }}>
            {prefill ? "Repeat Expense" : "Add Expense"}
          </h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(0,0,0,0.04)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Ic n="close" s={18} c={C.t2} /></button>
        </div>

        {/* Context Banner */}
        <div style={{ padding: "10px 14px", borderRadius: 12, background: overspent > 0 ? `${C.red}06` : `${C.g1}06`, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Ic n={overspent > 0 ? "warning" : "info"} s={16} c={overspent > 0 ? C.red : C.g1} />
          <span style={{ fontFamily: F, fontSize: 12, color: overspent > 0 ? C.red : C.g1, fontWeight: 500 }}>
            {overspent > 0 ? `Already overspent by ₹${overspent.toLocaleString("en-IN")}` : `Today remaining: ₹${remaining.toLocaleString("en-IN")}`}
          </span>
        </div>

        {/* Amount */}
        <Inp label="Amount" value={amt} onChange={setAmt} prefix="₹" type="number" placeholder="250" autoFocus />

        {/* Category */}
        <p style={{ fontFamily: F, fontSize: 12, color: C.t3, fontWeight: 500, marginBottom: 8 }}>Category</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 16 }}>
          {EXPENSE_CATEGORIES.map(c => (
            <div key={c.id} onClick={() => { setCat(c.label); setCatIcon(c.icon); setCatColor(c.color); }} style={{
              padding: "10px 4px", borderRadius: 12, textAlign: "center", cursor: "pointer", transition: "all 0.15s",
              border: cat === c.label ? `2px solid ${c.color}` : "1px solid rgba(0,0,0,0.06)",
              background: cat === c.label ? `${c.color}10` : "rgba(255,255,255,0.4)",
            }}>
              <Ic n={c.icon} s={20} c={cat === c.label ? c.color : C.t3} f={cat === c.label} st={{ display: "block", margin: "0 auto 2px" }} />
              <p style={{ fontFamily: F, fontSize: 9, color: cat === c.label ? c.color : C.t3, fontWeight: 500 }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* Vendor */}
        <Inp label="Vendor" value={vendor} onChange={setVendor} placeholder="Swiggy, Amazon..." />
        {!vendor && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: -8, marginBottom: 12 }}>
            {suggestions.slice(0, 6).map(s => (
              <div key={s} onClick={() => setVendor(s)} style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(0,0,0,0.03)", cursor: "pointer", fontFamily: F, fontSize: 10, color: C.t3 }}>{s}</div>
            ))}
          </div>
        )}

        {/* Payment Source */}
        <p style={{ fontFamily: F, fontSize: 12, color: C.t3, fontWeight: 500, marginBottom: 8 }}>Payment Source</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[{ id: "Cash", icon: "payments" }, { id: "Bank", icon: "account_balance" }, { id: "Card", icon: "credit_card" }].map(p => (
            <div key={p.id} onClick={() => setPay(p.id)} style={{
              flex: 1, padding: "10px 8px", borderRadius: 12, textAlign: "center", cursor: "pointer",
              border: pay === p.id ? `2px solid ${C.g1}` : "1px solid rgba(0,0,0,0.06)",
              background: pay === p.id ? C.gp : "rgba(255,255,255,0.4)",
            }}>
              <Ic n={p.icon} s={18} c={pay === p.id ? C.g1 : C.t3} f={pay === p.id} st={{ display: "block", margin: "0 auto 2px" }} />
              <span style={{ fontFamily: F, fontSize: 10, fontWeight: 500, color: pay === p.id ? C.g1 : C.t3 }}>{p.id}</span>
            </div>
          ))}
        </div>

        {/* Live Preview */}
        {amtNum > 0 && (
          <div style={{ padding: "12px 14px", borderRadius: 14, background: willOverspend ? `${C.red}06` : `${C.g1}06`, marginBottom: 16, animation: "fadeUp 0.2s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: F, fontSize: 12, color: C.t2 }}>After this expense</span>
              <span style={{ fontFamily: F, fontSize: 13, color: willOverspend ? C.red : C.g1, fontWeight: 700 }}>
                {willOverspend ? `Overspent ₹${Math.abs(afterRemaining).toLocaleString("en-IN")}` : `Remaining ₹${afterRemaining.toLocaleString("en-IN")}`}
              </span>
            </div>
            {!willOverspend && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: F, fontSize: 11, color: C.t3 }}>Expected SavPot tonight</span>
                <span style={{ fontFamily: F, fontSize: 12, color: C.g1, fontWeight: 600 }}>₹{expectedSavpot.toLocaleString("en-IN")}</span>
              </div>
            )}
            {willOverspend && (
              <p style={{ fontFamily: F, fontSize: 11, color: C.red, marginTop: 2 }}>Upcoming daily budgets will reduce.</p>
            )}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => { if (amtNum > 0 && cat) onSave({ amount: amtNum, category: cat === "Home" ? "home_cat" : cat.toLowerCase(), catLabel: cat, catIcon, catColor, vendor: vendor || "Unknown", payMethod: pay }); }} disabled={amtNum <= 0}>
            Save Expense
          </Btn>
          <Btn sec onClick={onClose} style={{ flex: 0, width: 80 }}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
};


// ═══════════════════════════════════
// ─── ACCORDION ───
// ═══════════════════════════════════
const Accordion = ({ icon, title, accent = C.g1, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Glass style={{ marginBottom: 10, padding: 0, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", cursor: "pointer" }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: `${accent}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Ic n={icon} s={18} c={accent} f />
        </div>
        <span style={{ flex: 1, fontFamily: F, fontSize: 14, color: C.tx, fontWeight: 600 }}>{title}</span>
        <Ic n={open ? "expand_less" : "expand_more"} s={22} c={C.t3} />
      </div>
      {open && (
        <div style={{ padding: "0 20px 20px", animation: "fadeUp 0.2s ease-out" }}>
          <div style={{ height: 1, background: "rgba(0,0,0,0.05)", marginBottom: 16 }} />
          {children}
        </div>
      )}
    </Glass>
  );
};

// ═══════════════════════════════════
// ─── PROFILE SCREEN ───
// ═══════════════════════════════════
const AVATARS = [
  { id: "a1", bg: "linear-gradient(135deg,#667eea,#764ba2)", icon: "face" },
  { id: "a2", bg: "linear-gradient(135deg,#f093fb,#f5576c)", icon: "face_2" },
  { id: "a3", bg: "linear-gradient(135deg,#4facfe,#00f2fe)", icon: "face_3" },
  { id: "a4", bg: "linear-gradient(135deg,#43e97b,#38f9d7)", icon: "face_4" },
  { id: "a5", bg: "linear-gradient(135deg,#fa709a,#fee140)", icon: "face_5" },
];

const ACCT_TYPES = [
  { id: "cash", label: "Cash", icon: "payments" },
  { id: "bank", label: "Bank Account", icon: "account_balance" },
  { id: "credit", label: "Credit Card", icon: "credit_card" },
  { id: "wallet", label: "Wallet", icon: "account_balance_wallet" },
];

const ProfileScreen = ({ config, onLogout }) => {
  const { user, profile, refreshProfile } = useAuth();

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState("a1");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const email = profile?.email || user?.email || "";

  // Sync profile data when it loads
  useEffect(() => {
    if (profile) {
      setAvatar(profile.avatar || "a1");
      setName(profile.name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(user.uid, { name, phone, avatar });
      await refreshProfile();
      setPwToast("Profile saved!");
      setTimeout(() => setPwToast(""), 2500);
    } catch (err) {
      console.error("Profile save failed:", err);
      setPwToast("Save failed. Try again.");
      setTimeout(() => setPwToast(""), 2500);
    }
    setEditing(false);
  };

  // Change password
  const [showPwChange, setShowPwChange] = useState(false);
  const [currPw, setCurrPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwToast, setPwToast] = useState("");

  // Accounts — loaded from Firestore
  const [accounts, setAccounts] = useState([]);
  const [acctLoading, setAcctLoading] = useState(true);
  const [showAddAcct, setShowAddAcct] = useState(false);
  const [newAcct, setNewAcct] = useState({ type: "bank", name: "", bankName: "", amount: "" });

  useEffect(() => {
    if (!user) return;
    setAcctLoading(true);
    getAccounts(user.uid).then(setAccounts).catch(console.error).finally(() => setAcctLoading(false));
  }, [user]);

  // Additional Income
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [addIncAmt, setAddIncAmt] = useState("");
  const [addIncAcct, setAddIncAcct] = useState("cash");
  const [addIncTarget, setAddIncTarget] = useState("daily");

  // Income Categories — loaded from Firestore, with defaults
  const defaultIncomeCats = [
    { id: "salary", label: "Salary", icon: "work" },
    { id: "cash_inc", label: "Cash", icon: "payments" },
    { id: "freelance", label: "Freelance", icon: "laptop" },
    { id: "business", label: "Business", icon: "storefront" },
    { id: "rental", label: "Rental", icon: "apartment" },
  ];
  const [incomeCats, setIncomeCats] = useState(defaultIncomeCats);

  // Expense Categories — loaded from Firestore, with defaults
  const defaultExpCats = [
    { id: "food", label: "Food", icon: "restaurant" },
    { id: "groceries", label: "Groceries", icon: "shopping_cart" },
    { id: "fuel", label: "Fuel", icon: "local_gas_station" },
    { id: "drinks", label: "Drinks", icon: "local_cafe" },
    { id: "bills", label: "Bills", icon: "receipt_long" },
    { id: "home_exp", label: "Home", icon: "home" },
    { id: "debt", label: "Debt", icon: "credit_card" },
    { id: "other", label: "Other", icon: "more_horiz" },
  ];
  const [expCats, setExpCats] = useState(defaultExpCats);

  // Vendors — loaded from Firestore, with defaults
  const defaultVendors = [
    { id: "v1", label: "Swiggy", icon: "restaurant" },
    { id: "v2", label: "Zomato", icon: "restaurant" },
    { id: "v3", label: "Amazon", icon: "shopping_cart" },
    { id: "v4", label: "Shell Petrol", icon: "local_gas_station" },
    { id: "v5", label: "Starbucks", icon: "local_cafe" },
  ];
  const [vendors, setVendors] = useState(defaultVendors);

  // Liabilities
  const [liabilities, setLiabilities] = useState([]);
  const [showAddLiab, setShowAddLiab] = useState(false);
  const [newLiab, setNewLiab] = useState({ type: "bank", name: "", lender: "", outstanding: "", emi: "", inFixed: true });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getCategories(user.uid, "income"),
      getCategories(user.uid, "expense"),
      getVendors(user.uid),
      getLiabilities(user.uid),
    ]).then(([inc, exp, vend, liab]) => {
      if (inc && inc.length > 0) setIncomeCats(inc);
      if (exp && exp.length > 0) setExpCats(exp);
      if (vend && vend.length > 0) setVendors(vend);
      setLiabilities(liab || []);
    }).catch(console.error);
  }, [user]);

  const acctTotal = accounts.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  const totalDebt = liabilities.reduce((s, l) => s + (Number(l.outstanding) || 0), 0);
  const totalEmi = liabilities.reduce((s, l) => s + (Number(l.emi) || 0), 0);

  const handleAddAccount = async () => {
    if (!newAcct.name.trim()) return;
    try {
      const ref = await addAccount(user.uid, newAcct);
      setAccounts(prev => [...prev, { ...newAcct, id: ref.id }]);
      setNewAcct({ type: "bank", name: "", bankName: "", amount: "" });
      setShowAddAcct(false);
    } catch (err) { console.error("Add account failed:", err); }
  };
  const handleRemoveAccount = async (id) => {
    try {
      await deleteAccount(user.uid, id);
      setAccounts(prev => prev.filter(a => a.id !== id));
    } catch (err) { console.error("Delete account failed:", err); }
  };

  const handleAddLiability = async () => {
    if (!newLiab.name.trim()) return;
    try {
      const ref = await addLiability(user.uid, newLiab);
      setLiabilities(prev => [...prev, { ...newLiab, id: ref.id }]);
      setNewLiab({ type: "bank", name: "", lender: "", outstanding: "", emi: "", inFixed: true });
      setShowAddLiab(false);
    } catch (err) { console.error("Add liability failed:", err); }
  };
  const handleRemoveLiability = async (id) => {
    try {
      await deleteLiability(user.uid, id);
      setLiabilities(prev => prev.filter(l => l.id !== id));
    } catch (err) { console.error("Delete liability failed:", err); }
  };

  // Category/vendor auto-save wrappers
  const saveIncomeCats = async (items) => {
    setIncomeCats(items);
    if (user) await saveCategories(user.uid, "income", items).catch(console.error);
  };
  const saveExpCats = async (items) => {
    setExpCats(items);
    if (user) await saveCategories(user.uid, "expense", items).catch(console.error);
  };
  const saveVendorsFn = async (items) => {
    setVendors(items);
    if (user) await saveVendors(user.uid, items).catch(console.error);
  };

  const handlePwChange = async () => {
    if (!currPw || !newPw || !confirmPw) { setPwToast("All fields required"); setTimeout(() => setPwToast(""), 2000); return; }
    if (newPw.length < 6) { setPwToast("Min 6 characters"); setTimeout(() => setPwToast(""), 2000); return; }
    if (newPw !== confirmPw) { setPwToast("Passwords don't match"); setTimeout(() => setPwToast(""), 2000); return; }
    try {
      await changePassword(currPw, newPw);
      setCurrPw(""); setNewPw(""); setConfirmPw("");
      setShowPwChange(false);
      setPwToast("Password updated!");
    } catch (err) {
      setPwToast(mapFirebaseError(err.code) || "Password change failed.");
    }
    setTimeout(() => setPwToast(""), 2500);
  };

  const selectedAvatar = AVATARS.find(a => a.id === avatar) || AVATARS[0];

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, padding: "24px 20px 100px", position: "relative", overflow: "hidden" }}>
      <Blob t="-80px" l="20%" sz={400} />
      <Blob t="50%" l="70%" sz={300} c="rgba(197,150,27,0.05)" />

      {/* Toast */}
      {pwToast && (
        <div style={{ position: "fixed", top: 40, left: "50%", transform: "translateX(-50%)", padding: "12px 24px", borderRadius: 14, background: C.tx, color: "#fff", fontFamily: F, fontSize: 13, fontWeight: 500, zIndex: 200, boxShadow: "0 6px 20px rgba(0,0,0,0.2)", animation: "fadeUp 0.3s ease-out" }}>
          {pwToast}
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 400, margin: "0 auto", paddingTop: 8 }}>

        {/* ── PROFILE CARD ── */}
        <Glass grad style={{ padding: 24, marginBottom: 14 }}>
          {/* Edit button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: editing ? 8 : 0 }}>
            <button onClick={editing ? handleSaveProfile : () => setEditing(true)} style={{
              padding: "6px 14px", borderRadius: 10, border: "none", cursor: "pointer",
              background: editing ? C.grad : "rgba(0,0,0,0.04)",
              fontFamily: F, fontSize: 11, fontWeight: 600,
              color: editing ? "#fff" : C.t2,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <Ic n={editing ? "check" : "edit"} s={14} c={editing ? "#fff" : C.t2} />
              {editing ? "Done" : "Edit"}
            </button>
          </div>

          {/* Avatar */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            {editing ? (
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 8, animation: "fadeUp 0.2s ease-out" }}>
                {AVATARS.map(av => (
                  <div key={av.id} onClick={() => setAvatar(av.id)} style={{
                    width: avatar === av.id ? 58 : 44, height: avatar === av.id ? 58 : 44,
                    borderRadius: avatar === av.id ? 20 : 14, background: av.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all 0.3s",
                    border: avatar === av.id ? "3px solid #fff" : "2px solid transparent",
                    boxShadow: avatar === av.id ? "0 4px 16px rgba(0,0,0,0.15)" : "none",
                  }}>
                    <Ic n={av.icon} s={avatar === av.id ? 26 : 20} c="#fff" f />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: 22, background: selectedAvatar.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 8px", border: "3px solid #fff",
                boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
              }}>
                <Ic n={selectedAvatar.icon} s={36} c="#fff" f />
              </div>
            )}
          </div>

          {/* User Details */}
          {editing ? (
            <div style={{ animation: "fadeUp 0.2s ease-out" }}>
              <Inp label="Name" value={name} onChange={setName} placeholder="Your name" />
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: F, fontSize: 12, color: C.t3, display: "block", marginBottom: 6, fontWeight: 500 }}>Email (unique ID)</label>
                <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Ic n="lock" s={14} c={C.t3} />
                    <span style={{ fontFamily: F, fontSize: 14, color: C.t3, fontWeight: 500 }}>{email}</span>
                  </div>
                </div>
                <p style={{ fontFamily: F, fontSize: 10, color: C.t3, marginTop: 4 }}>Email cannot be changed — it's your unique identifier</p>
              </div>
              <Inp label="Phone Number" value={phone} onChange={setPhone} placeholder="+91" type="tel" />

              {/* Change Password */}
              <button onClick={() => setShowPwChange(!showPwChange)} style={{
                width: "100%", padding: "12px 16px", borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.4)",
                fontFamily: F, fontSize: 13, fontWeight: 600, color: C.au,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Ic n="key" s={16} c={C.au} /> Change Password
                </span>
                <Ic n={showPwChange ? "expand_less" : "expand_more"} s={18} c={C.t3} />
              </button>

              {showPwChange && (
                <div style={{ marginTop: 12, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.4)", border: "1px solid rgba(0,0,0,0.06)", animation: "fadeUp 0.2s ease-out" }}>
                  <Inp label="Current Password" value={currPw} onChange={setCurrPw} type="password" placeholder="Enter current password" />
                  <Inp label="New Password" value={newPw} onChange={setNewPw} type="password" placeholder="Min 6 characters" />
                  <Inp label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} type="password" placeholder="Re-enter new password" />
                  {newPw && confirmPw && newPw !== confirmPw && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <Ic n="warning" s={14} c={C.red} />
                      <span style={{ fontFamily: F, fontSize: 11, color: C.red }}>Passwords don't match</span>
                    </div>
                  )}
                  <Btn onClick={handlePwChange} style={{ background: "linear-gradient(135deg, #C5961B, #E8C84A)" }}>Update Password</Btn>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontFamily: F, fontSize: 20, color: C.tx, fontWeight: 700 }}>{name}</h2>
              <p style={{ fontFamily: F, fontSize: 12, color: C.t3, marginTop: 2 }}>{email}</p>
              <p style={{ fontFamily: F, fontSize: 12, color: C.t3, marginTop: 1 }}>{phone}</p>
            </div>
          )}
        </Glass>

        {/* ── CURRENT SETUP ── */}
        <Section icon="tune" title="Current Setup" accent={C.g1}>
          {[
            { label: "Monthly Income", val: config?.income, clr: C.g1, ic: "arrow_downward" },
            { label: "Fixed Expenses", val: config?.mandatory, clr: C.red, ic: "arrow_upward" },
            { label: "Investments", val: config?.investments, clr: C.au, ic: "trending_up" },
            { label: "Daily Budget", val: config?.daily, clr: C.g1, ic: "today" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 3 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Ic n={r.ic} s={16} c={r.clr} />
                <span style={{ fontFamily: F, fontSize: 13, color: C.t2 }}>{r.label}</span>
              </div>
              <span style={{ fontFamily: F, fontSize: 15, color: r.clr, fontWeight: 700 }}>₹{(r.val || 0).toLocaleString("en-IN")}</span>
            </div>
          ))}
        </Section>

        {/* ── ACCORDION SECTIONS ── */}

        {/* Manage Accounts */}
        <Accordion icon="account_balance" title="Manage Accounts" accent={C.g1}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", borderRadius: 12, background: `${C.g1}08`, marginBottom: 14 }}>
            <span style={{ fontFamily: F, fontSize: 12, color: C.t2, fontWeight: 500 }}>Total Balance</span>
            <span style={{ fontFamily: F, fontSize: 20, color: C.g1, fontWeight: 700 }}>₹{acctTotal.toLocaleString("en-IN")}</span>
          </div>
          {accounts.map(acct => {
            const at = ACCT_TYPES.find(t => t.id === acct.type) || ACCT_TYPES[0];
            return (
              <div key={acct.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${C.g1}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Ic n={at.icon} s={16} c={C.g1} f />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: F, fontSize: 13, color: C.tx, fontWeight: 600 }}>{acct.name}</p>
                  {acct.bankName && <p style={{ fontFamily: F, fontSize: 11, color: C.t3 }}>{acct.bankName}</p>}
                </div>
                <span style={{ fontFamily: F, fontSize: 14, color: C.tx, fontWeight: 700, marginRight: 4 }}>₹{(Number(acct.amount) || 0).toLocaleString("en-IN")}</span>
                <button onClick={() => handleRemoveAccount(acct.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Ic n="close" s={16} c={C.t3} /></button>
              </div>
            );
          })}
          {showAddAcct ? (
            <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.4)", border: "1px solid rgba(0,0,0,0.06)", animation: "fadeUp 0.2s ease-out" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {ACCT_TYPES.map(at => (
                  <div key={at.id} onClick={() => setNewAcct({...newAcct, type: at.id})} style={{ padding: "6px 12px", borderRadius: 10, cursor: "pointer", border: newAcct.type === at.id ? `2px solid ${C.g1}` : "1px solid rgba(0,0,0,0.06)", background: newAcct.type === at.id ? C.gp : "transparent" }}>
                    <span style={{ fontFamily: F, fontSize: 11, color: newAcct.type === at.id ? C.g1 : C.t3, fontWeight: 500 }}>{at.label}</span>
                  </div>
                ))}
              </div>
              <Inp label="Account Name" value={newAcct.name} onChange={v => setNewAcct({...newAcct, name: v})} placeholder="e.g. Savings Account" />
              {(newAcct.type === "bank" || newAcct.type === "credit") && <Inp label={newAcct.type === "bank" ? "Bank Name" : "Card Issuer"} value={newAcct.bankName} onChange={v => setNewAcct({...newAcct, bankName: v})} placeholder="e.g. HDFC" />}
              <Inp label="Balance" value={newAcct.amount} onChange={v => setNewAcct({...newAcct, amount: v})} prefix="₹" type="number" placeholder="0" />
              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={handleAddAccount} style={{ flex: 1 }}>Add</Btn>
                <Btn sec onClick={() => setShowAddAcct(false)} style={{ flex: 0, width: 80 }}>Cancel</Btn>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddAcct(true)} style={{ width: "100%", marginTop: 10, padding: "10px", borderRadius: 12, border: `1.5px dashed ${C.g1}40`, background: `${C.g1}06`, fontFamily: F, fontSize: 12, fontWeight: 600, color: C.g1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Ic n="add" s={16} c={C.g1} /> Add Account
            </button>
          )}
        </Accordion>

        {/* Additional Income */}
        <Accordion icon="add_card" title="Additional Income" accent={C.g1}>
          {showAddIncome ? (
            <div style={{ animation: "fadeUp 0.2s ease-out" }}>
              <Inp label="Amount" value={addIncAmt} onChange={setAddIncAmt} prefix="₹" type="number" placeholder="10000" />
              <p style={{ fontFamily: F, fontSize: 12, color: C.t3, marginBottom: 8, fontWeight: 500 }}>Credit to</p>
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                {accounts.map(a => (
                  <div key={a.id} onClick={() => setAddIncAcct(a.id)} style={{ padding: "6px 12px", borderRadius: 10, cursor: "pointer", border: addIncAcct === a.id ? `2px solid ${C.g1}` : "1px solid rgba(0,0,0,0.06)", background: addIncAcct === a.id ? C.gp : "transparent" }}>
                    <span style={{ fontFamily: F, fontSize: 11, color: addIncAcct === a.id ? C.g1 : C.t3, fontWeight: 500 }}>{a.name}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: F, fontSize: 12, color: C.t3, marginBottom: 8, fontWeight: 500 }}>Route to</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[{ id: "daily", label: "Daily Budget", icon: "calendar_today" }, { id: "savpot", label: "SavPot", icon: "savings" }].map(t => (
                  <div key={t.id} onClick={() => setAddIncTarget(t.id)} style={{ flex: 1, padding: "12px 8px", borderRadius: 14, textAlign: "center", cursor: "pointer", border: addIncTarget === t.id ? `2px solid ${C.g1}` : "1px solid rgba(0,0,0,0.06)", background: addIncTarget === t.id ? C.gp : "rgba(255,255,255,0.4)" }}>
                    <Ic n={t.icon} s={20} c={addIncTarget === t.id ? C.g1 : C.t3} f={addIncTarget === t.id} st={{ display: "block", margin: "0 auto 4px" }} />
                    <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: addIncTarget === t.id ? C.g1 : C.t3 }}>{t.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={() => { setShowAddIncome(false); setAddIncAmt(""); }}>Add Income</Btn>
                <Btn sec onClick={() => setShowAddIncome(false)} style={{ flex: 0, width: 80 }}>Cancel</Btn>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "4px 0" }}>
              <p style={{ fontFamily: F, fontSize: 13, color: C.t3, marginBottom: 12 }}>Got bonus, freelance pay, or extra cash?</p>
              <Btn onClick={() => setShowAddIncome(true)}>Add Income</Btn>
            </div>
          )}
        </Accordion>

        {/* Income Categories */}
        <Accordion icon="category" title="Income Categories" accent={C.g1}>
          <ListManager items={incomeCats} setItems={saveIncomeCats} accent={C.g1} nameLabel="Category name" />
        </Accordion>

        {/* Expense Categories */}
        <Accordion icon="category" title="Expense Categories" accent={C.au}>
          <ListManager items={expCats} setItems={saveExpCats} accent={C.au} nameLabel="Category name" />
        </Accordion>

        {/* Expense Vendors */}
        <Accordion icon="storefront" title="Manage Vendors" accent={C.au}>
          <p style={{ fontFamily: F, fontSize: 12, color: C.t3, marginBottom: 12 }}>Quick-select vendors when adding expenses</p>
          <ListManager items={vendors} setItems={saveVendorsFn} accent={C.au} nameLabel="Vendor name" />
        </Accordion>

        {/* Liabilities */}
        <Accordion icon="balance" title="Manage Liabilities" accent={C.red}>
          {liabilities.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1, padding: "10px 14px", borderRadius: 12, background: `${C.red}08` }}>
                <p style={{ fontFamily: F, fontSize: 10, color: C.t3, fontWeight: 500 }}>Total Debt</p>
                <p style={{ fontFamily: F, fontSize: 18, color: C.red, fontWeight: 700 }}>₹{totalDebt.toLocaleString("en-IN")}</p>
              </div>
              <div style={{ flex: 1, padding: "10px 14px", borderRadius: 12, background: `${C.au}08` }}>
                <p style={{ fontFamily: F, fontSize: 10, color: C.t3, fontWeight: 500 }}>Monthly EMI</p>
                <p style={{ fontFamily: F, fontSize: 18, color: C.au, fontWeight: 700 }}>₹{totalEmi.toLocaleString("en-IN")}</p>
              </div>
            </div>
          )}
          {liabilities.map(l => {
            const at = ACCT_TYPES.find(t => t.id === l.type) || ACCT_TYPES[1];
            return (
              <div key={l.id} style={{ padding: 14, borderRadius: 14, background: `${C.red}04`, border: `1px solid ${C.red}10`, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontFamily: F, fontSize: 14, color: C.tx, fontWeight: 600 }}>{l.name}</p>
                    <p style={{ fontFamily: F, fontSize: 11, color: C.t3 }}>{l.lender} · {at.label}</p>
                  </div>
                  <button onClick={() => handleRemoveLiability(l.id)} style={{ background: "none", border: "none", cursor: "pointer" }}><Ic n="close" s={16} c={C.t3} /></button>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                  <div><p style={{ fontFamily: F, fontSize: 10, color: C.t3 }}>Outstanding</p><p style={{ fontFamily: F, fontSize: 14, color: C.red, fontWeight: 700 }}>₹{(Number(l.outstanding) || 0).toLocaleString("en-IN")}</p></div>
                  <div><p style={{ fontFamily: F, fontSize: 10, color: C.t3 }}>EMI</p><p style={{ fontFamily: F, fontSize: 14, color: C.au, fontWeight: 700 }}>₹{(Number(l.emi) || 0).toLocaleString("en-IN")}</p></div>
                  <div><p style={{ fontFamily: F, fontSize: 10, color: C.t3 }}>Fixed Exp</p><p style={{ fontFamily: F, fontSize: 14, color: l.inFixed ? C.g1 : C.t3, fontWeight: 600 }}>{l.inFixed ? "Yes" : "No"}</p></div>
                </div>
              </div>
            );
          })}
          {showAddLiab ? (
            <div style={{ marginTop: 8, padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.4)", border: "1px solid rgba(0,0,0,0.06)", animation: "fadeUp 0.2s ease-out" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {ACCT_TYPES.filter(a => a.id !== "cash" && a.id !== "wallet").map(at => (
                  <div key={at.id} onClick={() => setNewLiab({...newLiab, type: at.id})} style={{ padding: "6px 12px", borderRadius: 10, cursor: "pointer", border: newLiab.type === at.id ? `2px solid ${C.red}` : "1px solid rgba(0,0,0,0.06)", background: newLiab.type === at.id ? `${C.red}08` : "transparent" }}>
                    <span style={{ fontFamily: F, fontSize: 11, color: newLiab.type === at.id ? C.red : C.t3, fontWeight: 500 }}>{at.label}</span>
                  </div>
                ))}
              </div>
              <Inp label="Loan Name" value={newLiab.name} onChange={v => setNewLiab({...newLiab, name: v})} placeholder="Personal Loan" />
              <Inp label="Lender" value={newLiab.lender} onChange={v => setNewLiab({...newLiab, lender: v})} placeholder="ICICI Bank" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Inp label="Outstanding" value={newLiab.outstanding} onChange={v => setNewLiab({...newLiab, outstanding: v})} prefix="₹" type="number" placeholder="1500000" />
                <Inp label="Monthly EMI" value={newLiab.emi} onChange={v => setNewLiab({...newLiab, emi: v})} prefix="₹" type="number" placeholder="45000" />
              </div>
              <div onClick={() => setNewLiab({...newLiab, inFixed: !newLiab.inFixed})} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, cursor: "pointer", marginBottom: 14, border: newLiab.inFixed ? `2px solid ${C.g1}` : "1px solid rgba(0,0,0,0.06)", background: newLiab.inFixed ? `${C.g1}08` : "transparent" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, border: newLiab.inFixed ? `2px solid ${C.g1}` : "2px solid rgba(0,0,0,0.15)", background: newLiab.inFixed ? C.g1 : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {newLiab.inFixed && <Ic n="check" s={12} c="#fff" />}
                </div>
                <span style={{ fontFamily: F, fontSize: 12, color: newLiab.inFixed ? C.g1 : C.t3, fontWeight: 500 }}>Include EMI in fixed expenses</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={handleAddLiability} style={{ flex: 1, background: "linear-gradient(135deg, #E53E3E, #C53030)" }}>Add Liability</Btn>
                <Btn sec onClick={() => setShowAddLiab(false)} style={{ flex: 0, width: 80 }}>Cancel</Btn>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddLiab(true)} style={{ width: "100%", marginTop: 4, padding: "10px", borderRadius: 12, border: `1.5px dashed ${C.red}40`, background: `${C.red}06`, fontFamily: F, fontSize: 12, fontWeight: 600, color: C.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Ic n="add" s={16} c={C.red} /> Add Liability
            </button>
          )}
        </Accordion>

        {/* ── LOGOUT ── */}
        <Btn sec onClick={onLogout} style={{ color: C.red, borderColor: `${C.red}20`, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Ic n="logout" s={18} c={C.red} /> Logout
        </Btn>

        <p style={{ fontFamily: F, fontSize: 11, color: C.t3, textAlign: "center", marginTop: 20, marginBottom: 8 }}>All data stored under {email}</p>
        <p style={{ fontFamily: F, fontSize: 10, color: C.t3, textAlign: "center" }}>SavPot v1.0</p>
      </div>
    </div>
  );
};


// ═══════════════════════════════════
// ─── REPORTS SCREEN ───
// ═══════════════════════════════════

const MiniBar = ({ value, max, color, h = 6 }) => (
  <div style={{ height: h, background: "rgba(0,0,0,0.04)", borderRadius: h / 2, overflow: "hidden", flex: 1 }}>
    <div style={{ height: "100%", width: `${max > 0 ? Math.min((value / max) * 100, 100) : 0}%`, background: color, borderRadius: h / 2, transition: "width 0.4s" }} />
  </div>
);

const ReportsScreen = ({ config }) => {
  const { user } = useAuth();
  const [monthOffset, setMonthOffset] = useState(0);
  const [catDetail, setCatDetail] = useState(null);
  const [showAllTxn, setShowAllTxn] = useState(false);
  const [showSavpotDetail, setShowSavpotDetail] = useState(false);
  const [showSummaryBreakdown, setShowSummaryBreakdown] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Real Firestore data
  const [txns, setTxns] = useState([]);
  const [daily, setDaily] = useState([]);
  const [savpotLedger, setSavpotLedger] = useState([]);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthName = viewDate.toLocaleString("en-IN", { month: "long", year: "numeric" });
  const isCurrentMonth = monthOffset === 0;
  const dIM = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const today = isCurrentMonth ? now.getDate() : dIM;

  useEffect(() => {
    if (!user) return;
    setReportsLoading(true);
    const yr = viewDate.getFullYear();
    const mo = viewDate.getMonth();
    Promise.all([
      getExpensesByMonth(user.uid, yr, mo),
      getDailySnapshots(user.uid, yr, mo),
      getSavPotByMonth(user.uid, yr, mo),
    ]).then(([expenses, snapshots, savpot]) => {
      setTxns(expenses.map(e => ({
        ...e,
        day: e.day ?? (e.dateTime?.toDate ? e.dateTime.toDate().getDate() : 1),
      })));
      setDaily(snapshots.map(s => ({
        day: Number(s.date?.split("-")[2] ?? s.day ?? 1),
        budget: s.dailyBudget,
        spent: s.spent,
        saved: s.savedToPot,
        over: s.overspent,
      })));
      setSavpotLedger(savpot.map(e => ({
        ...e,
        day: e.day ?? (e.dateTime?.toDate ? e.dateTime.toDate().getDate() : 1),
      })));
    }).catch(console.error)
      .finally(() => setReportsLoading(false));
  }, [user, monthOffset]);

  const activeDays = isCurrentMonth ? today : dIM;

  // Fallback: synthesize daily snapshots from transactions if none stored yet
  const effectiveDaily = daily.length > 0 ? daily : txns.length > 0 ? Object.entries(
    txns.reduce((acc, t) => ({ ...acc, [t.day]: (acc[t.day] || 0) + t.amount }), {})
  ).map(([d, spent]) => ({
    day: +d, budget: config?.daily || 0, spent,
    saved: Math.max(0, (config?.daily || 0) - spent),
    over: Math.max(0, spent - (config?.daily || 0)),
  })) : [];

  // 3.1 Monthly Summary
  const totalIncome = config?.income || 0;
  const totalMandatory = config?.mandatory || 0;
  const totalInvestments = config?.investments || 0;
  const approvedBalance = totalIncome - totalMandatory - totalInvestments;

  // 3.2 Spending
  const totalSpent = txns.reduce((s, t) => s + t.amount, 0);
  const catTotals = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: txns.filter(t => t.category === cat.id).reduce((s, t) => s + t.amount, 0),
    count: txns.filter(t => t.category === cat.id).length,
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  const maxCat = catTotals.length > 0 ? catTotals[0].total : 1;

  // 3.3 SavPot
  const totalSaved = savpotLedger.filter(e => e.type === "ADD_LEFTOVER").reduce((s, e) => s + e.amount, 0);
  const totalUnlocked = savpotLedger.filter(e => e.type === "UNLOCK_WITHDRAW").reduce((s, e) => s + e.amount, 0);
  const netSavpot = totalSaved - totalUnlocked;

  // 3.4 Discipline
  const avgPerDay = activeDays > 0 ? Math.round(totalSpent / activeDays) : 0;
  const daysUnder = effectiveDaily.filter(d => d.spent <= d.budget).length;
  const daysOver = effectiveDaily.filter(d => d.spent > d.budget).length;

  // 3.5 Runway
  const runway = [];
  let cumSpent = 0;
  for (let i = 0; i < effectiveDaily.length; i++) {
    cumSpent += effectiveDaily[i].spent;
    const elapsed = i + 1;
    const avgSoFar = cumSpent / elapsed;
    const remaining = approvedBalance - cumSpent;
    const runDays = avgSoFar > 0 ? Math.round(remaining / avgSoFar) : dIM - elapsed;
    runway.push({ day: effectiveDaily[i].day, value: Math.max(0, runDays) });
  }
  const maxRunway = Math.max(...runway.map(r => r.value), 1);
  const currentRunway = runway.length > 0 ? runway[runway.length - 1].value : 0;

  // Daily chart
  const maxDaySpend = Math.max(...effectiveDaily.map(d => d.spent), config?.daily || 1);

  const dailyBudget = config?.daily || 0;

  // ── SUB-SCREENS ──
  if (catDetail) {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === catDetail);
    const catTxns = txns.filter(t => t.category === catDetail).sort((a, b) => b.day - a.day);
    const catTotal = catTxns.reduce((s, t) => s + t.amount, 0);
    return (
      <div style={{ minHeight: "100dvh", background: C.bg, padding: "24px 20px 100px", position: "relative", overflow: "hidden" }}>
        <Blob t="-60px" l="50%" sz={350} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 400, margin: "0 auto" }}>
          <button onClick={() => setCatDetail(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 13, color: C.t2, fontWeight: 500, marginBottom: 16, padding: 0 }}>
            <Ic n="arrow_back" s={18} c={C.t2} /> Back to Reports
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: `${cat?.color || C.g1}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic n={cat?.icon || "category"} s={26} c={cat?.color || C.g1} f />
            </div>
            <div>
              <h2 style={{ fontFamily: F, fontSize: 20, color: C.tx, fontWeight: 700 }}>{cat?.label || "Category"}</h2>
              <p style={{ fontFamily: F, fontSize: 13, color: C.t3 }}>{catTxns.length} transactions · ₹{catTotal.toLocaleString("en-IN")}</p>
            </div>
          </div>
          {catTxns.map(t => (
            <Glass key={t.id} style={{ padding: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: F, fontSize: 13, color: C.tx, fontWeight: 600 }}>{t.vendor}</p>
                <p style={{ fontFamily: F, fontSize: 11, color: C.t3 }}>Day {t.day} · {t.payMethod}</p>
              </div>
              <span style={{ fontFamily: F, fontSize: 15, color: C.red, fontWeight: 700 }}>-₹{t.amount.toLocaleString("en-IN")}</span>
            </Glass>
          ))}
        </div>
      </div>
    );
  }

  if (showAllTxn) {
    const sorted = [...txns].sort((a, b) => b.day - a.day || b.amount - a.amount);
    return (
      <div style={{ minHeight: "100dvh", background: C.bg, padding: "24px 20px 100px", position: "relative", overflow: "hidden" }}>
        <Blob t="-60px" l="30%" sz={350} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 400, margin: "0 auto" }}>
          <button onClick={() => setShowAllTxn(false)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 13, color: C.t2, fontWeight: 500, marginBottom: 16, padding: 0 }}>
            <Ic n="arrow_back" s={18} c={C.t2} /> Back to Reports
          </button>
          <h2 style={{ fontFamily: F, fontSize: 20, color: C.tx, fontWeight: 700, marginBottom: 4 }}>All Transactions</h2>
          <p style={{ fontFamily: F, fontSize: 13, color: C.t3, marginBottom: 20 }}>{monthName} · {sorted.length} transactions</p>
          {sorted.map(t => {
            const cat = EXPENSE_CATEGORIES.find(c => c.id === t.category);
            return (
              <Glass key={t.id} style={{ padding: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${cat?.color || "#999"}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Ic n={cat?.icon || "receipt"} s={18} c={cat?.color || C.t3} f />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: F, fontSize: 13, color: C.tx, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.vendor}</p>
                  <p style={{ fontFamily: F, fontSize: 11, color: C.t3 }}>Day {t.day} · {cat?.label} · {t.payMethod}</p>
                </div>
                <span style={{ fontFamily: F, fontSize: 14, color: C.red, fontWeight: 700, flexShrink: 0 }}>-₹{t.amount.toLocaleString("en-IN")}</span>
              </Glass>
            );
          })}
        </div>
      </div>
    );
  }

  if (showSavpotDetail) {
    const adds = savpotLedger.filter(e => e.type === "ADD_LEFTOVER").sort((a, b) => a.day - b.day);
    const unlocks = savpotLedger.filter(e => e.type === "UNLOCK_WITHDRAW").sort((a, b) => a.day - b.day);
    return (
      <div style={{ minHeight: "100dvh", background: C.bg, padding: "24px 20px 100px", position: "relative", overflow: "hidden" }}>
        <Blob t="-60px" l="60%" sz={350} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 400, margin: "0 auto" }}>
          <button onClick={() => setShowSavpotDetail(false)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 13, color: C.t2, fontWeight: 500, marginBottom: 16, padding: 0 }}>
            <Ic n="arrow_back" s={18} c={C.t2} /> Back to Reports
          </button>
          <h2 style={{ fontFamily: F, fontSize: 20, color: C.tx, fontWeight: 700, marginBottom: 20 }}>SavPot Ledger</h2>

          <Section icon="arrow_downward" title={`Daily Savings (${adds.length} days)`} accent={C.g1}>
            {adds.length === 0 ? <p style={{ fontFamily: F, fontSize: 13, color: C.t3, padding: "8px 0" }}>No savings yet</p> : adds.map(e => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <span style={{ fontFamily: F, fontSize: 13, color: C.t2 }}>Day {e.day}</span>
                <span style={{ fontFamily: F, fontSize: 14, color: C.g1, fontWeight: 700 }}>+₹{e.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </Section>

          <Section icon="arrow_upward" title={`Unlocked (${unlocks.length})`} accent={C.au}>
            {unlocks.length === 0 ? <p style={{ fontFamily: F, fontSize: 13, color: C.t3, padding: "8px 0" }}>No unlocks this month</p> : unlocks.map(e => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <span style={{ fontFamily: F, fontSize: 13, color: C.t2 }}>Day {e.day}</span>
                <span style={{ fontFamily: F, fontSize: 14, color: C.au, fontWeight: 700 }}>-₹{e.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </Section>
        </div>
      </div>
    );
  }

  // ── MAIN REPORTS VIEW ──
  return (
    <div style={{ minHeight: "100dvh", background: C.bg, padding: "24px 20px 100px", position: "relative", overflow: "hidden" }}>
      <Blob t="-80px" l="60%" sz={400} />
      <Blob t="50%" l="-20%" sz={300} c="rgba(197,150,27,0.05)" />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 400, margin: "0 auto", paddingTop: 8 }}>

        {/* Month Selector */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <button onClick={() => setMonthOffset(monthOffset - 1)} style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(0,0,0,0.04)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Ic n="chevron_left" s={22} c={C.t2} />
          </button>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontFamily: F, fontSize: 20, color: C.tx, fontWeight: 700 }}>{monthName}</h2>
            <p style={{ fontFamily: F, fontSize: 11, color: C.t3 }}>{isCurrentMonth ? `Day ${today} of ${dIM}` : `${dIM} days`}</p>
          </div>
          <button onClick={() => { if (monthOffset < 0) setMonthOffset(monthOffset + 1); }} style={{ width: 38, height: 38, borderRadius: 12, background: monthOffset < 0 ? "rgba(0,0,0,0.04)" : "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: monthOffset < 0 ? "pointer" : "default", opacity: monthOffset < 0 ? 1 : 0.3 }}>
            <Ic n="chevron_right" s={22} c={C.t2} />
          </button>
        </div>

        {/* ─── 1. MONTHLY SUMMARY ─── */}
        <Glass grad style={{ marginBottom: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Ic n="summarize" s={18} c={C.g1} />
              <p style={{ fontFamily: F, fontSize: 12, color: C.g1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Month Summary</p>
            </div>
            <button onClick={() => setShowSummaryBreakdown(!showSummaryBreakdown)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 11, color: C.g1, fontWeight: 600 }}>
              {showSummaryBreakdown ? "Hide" : "Breakdown"} <Ic n={showSummaryBreakdown ? "expand_less" : "expand_more"} s={16} c={C.g1} />
            </button>
          </div>

          {[
            { label: "Income", val: totalIncome, clr: C.g1, ic: "arrow_downward" },
            { label: "Mandatory Expenses", val: totalMandatory, clr: C.red, ic: "arrow_upward" },
            { label: "Savings & Investments", val: totalInvestments, clr: C.au, ic: "trending_up" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Ic n={r.ic} s={15} c={r.clr} />
                <span style={{ fontFamily: F, fontSize: 13, color: C.t2 }}>{r.label}</span>
              </div>
              <span style={{ fontFamily: F, fontSize: 14, color: r.clr, fontWeight: 700 }}>₹{r.val.toLocaleString("en-IN")}</span>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 4px", marginTop: 4 }}>
            <span style={{ fontFamily: F, fontSize: 14, color: C.tx, fontWeight: 600 }}>Approved Balance</span>
            <span style={{ fontFamily: F, fontSize: 22, fontWeight: 700, background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>₹{approvedBalance.toLocaleString("en-IN")}</span>
          </div>
          <p style={{ fontFamily: F, fontSize: 10, color: C.t3, marginTop: 2 }}>= Income − Mandatory − Savings</p>

          {showSummaryBreakdown && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.06)", animation: "fadeUp 0.25s ease-out" }}>
              <p style={{ fontFamily: F, fontSize: 11, color: C.t3, fontWeight: 500, marginBottom: 6 }}>Income includes all sources from setup. Mandatory includes rent, EMIs, bills. Savings includes SIPs, stocks, FDs.</p>
            </div>
          )}
        </Glass>

        {/* ─── 2. SPENDING ─── */}
        <Glass onClick={() => setShowAllTxn(true)} style={{ marginBottom: 14, padding: 20, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Ic n="shopping_bag" s={18} c={C.red} />
              <p style={{ fontFamily: F, fontSize: 12, color: C.red, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Spending</p>
            </div>
            <Ic n="chevron_right" s={20} c={C.t3} />
          </div>
          <p style={{ fontFamily: F, fontSize: 32, color: C.tx, fontWeight: 700, marginTop: 8 }}>₹{totalSpent.toLocaleString("en-IN")}</p>
          <p style={{ fontFamily: F, fontSize: 11, color: C.t3, marginTop: 2 }}>Across {txns.length} transactions</p>
          <div style={{ marginTop: 10, height: 6, background: "rgba(0,0,0,0.04)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${approvedBalance > 0 ? Math.min((totalSpent / approvedBalance) * 100, 100) : 0}%`, background: totalSpent > approvedBalance ? "linear-gradient(90deg,#E8C84A,#E53E3E)" : C.grad, borderRadius: 3 }} />
          </div>
          <p style={{ fontFamily: F, fontSize: 10, color: C.t3, marginTop: 4 }}>{approvedBalance > 0 ? Math.round((totalSpent / approvedBalance) * 100) : 0}% of approved balance used</p>
        </Glass>

        {/* ─── 3. CATEGORIES ─── */}
        <Glass style={{ marginBottom: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Ic n="donut_small" s={18} c={C.au} />
            <p style={{ fontFamily: F, fontSize: 12, color: C.au, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Categories</p>
          </div>

          {catTotals.length === 0 ? (
            <p style={{ fontFamily: F, fontSize: 13, color: C.t3, textAlign: "center", padding: 16 }}>No expenses yet.</p>
          ) : (
            <>
              {/* Stacked bar */}
              <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", marginBottom: 16 }}>
                {catTotals.map(cat => (
                  <div key={cat.id} style={{ width: `${totalSpent > 0 ? (cat.total / totalSpent) * 100 : 0}%`, background: cat.color, transition: "width 0.4s" }} title={`${cat.label}: ₹${cat.total.toLocaleString("en-IN")}`} />
                ))}
              </div>

              {catTotals.map(cat => (
                <div key={cat.id} onClick={() => setCatDetail(cat.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", cursor: "pointer" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Ic n={cat.icon} s={18} c={cat.color} f />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: F, fontSize: 13, color: C.tx, fontWeight: 500 }}>{cat.label} <span style={{ color: C.t3, fontWeight: 400 }}>({cat.count})</span></span>
                      <span style={{ fontFamily: F, fontSize: 13, color: C.tx, fontWeight: 700 }}>₹{cat.total.toLocaleString("en-IN")}</span>
                    </div>
                    <MiniBar value={cat.total} max={maxCat} color={cat.color} />
                  </div>
                  <Ic n="chevron_right" s={16} c={C.t3} st={{ flexShrink: 0 }} />
                </div>
              ))}
            </>
          )}
        </Glass>

        {/* ─── 4. SAVPOT ─── */}
        <Glass grad onClick={() => setShowSavpotDetail(true)} style={{ marginBottom: 14, padding: 20, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Ic n="savings" s={18} c={C.g1} f />
              <p style={{ fontFamily: F, fontSize: 12, color: C.g1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>SavPot</p>
            </div>
            <Ic n="chevron_right" s={20} c={C.t3} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div>
              <p style={{ fontFamily: F, fontSize: 10, color: C.t3, marginBottom: 2 }}>Saved</p>
              <p style={{ fontFamily: F, fontSize: 18, color: C.g1, fontWeight: 700 }}>₹{totalSaved.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p style={{ fontFamily: F, fontSize: 10, color: C.t3, marginBottom: 2 }}>Unlocked</p>
              <p style={{ fontFamily: F, fontSize: 18, color: C.au, fontWeight: 700 }}>₹{totalUnlocked.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p style={{ fontFamily: F, fontSize: 10, color: C.t3, marginBottom: 2 }}>Net</p>
              <p style={{ fontFamily: F, fontSize: 18, color: netSavpot >= 0 ? C.g1 : C.red, fontWeight: 700 }}>₹{netSavpot.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </Glass>

        {/* ─── 5. DAILY DISCIPLINE ─── */}
        <Glass style={{ marginBottom: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Ic n="military_tech" s={18} c={C.au} />
            <p style={{ fontFamily: F, fontSize: 12, color: C.au, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Daily Discipline</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            <div style={{ padding: "10px 8px", borderRadius: 12, background: "rgba(0,0,0,0.02)", textAlign: "center" }}>
              <p style={{ fontFamily: F, fontSize: 10, color: C.t3, marginBottom: 2 }}>Avg/Day</p>
              <p style={{ fontFamily: F, fontSize: 18, color: C.tx, fontWeight: 700 }}>₹{avgPerDay.toLocaleString("en-IN")}</p>
            </div>
            <div style={{ padding: "10px 8px", borderRadius: 12, background: `${C.g1}06`, textAlign: "center" }}>
              <p style={{ fontFamily: F, fontSize: 10, color: C.t3, marginBottom: 2 }}>Under Budget</p>
              <p style={{ fontFamily: F, fontSize: 18, color: C.g1, fontWeight: 700 }}>{daysUnder} days</p>
            </div>
            <div style={{ padding: "10px 8px", borderRadius: 12, background: `${C.red}06`, textAlign: "center" }}>
              <p style={{ fontFamily: F, fontSize: 10, color: C.t3, marginBottom: 2 }}>Over Budget</p>
              <p style={{ fontFamily: F, fontSize: 18, color: C.red, fontWeight: 700 }}>{daysOver} days</p>
            </div>
          </div>

          {/* Under vs Over bar */}
          <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden" }}>
            <div style={{ width: `${activeDays > 0 ? (daysUnder / activeDays) * 100 : 0}%`, background: C.grad, transition: "width 0.4s" }} />
            <div style={{ width: `${activeDays > 0 ? (daysOver / activeDays) * 100 : 0}%`, background: "linear-gradient(90deg,#E8C84A,#E53E3E)", transition: "width 0.4s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontFamily: F, fontSize: 10, color: C.g1, fontWeight: 500 }}>{activeDays > 0 ? Math.round((daysUnder / activeDays) * 100) : 0}% disciplined</span>
            <span style={{ fontFamily: F, fontSize: 10, color: C.red, fontWeight: 500 }}>{activeDays > 0 ? Math.round((daysOver / activeDays) * 100) : 0}% over</span>
          </div>

          {/* Daily spending chart */}
          <div style={{ marginTop: 16 }}>
            <p style={{ fontFamily: F, fontSize: 11, color: C.t3, fontWeight: 500, marginBottom: 8 }}>Daily Spending</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80 }}>
              {effectiveDaily.map(d => {
                const h = d.spent > 0 ? Math.max((d.spent / maxDaySpend) * 100, 4) : 0;
                const over = d.spent > dailyBudget;
                return (
                  <div key={d.day} style={{ flex: 1, height: `${h}%`, borderRadius: "2px 2px 0 0", background: over ? "linear-gradient(to top,#E8C84A,#E53E3E)" : C.grad, opacity: d.spent > 0 ? 0.7 : 0.08, minHeight: d.spent > 0 ? 3 : 1, transition: "height 0.3s" }} title={`Day ${d.day}: ₹${d.spent}`} />
                );
              })}
            </div>
            {/* Budget line label */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontFamily: F, fontSize: 9, color: C.t3 }}>Day 1</span>
              <span style={{ fontFamily: F, fontSize: 9, color: C.t3 }}>Budget: ₹{dailyBudget.toLocaleString("en-IN")}/d</span>
              <span style={{ fontFamily: F, fontSize: 9, color: C.t3 }}>Day {effectiveDaily.length}</span>
            </div>
          </div>
        </Glass>

        {/* ─── 6. RUNWAY TREND ─── */}
        <Glass style={{ marginBottom: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Ic n="speed" s={18} c={C.g1} />
            <p style={{ fontFamily: F, fontSize: 12, color: C.g1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Runway Trend</p>
          </div>
          <p style={{ fontFamily: F, fontSize: 11, color: C.t3, marginBottom: 14 }}>Days your money can last at current pace</p>

          {runway.length < 3 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Ic n="hourglass_empty" s={28} c={C.t3} st={{ display: "block", margin: "0 auto 8px" }} />
              <p style={{ fontFamily: F, fontSize: 13, color: C.t3 }}>Not enough data yet. Check back in a few days.</p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, background: `${C.g1}08`, marginBottom: 14 }}>
                <Ic n="today" s={18} c={C.g1} f />
                <span style={{ fontFamily: F, fontSize: 13, color: C.g1, fontWeight: 600 }}>Today's runway: ~{currentRunway} days</span>
              </div>

              {/* SVG Line Chart */}
              <div style={{ position: "relative" }}>
                <svg viewBox={`0 0 ${runway.length * 12} 70`} style={{ width: "100%", height: 70 }}>
                  <defs>
                    <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={C.g1} />
                      <stop offset="100%" stopColor={C.au} />
                    </linearGradient>
                    <linearGradient id="rf" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={C.g1} stopOpacity="0.15" />
                      <stop offset="100%" stopColor={C.g1} stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <path d={
                    runway.map((r, i) => {
                      const x = i * 12 + 6;
                      const y = 65 - (maxRunway > 0 ? (r.value / maxRunway) * 58 : 0);
                      return `${i === 0 ? "M" : "L"}${x},${y}`;
                    }).join(" ") + ` L${(runway.length - 1) * 12 + 6},65 L6,65 Z`
                  } fill="url(#rf)" />
                  {/* Line */}
                  <polyline
                    points={runway.map((r, i) => `${i * 12 + 6},${65 - (maxRunway > 0 ? (r.value / maxRunway) * 58 : 0)}`).join(" ")}
                    fill="none" stroke="url(#rg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                  {/* End dot */}
                  <circle cx={(runway.length - 1) * 12 + 6} cy={65 - (maxRunway > 0 ? (runway[runway.length - 1].value / maxRunway) * 58 : 0)} r="3" fill={C.g1} />
                </svg>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontFamily: F, fontSize: 9, color: C.t3 }}>Day 1</span>
                <span style={{ fontFamily: F, fontSize: 9, color: C.t3 }}>Day {runway.length}</span>
              </div>
            </>
          )}
        </Glass>

      </div>
    </div>
  );
};


// ═══════════════════════════════════
// ─── SAVPOT SCREEN ───
// ═══════════════════════════════════
const SavPotScreen = ({ config }) => {
  const now = new Date();
  const dIM = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const today = now.getDate();
  const daysLeft = dIM - today;
  const dailyBudget = config?.daily || 1000;

  // ── Auth + Firestore state ──
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockEnd, setLockEnd] = useState(null);
  const [lockDaysLeft, setLockDaysLeft] = useState(0);
  const [savpotLoading, setSavpotLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setSavpotLoading(true);
    Promise.all([
      getSavPotState(user.uid),
      getSavPotByMonth(user.uid, now.getFullYear(), now.getMonth()),
    ]).then(([state, entries]) => {
      setBalance(state?.balance ?? 0);
      setIsLocked(state?.isLocked ?? false);
      const end = state?.lockEnd?.toDate ? state.lockEnd.toDate() : null;
      setLockEnd(end);
      if (end) {
        const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
        setLockDaysLeft(daysLeft);
      }
      const mapped = entries.map(e => ({
        ...e,
        day: e.day ?? (e.dateTime?.toDate ? e.dateTime.toDate().getDate() : today),
        date: e.dateTime?.toDate ? e.dateTime.toDate() : new Date(),
      })).sort((a, b) => b.day - a.day);
      setLedger(mapped);
    }).catch(console.error)
      .finally(() => setSavpotLoading(false));
  }, [user]);

  const [view, setView] = useState("main"); // main | unlock | lock | history | monthend
  const [unlockAmt, setUnlockAmt] = useState("");
  const [lockDays, setLockDays] = useState(7);
  const [breakStep, setBreakStep] = useState(0); // 0=none, 1=confirm, 2=reason
  const [breakReason, setBreakReason] = useState("");
  const [ledgerFilter, setLedgerFilter] = useState("all");
  const [monthEndChoice, setMonthEndChoice] = useState("keep");
  const [monthEndSource, setMonthEndSource] = useState("cash");
  const [toast, setToast] = useState("");

  const savedThisMonth = ledger.filter(e => e.type === "ADD_LEFTOVER").reduce((s, e) => s + e.amount, 0);
  // Handle both "UNLOCK_TO_DAILY" (UI) and "UNLOCK_WITHDRAW" (Firestore) type strings
  const unlockedThisMonth = ledger.filter(e => e.type === "UNLOCK_TO_DAILY" || e.type === "UNLOCK_WITHDRAW").reduce((s, e) => s + e.amount, 0);

  // Survival preview
  const unlockNum = Number(unlockAmt) || 0;
  const totalSpentEst = dailyBudget * today * 0.7;
  const avgSpendRate = today > 0 ? Math.round(totalSpentEst / today) : dailyBudget;
  const remainingBalance = dailyBudget * daysLeft;
  const newDailyBudget = daysLeft > 0 ? Math.round((remainingBalance + unlockNum) / daysLeft) : 0;
  const surviveDays = avgSpendRate > 0 ? Math.floor((remainingBalance + unlockNum) / avgSpendRate) : daysLeft;
  const surviveDate = new Date(now.getTime() + surviveDays * 86400000);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const doLock = async () => {
    const end = new Date(now.getTime() + lockDays * 86400000);
    try {
      await updateSavPotState(user.uid, { balance, isLocked: true, lockEnd: end, lockDays });
      await addSavPotEntry(user.uid, { type: "LOCK_SET", amount: 0, day: today });
      setIsLocked(true);
      setLockEnd(end);
      setLockDaysLeft(lockDays);
      setLedger(prev => [{ id: `lock-${Date.now()}`, day: today, type: "LOCK_SET", amount: 0, date: now, meta: { lockDays } }, ...prev]);
    } catch (err) { console.error("Lock failed:", err); }
    setView("main");
    showToast(`SavPot locked for ${lockDays} days`);
  };

  const doBreakLock = async () => {
    try {
      await updateSavPotState(user.uid, { isLocked: false, lockEnd: null, lockDays: 0 });
      await addSavPotEntry(user.uid, { type: "LOCK_BROKEN", amount: 0, day: today, meta: { reason: breakReason } });
      setIsLocked(false);
      setLockEnd(null);
      setLockDaysLeft(0);
      setBreakStep(0);
      setLedger(prev => [{ id: `break-${Date.now()}`, day: today, type: "LOCK_BROKEN", amount: 0, date: now, meta: { reason: breakReason } }, ...prev]);
    } catch (err) { console.error("Break lock failed:", err); }
    showToast("Lock broken. SavPot is unlocked.");
    setBreakReason("");
  };

  const doUnlock = async () => {
    if (unlockNum <= 0 || unlockNum > balance) return;
    if (isLocked) { showToast(`SavPot locked until ${lockEnd?.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`); return; }
    const newBalance = balance - unlockNum;
    try {
      await updateSavPotState(user.uid, { balance: newBalance });
      await addSavPotEntry(user.uid, { type: "UNLOCK_WITHDRAW", amount: unlockNum, day: today });
      setBalance(newBalance);
      setLedger(prev => [{ id: `unlock-${Date.now()}`, day: today, type: "UNLOCK_TO_DAILY", amount: unlockNum, date: now }, ...prev]);
    } catch (err) { console.error("Unlock failed:", err); }
    setUnlockAmt("");
    setView("main");
    showToast(`₹${unlockNum.toLocaleString("en-IN")} moved to daily budget`);
  };

  const doMonthEnd = async () => {
    const type = monthEndChoice === "keep" ? "MONTH_END_KEEP" : monthEndChoice === "next" ? "MONTH_END_TO_NEXT_MONTH_BUDGET" : "MONTH_END_TO_INCOME_SOURCE";
    const newBalance = monthEndChoice === "keep" ? balance : 0;
    try {
      await updateSavPotState(user.uid, { balance: newBalance });
      await addSavPotEntry(user.uid, { type, amount: balance, day: today, meta: { source: monthEndSource } });
      setLedger(prev => [{ id: `me-${Date.now()}`, day: today, type, amount: balance, date: now, meta: { source: monthEndSource } }, ...prev]);
      if (monthEndChoice !== "keep") setBalance(0);
    } catch (err) { console.error("Month end failed:", err); }
    setView("main");
    showToast(monthEndChoice === "keep" ? "SavPot balance carried forward" : "Funds transferred successfully");
  };

  const isUnlockType = (type) => type === "UNLOCK_TO_DAILY" || type === "UNLOCK_WITHDRAW";

  const filteredLedger = ledgerFilter === "all" ? ledger :
    ledgerFilter === "added" ? ledger.filter(e => e.type === "ADD_LEFTOVER") :
    ledgerFilter === "unlocked" ? ledger.filter(e => isUnlockType(e.type)) :
    ledger.filter(e => e.type.includes("LOCK"));

  const ledgerIcon = (type) => {
    if (type === "ADD_LEFTOVER") return { ic: "arrow_downward", clr: C.g1, prefix: "+" };
    if (isUnlockType(type)) return { ic: "arrow_upward", clr: C.au, prefix: "-" };
    if (type === "LOCK_SET") return { ic: "lock", clr: C.t2, prefix: "" };
    if (type === "LOCK_BROKEN") return { ic: "lock_open", clr: C.red, prefix: "" };
    if (type === "LOCK_AUTO_EXPIRED") return { ic: "lock_clock", clr: C.t3, prefix: "" };
    if (type.includes("MONTH_END")) return { ic: "event", clr: C.au, prefix: "" };
    return { ic: "receipt", clr: C.t3, prefix: "" };
  };

  const ledgerLabel = (type) => {
    if (type === "ADD_LEFTOVER") return "Daily leftover saved";
    if (isUnlockType(type)) return "Unlocked to daily budget";
    if (type === "LOCK_SET") return "SavPot locked";
    if (type === "LOCK_BROKEN") return "Lock broken";
    if (type === "LOCK_AUTO_EXPIRED") return "Lock expired";
    if (type === "MONTH_END_KEEP") return "Month-end: Kept in SavPot";
    if (type === "MONTH_END_TO_NEXT_MONTH_BUDGET") return "Month-end: Moved to next month";
    if (type === "MONTH_END_TO_INCOME_SOURCE") return "Month-end: Moved to account";
    return type;
  };

  // ── HISTORY VIEW ──
  if (view === "history") {
    return (
      <div style={{ minHeight: "100dvh", background: C.bg, padding: "24px 20px 100px", position: "relative", overflow: "hidden" }}>
        <Blob t="-60px" l="50%" sz={350} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 400, margin: "0 auto" }}>
          <button onClick={() => setView("main")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 13, color: C.t2, fontWeight: 500, marginBottom: 16, padding: 0 }}>
            <Ic n="arrow_back" s={18} c={C.t2} /> Back
          </button>
          <h2 style={{ fontFamily: F, fontSize: 20, color: C.tx, fontWeight: 700, marginBottom: 6 }}>SavPot History</h2>
          <p style={{ fontFamily: F, fontSize: 12, color: C.t3, marginBottom: 16 }}>{filteredLedger.length} entries</p>

          <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
            {[{ id: "all", label: "All" }, { id: "added", label: "Saved" }, { id: "unlocked", label: "Unlocked" }, { id: "locks", label: "Locks" }].map(f => (
              <div key={f.id} onClick={() => setLedgerFilter(f.id)} style={{ padding: "6px 14px", borderRadius: 10, cursor: "pointer", border: ledgerFilter === f.id ? `2px solid ${C.g1}` : "1px solid rgba(0,0,0,0.06)", background: ledgerFilter === f.id ? C.gp : "transparent", fontFamily: F, fontSize: 11, fontWeight: 500, color: ledgerFilter === f.id ? C.g1 : C.t3 }}>
                {f.label}
              </div>
            ))}
          </div>

          {filteredLedger.length === 0 ? (
            <Glass style={{ textAlign: "center", padding: 32 }}>
              <Ic n="hourglass_empty" s={32} c={C.t3} st={{ display: "block", margin: "0 auto 8px" }} />
              <p style={{ fontFamily: F, fontSize: 13, color: C.t3 }}>No entries found</p>
            </Glass>
          ) : filteredLedger.map(e => {
            const li = ledgerIcon(e.type);
            return (
              <Glass key={e.id} style={{ padding: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${li.clr}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Ic n={li.ic} s={18} c={li.clr} f />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: F, fontSize: 13, color: C.tx, fontWeight: 500 }}>{ledgerLabel(e.type)}</p>
                  <p style={{ fontFamily: F, fontSize: 11, color: C.t3 }}>Day {e.day}{e.meta?.lockDays ? ` · ${e.meta.lockDays} days` : ""}{e.meta?.reason ? ` · ${e.meta.reason}` : ""}</p>
                </div>
                {e.amount > 0 && <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: li.clr, flexShrink: 0 }}>{li.prefix}₹{e.amount.toLocaleString("en-IN")}</span>}
              </Glass>
            );
          })}
        </div>
      </div>
    );
  }

  // ── UNLOCK VIEW ──
  if (view === "unlock") {
    return (
      <div style={{ minHeight: "100dvh", background: C.bg, padding: "24px 20px 100px", position: "relative", overflow: "hidden" }}>
        <Blob t="-60px" l="30%" sz={400} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 400, margin: "0 auto" }}>
          <button onClick={() => { setView("main"); setUnlockAmt(""); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 13, color: C.t2, fontWeight: 500, marginBottom: 16, padding: 0 }}>
            <Ic n="arrow_back" s={18} c={C.t2} /> Back
          </button>
          <h2 style={{ fontFamily: F, fontSize: 20, color: C.tx, fontWeight: 700, marginBottom: 4 }}>Move to Daily Budget</h2>
          <p style={{ fontFamily: F, fontSize: 13, color: C.t3, marginBottom: 20 }}>Available: ₹{balance.toLocaleString("en-IN")}</p>

          <Glass grad style={{ padding: 24, marginBottom: 16 }}>
            <Inp label="Unlock Amount" value={unlockAmt} onChange={v => { if (v === "" || Number(v) <= balance) setUnlockAmt(v); }} prefix="₹" type="number" placeholder="500" autoFocus />

            {/* Slider */}
            <div style={{ marginBottom: 16 }}>
              <input type="range" min={0} max={balance} value={unlockNum} onChange={e => setUnlockAmt(e.target.value)} style={{ width: "100%", accentColor: C.g1, height: 6 }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: F, fontSize: 10, color: C.t3 }}>₹0</span>
                <span style={{ fontFamily: F, fontSize: 10, color: C.t3 }}>₹{balance.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {unlockNum > balance && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, background: `${C.red}08`, border: `1px solid ${C.red}15`, marginBottom: 12 }}>
                <Ic n="warning" s={18} c={C.red} />
                <p style={{ fontFamily: F, fontSize: 12, color: C.red, fontWeight: 500 }}>Cannot exceed SavPot balance</p>
              </div>
            )}
          </Glass>

          {/* SURVIVAL PREVIEW */}
          {unlockNum > 0 && unlockNum <= balance && (
            <Glass style={{ padding: 20, marginBottom: 16, border: `1px solid ${C.g1}20`, animation: "fadeUp 0.3s ease-out" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Ic n="preview" s={18} c={C.g1} />
                <p style={{ fontFamily: F, fontSize: 12, color: C.g1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Survival Preview</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ padding: "12px", borderRadius: 14, background: `${C.g1}06` }}>
                  <p style={{ fontFamily: F, fontSize: 10, color: C.t3, marginBottom: 2 }}>New Daily Budget</p>
                  <p style={{ fontFamily: F, fontSize: 22, color: C.g1, fontWeight: 700 }}>₹{newDailyBudget.toLocaleString("en-IN")}</p>
                  <p style={{ fontFamily: F, fontSize: 10, color: C.t3 }}>per day · {daysLeft}d left</p>
                </div>
                <div style={{ padding: "12px", borderRadius: 14, background: `${C.au}06` }}>
                  <p style={{ fontFamily: F, fontSize: 10, color: C.t3, marginBottom: 2 }}>Can Survive</p>
                  <p style={{ fontFamily: F, fontSize: 22, color: C.au, fontWeight: 700 }}>~{surviveDays} days</p>
                  <p style={{ fontFamily: F, fontSize: 10, color: C.t3 }}>Until {surviveDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                </div>
              </div>

              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: F, fontSize: 12, color: C.t2 }}>SavPot after unlock</span>
                  <span style={{ fontFamily: F, fontSize: 13, color: C.tx, fontWeight: 700 }}>₹{(balance - unlockNum).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </Glass>
          )}

          <Btn onClick={doUnlock} disabled={unlockNum <= 0 || unlockNum > balance}>
            Move ₹{unlockNum > 0 ? unlockNum.toLocaleString("en-IN") : "0"}
          </Btn>
        </div>
      </div>
    );
  }

  // ── LOCK VIEW ──
  if (view === "lock") {
    return (
      <div style={{ minHeight: "100dvh", background: C.bg, padding: "24px 20px 100px", position: "relative", overflow: "hidden" }}>
        <Blob t="-60px" l="60%" sz={350} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 400, margin: "0 auto" }}>
          <button onClick={() => setView("main")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 13, color: C.t2, fontWeight: 500, marginBottom: 16, padding: 0 }}>
            <Ic n="arrow_back" s={18} c={C.t2} /> Back
          </button>
          <h2 style={{ fontFamily: F, fontSize: 20, color: C.tx, fontWeight: 700, marginBottom: 4 }}>Lock SavPot</h2>
          <p style={{ fontFamily: F, fontSize: 13, color: C.t3, marginBottom: 24 }}>Prevent yourself from unlocking for a set period</p>

          <Glass grad style={{ padding: 24, marginBottom: 16 }}>
            <p style={{ fontFamily: F, fontSize: 12, color: C.t3, fontWeight: 500, marginBottom: 12 }}>Lock for</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>
              {[1, 3, 7, 14, 30].map(d => (
                <div key={d} onClick={() => setLockDays(d)} style={{
                  padding: "14px 4px", borderRadius: 14, textAlign: "center", cursor: "pointer", transition: "all 0.2s",
                  border: lockDays === d ? `2px solid ${C.g1}` : "1px solid rgba(0,0,0,0.06)",
                  background: lockDays === d ? C.gp : "rgba(255,255,255,0.4)",
                }}>
                  <p style={{ fontFamily: F, fontSize: 18, color: lockDays === d ? C.g1 : C.tx, fontWeight: 700 }}>{d}</p>
                  <p style={{ fontFamily: F, fontSize: 9, color: lockDays === d ? C.g1 : C.t3 }}>day{d > 1 ? "s" : ""}</p>
                </div>
              ))}
            </div>

            <div style={{ padding: "14px", borderRadius: 14, background: `${C.g1}06`, border: `1px solid ${C.g1}15` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Ic n="lock" s={20} c={C.g1} f />
                <div>
                  <p style={{ fontFamily: F, fontSize: 13, color: C.g1, fontWeight: 600 }}>Locked until {new Date(now.getTime() + lockDays * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  <p style={{ fontFamily: F, fontSize: 11, color: C.t3 }}>You won't be able to unlock without breaking the lock</p>
                </div>
              </div>
            </div>
          </Glass>

          <Btn onClick={doLock}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Ic n="lock" s={18} c="#fff" /> Lock for {lockDays} day{lockDays > 1 ? "s" : ""}
            </span>
          </Btn>
        </div>
      </div>
    );
  }

  // ── MONTH END VIEW ──
  if (view === "monthend") {
    return (
      <div style={{ minHeight: "100dvh", background: C.bg, padding: "24px 20px 100px", position: "relative", overflow: "hidden" }}>
        <Blob t="-60px" l="40%" sz={400} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 400, margin: "0 auto" }}>
          <button onClick={() => setView("main")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 13, color: C.t2, fontWeight: 500, marginBottom: 16, padding: 0 }}>
            <Ic n="arrow_back" s={18} c={C.t2} /> Back
          </button>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 6px 24px rgba(27,140,90,0.2)" }}>
              <Ic n="savings" s={32} c="#fff" f />
            </div>
            <h2 style={{ fontFamily: F, fontSize: 20, color: C.tx, fontWeight: 700 }}>Month Complete!</h2>
            <p style={{ fontFamily: F, fontSize: 13, color: C.t3, marginTop: 4 }}>What should we do with your SavPot?</p>
            <p style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: C.g1, marginTop: 8 }}>₹{balance.toLocaleString("en-IN")}</p>
          </div>

          <Glass grad style={{ padding: 24 }}>
            {[
              { id: "keep", label: "Keep in SavPot", desc: "Balance carries forward to next month", icon: "savings", clr: C.g1 },
              { id: "next", label: "Move to next month budget", desc: "Auto-split into daily budget", icon: "calendar_month", clr: C.au },
              { id: "source", label: "Move to account", desc: "Transfer to Cash, Bank, or Card", icon: "account_balance", clr: C.t2 },
            ].map(opt => (
              <div key={opt.id} onClick={() => setMonthEndChoice(opt.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, marginBottom: 8, cursor: "pointer", transition: "all 0.2s",
                border: monthEndChoice === opt.id ? `2px solid ${opt.clr}` : "1px solid rgba(0,0,0,0.06)",
                background: monthEndChoice === opt.id ? `${opt.clr}06` : "transparent",
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: `${opt.clr}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Ic n={opt.icon} s={22} c={opt.clr} f={monthEndChoice === opt.id} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: F, fontSize: 14, color: monthEndChoice === opt.id ? opt.clr : C.tx, fontWeight: 600 }}>{opt.label}</p>
                  <p style={{ fontFamily: F, fontSize: 11, color: C.t3 }}>{opt.desc}</p>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: monthEndChoice === opt.id ? `2px solid ${opt.clr}` : "2px solid rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {monthEndChoice === opt.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: opt.clr }} />}
                </div>
              </div>
            ))}

            {monthEndChoice === "source" && (
              <div style={{ marginTop: 8, animation: "fadeUp 0.2s ease-out" }}>
                <p style={{ fontFamily: F, fontSize: 12, color: C.t3, fontWeight: 500, marginBottom: 8 }}>Transfer to</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ id: "cash", label: "Cash", icon: "payments" }, { id: "bank", label: "Bank", icon: "account_balance" }, { id: "credit", label: "Card", icon: "credit_card" }].map(s => (
                    <div key={s.id} onClick={() => setMonthEndSource(s.id)} style={{
                      flex: 1, padding: "12px 8px", borderRadius: 14, textAlign: "center", cursor: "pointer",
                      border: monthEndSource === s.id ? `2px solid ${C.g1}` : "1px solid rgba(0,0,0,0.06)",
                      background: monthEndSource === s.id ? C.gp : "rgba(255,255,255,0.4)",
                    }}>
                      <Ic n={s.icon} s={20} c={monthEndSource === s.id ? C.g1 : C.t3} f={monthEndSource === s.id} st={{ display: "block", margin: "0 auto 4px" }} />
                      <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: monthEndSource === s.id ? C.g1 : C.t3 }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Glass>

          <Btn onClick={doMonthEnd} style={{ marginTop: 16 }}>Confirm</Btn>
        </div>
      </div>
    );
  }

  // ── MAIN VIEW ──
  return (
    <div style={{ minHeight: "100dvh", background: C.bg, padding: "24px 20px 100px", position: "relative", overflow: "hidden" }}>
      <Blob t="-80px" l="40%" sz={450} />
      <Blob t="50%" l="-20%" sz={300} c="rgba(197,150,27,0.05)" />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 40, left: "50%", transform: "translateX(-50%)", padding: "12px 24px", borderRadius: 14, background: C.tx, color: "#fff", fontFamily: F, fontSize: 13, fontWeight: 500, zIndex: 200, boxShadow: "0 6px 20px rgba(0,0,0,0.2)", animation: "fadeUp 0.3s ease-out" }}>
          {toast}
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 400, margin: "0 auto", paddingTop: 8 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(27,140,90,0.2)" }}>
            <Ic n="savings" s={24} c="#fff" f />
          </div>
          <div>
            <h1 style={{ fontFamily: F, fontSize: 22, color: C.tx, fontWeight: 700 }}>SavPot</h1>
            <p style={{ fontFamily: F, fontSize: 12, color: C.t3 }}>Your discipline savings</p>
          </div>
        </div>

        {/* ── Balance Card ── */}
        <div style={{ borderRadius: 24, padding: 24, marginBottom: 16, position: "relative", overflow: "hidden", background: C.grad, boxShadow: "0 8px 40px rgba(27,140,90,0.2)" }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ fontFamily: F, fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>SavPot Balance</p>
            <p style={{ fontFamily: F, fontSize: 42, color: "#fff", fontWeight: 700, letterSpacing: "-1px" }}>₹{balance.toLocaleString("en-IN")}</p>
            <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
              <div>
                <p style={{ fontFamily: F, fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Saved this month</p>
                <p style={{ fontFamily: F, fontSize: 16, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>+₹{savedThisMonth.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p style={{ fontFamily: F, fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Unlocked</p>
                <p style={{ fontFamily: F, fontSize: 16, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>-₹{unlockedThisMonth.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <Btn onClick={() => { if (isLocked) { showToast(`Locked until ${lockEnd?.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`); } else if (balance <= 0) { showToast("No balance to unlock"); } else { setView("unlock"); } }} disabled={balance <= 0}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Ic n="swap_horiz" s={16} c="#fff" /> Move to Budget</span>
          </Btn>
          <Btn sec onClick={() => setView("history")}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Ic n="history" s={16} c={C.t2} /> History</span>
          </Btn>
        </div>

        <Btn sec onClick={() => setView("monthend")} style={{ marginBottom: 16, border: `1px solid ${C.au}25`, color: C.au }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Ic n="event" s={16} c={C.au} /> Month-End Decision</span>
        </Btn>

        {/* ── Lock Card ── */}
        <Glass style={{ marginBottom: 16, padding: 20, border: isLocked ? `1.5px solid ${C.g1}30` : "1px solid rgba(255,255,255,0.72)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Ic n={isLocked ? "lock" : "lock_open"} s={18} c={isLocked ? C.g1 : C.t3} f={isLocked} />
            <p style={{ fontFamily: F, fontSize: 12, color: isLocked ? C.g1 : C.t3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {isLocked ? "Locked" : "Unlocked"}
            </p>
          </div>

          {isLocked ? (
            <>
              <p style={{ fontFamily: F, fontSize: 14, color: C.tx, fontWeight: 500, marginBottom: 4 }}>
                Locked until {lockEnd?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              <p style={{ fontFamily: F, fontSize: 12, color: C.t3, marginBottom: 16 }}>{lockDaysLeft} day{lockDaysLeft !== 1 ? "s" : ""} remaining</p>

              {breakStep === 0 && (
                <button onClick={() => setBreakStep(1)} style={{
                  width: "100%", padding: "14px 24px", borderRadius: 14, border: `2px solid ${C.red}`,
                  background: `${C.red}08`, fontFamily: F, fontSize: 14, fontWeight: 700,
                  color: C.red, cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <Ic n="lock_open" s={18} c={C.red} /> BREAK LOCK
                </button>
              )}

              {breakStep === 1 && (
                <div style={{ animation: "fadeUp 0.25s ease-out" }}>
                  <div style={{ padding: 14, borderRadius: 14, background: `${C.red}06`, border: `1px solid ${C.red}15`, marginBottom: 12 }}>
                    <p style={{ fontFamily: F, fontSize: 13, color: C.red, fontWeight: 600, marginBottom: 4 }}>Are you sure?</p>
                    <p style={{ fontFamily: F, fontSize: 12, color: C.t2 }}>Breaking the lock removes your discipline barrier. This is logged.</p>
                  </div>
                  <p style={{ fontFamily: F, fontSize: 12, color: C.t3, fontWeight: 500, marginBottom: 8 }}>Reason (optional)</p>
                  <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                    {["Emergency", "Unplanned Expense", "Other"].map(r => (
                      <div key={r} onClick={() => setBreakReason(r)} style={{
                        padding: "6px 14px", borderRadius: 10, cursor: "pointer",
                        border: breakReason === r ? `2px solid ${C.red}` : "1px solid rgba(0,0,0,0.06)",
                        background: breakReason === r ? `${C.red}08` : "transparent",
                        fontFamily: F, fontSize: 11, fontWeight: 500, color: breakReason === r ? C.red : C.t3,
                      }}>{r}</div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={doBreakLock} style={{
                      flex: 1, padding: "14px", borderRadius: 14, border: "none",
                      background: "linear-gradient(135deg, #E53E3E, #C53030)", color: "#fff",
                      fontFamily: F, fontSize: 14, fontWeight: 700, cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(229,62,62,0.3)",
                    }}>
                      Confirm Break
                    </button>
                    <Btn sec onClick={() => { setBreakStep(0); setBreakReason(""); }} style={{ flex: 0, width: 80 }}>Cancel</Btn>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <p style={{ fontFamily: F, fontSize: 13, color: C.t3, marginBottom: 14 }}>SavPot is unlocked. Lock it to build discipline.</p>
              <Btn onClick={() => setView("lock")} style={{ background: `${C.g1}12`, color: C.g1, boxShadow: "none" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Ic n="lock" s={16} c={C.g1} /> Lock SavPot</span>
              </Btn>
            </>
          )}
        </Glass>

        {/* ── Empty state ── */}
        {balance === 0 && (
          <Glass style={{ textAlign: "center", padding: 28 }}>
            <Ic n="savings" s={36} c={C.t3} st={{ display: "block", margin: "0 auto 8px" }} />
            <p style={{ fontFamily: F, fontSize: 14, color: C.t3 }}>Save leftover daily budget to build your SavPot.</p>
            <p style={{ fontFamily: F, fontSize: 12, color: C.t3, marginTop: 4 }}>Unspent money flows here every night.</p>
          </Glass>
        )}

        {/* ── Recent Activity ── */}
        {ledger.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Ic n="history" s={16} c={C.t2} />
                <p style={{ fontFamily: F, fontSize: 12, color: C.t2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent</p>
              </div>
              <button onClick={() => setView("history")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 11, color: C.g1, fontWeight: 600 }}>View All</button>
            </div>
            {ledger.slice(0, 5).map(e => {
              const li = ledgerIcon(e.type);
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${li.clr}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Ic n={li.ic} s={16} c={li.clr} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: F, fontSize: 12, color: C.tx, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ledgerLabel(e.type)}</p>
                    <p style={{ fontFamily: F, fontSize: 10, color: C.t3 }}>Day {e.day}</p>
                  </div>
                  {e.amount > 0 && <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: li.clr, flexShrink: 0 }}>{li.prefix}₹{e.amount.toLocaleString("en-IN")}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// ─── MAIN APP ───
// ═══════════════════════════════════
export default function SavPotApp() {
  const { user, config, loading, refreshConfig } = useAuth();
  const splashSeen = localStorage.getItem("splashSeen");
  const [screen, setScreen] = useState(splashSeen ? "loading" : "splash");
  const [tab, setTab] = useState("home");

  // Drive screen navigation from Firebase auth state
  // Never interrupt the splash screen — wait for it to call onDone
  useEffect(() => {
    if (screen === "splash") return;
    if (loading) return;
    if (!user) { setScreen("signup"); return; }
    if (!config) { setScreen("setup"); return; }
    setScreen("app");
  }, [user, config, loading, screen]);

  const handleSplashDone = () => {
    localStorage.setItem("splashSeen", "1");
    if (loading) { setScreen("loading"); return; }
    if (!user) { setScreen("signup"); return; }
    if (!config) { setScreen("setup"); return; }
    setScreen("app");
  };

  const handleLogout = async () => {
    await logOut();
    setTab("home");
    // useEffect above routes to "signup" once user becomes null
  };

  return (
    <div style={{ maxWidth: 430, margin: "0 auto" }}>
      <FontLoader />
      <CSS />
      {screen === "splash" && <SplashScreen onDone={handleSplashDone} />}
      {screen === "loading" && <div style={{ minHeight: "100dvh" }} />}
      {screen === "signup" && <SignupScreen onDone={() => {}} />}
      {screen === "setup" && (
        <SetupWizard
          onDone={async (cfg) => {
            await saveSetupConfig(user.uid, cfg);
            await refreshConfig();
            setScreen("done");
          }}
        />
      )}
      {screen === "done" && (
        <DoneScreen
          config={config}
          onGo={async () => { await refreshConfig(); setScreen("app"); setTab("home"); }}
        />
      )}
      {screen === "app" && config && (
        <>
          {tab === "home"    && <HomeScreen config={config} onNav={setTab} />}
          {tab === "savpot"  && <SavPotScreen config={config} />}
          {tab === "reports" && <ReportsScreen config={config} />}
          {tab === "profile" && <ProfileScreen config={config} onLogout={handleLogout} />}
          <BottomNav active={tab} onNav={setTab} />
        </>
      )}
    </div>
  );
}
