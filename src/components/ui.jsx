// ═══════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════
export const C = {
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

export const F = "'Poppins', sans-serif";

// ═══════════════════════════════════
// ICON
// ═══════════════════════════════════
export const Ic = ({ n, s = 20, c = C.t2, f, st }) => (
  <span
    className={`mi${f ? " mi-f" : ""}`}
    style={{ fontSize: s, color: c, ...st }}
  >
    {n}
  </span>
);

// ═══════════════════════════════════
// GLASS CARD
// ═══════════════════════════════════
export const Glass = ({ children, grad, style, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: grad
        ? "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.45))"
        : C.card,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${C.bdr}`,
      borderRadius: 20,
      padding: 20,
      ...style,
    }}
  >
    {children}
  </div>
);

// ═══════════════════════════════════
// BUTTON
// ═══════════════════════════════════
export const Btn = ({ children, sec, onClick, disabled, style }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: "100%",
      padding: "16px 24px",
      borderRadius: 16,
      border: sec ? "1px solid rgba(0,0,0,0.08)" : "none",
      background: sec ? "rgba(255,255,255,0.5)" : disabled ? "#ccc" : C.grad,
      color: sec ? C.t2 : "#fff",
      fontFamily: F,
      fontSize: 15,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: sec || disabled ? "none" : "0 4px 20px rgba(27,140,90,0.25)",
      transition: "all 0.2s",
      ...style,
    }}
  >
    {children}
  </button>
);

// ═══════════════════════════════════
// INPUT
// ═══════════════════════════════════
export const Inp = ({
  label,
  value,
  onChange,
  prefix,
  type = "text",
  placeholder,
  autoFocus,
}) => (
  <div style={{ marginBottom: 16 }}>
    {label && (
      <label
        style={{
          fontFamily: F,
          fontSize: 12,
          color: C.t3,
          display: "block",
          marginBottom: 6,
          fontWeight: 500,
        }}
      >
        {label}
      </label>
    )}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 14,
        background: "rgba(255,255,255,0.6)",
        overflow: "hidden",
        transition: "border 0.2s",
      }}
    >
      {prefix && (
        <span
          style={{
            fontFamily: F,
            fontSize: 16,
            color: C.t3,
            fontWeight: 600,
            paddingLeft: 16,
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
          flex: 1,
          padding: prefix ? "14px 16px 14px 8px" : "14px 16px",
          border: "none",
          background: "transparent",
          fontFamily: F,
          fontSize: 15,
          fontWeight: 500,
          color: C.tx,
          outline: "none",
        }}
      />
    </div>
  </div>
);

// ═══════════════════════════════════
// DECORATIVE BLOB
// ═══════════════════════════════════
export const Blob = ({ t, l, sz = 350, c = "rgba(27,140,90,0.04)" }) => (
  <div
    style={{
      position: "absolute",
      top: t,
      left: l,
      width: sz,
      height: sz,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${c} 0%, transparent 70%)`,
      pointerEvents: "none",
      zIndex: 0,
    }}
  />
);

// ═══════════════════════════════════
// SECTION CARD WITH HEADER
// ═══════════════════════════════════
export const Section = ({ icon, title, children, accent = C.t2 }) => (
  <Glass style={{ marginBottom: 14, padding: 20 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 14,
      }}
    >
      <Ic n={icon} s={18} c={accent} />
      <p
        style={{
          fontFamily: F,
          fontSize: 12,
          color: accent,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {title}
      </p>
    </div>
    {children}
  </Glass>
);

// ═══════════════════════════════════
// ACCORDION
// ═══════════════════════════════════
import { useState } from "react";

export const Accordion = ({
  icon,
  title,
  accent = C.g1,
  children,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Glass style={{ marginBottom: 10, padding: 0, overflow: "hidden" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "16px 20px",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: `${accent}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Ic n={icon} s={18} c={accent} f />
        </div>
        <span
          style={{
            flex: 1,
            fontFamily: F,
            fontSize: 14,
            color: C.tx,
            fontWeight: 600,
          }}
        >
          {title}
        </span>
        <Ic n={open ? "expand_less" : "expand_more"} s={22} c={C.t3} />
      </div>
      {open && (
        <div
          style={{
            padding: "0 20px 20px",
            animation: "fadeUp 0.2s ease-out",
          }}
        >
          <div
            style={{
              height: 1,
              background: "rgba(0,0,0,0.05)",
              marginBottom: 16,
            }}
          />
          {children}
        </div>
      )}
    </Glass>
  );
};

// ═══════════════════════════════════
// TOAST
// ═══════════════════════════════════
export const Toast = ({ message }) =>
  message ? (
    <div
      style={{
        position: "fixed",
        top: 40,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "12px 24px",
        borderRadius: 14,
        background: C.tx,
        color: "#fff",
        fontFamily: F,
        fontSize: 13,
        fontWeight: 500,
        zIndex: 200,
        boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
        animation: "fadeUp 0.3s ease-out",
      }}
    >
      {message}
    </div>
  ) : null;

// ═══════════════════════════════════
// BOTTOM NAV
// ═══════════════════════════════════
export const BottomNav = ({ active, onNav }) => {
  const tabs = [
    { id: "home", icon: "home", label: "Home" },
    { id: "savpot", icon: "savings", label: "SavPot" },
    { id: "reports", icon: "bar_chart", label: "Reports" },
    { id: "profile", icon: "person", label: "Profile" },
  ];
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 430,
        background: "rgba(245,244,240,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.04)",
        display: "flex",
        justifyContent: "space-around",
        padding: "8px 0 26px",
        zIndex: 100,
      }}
    >
      {tabs.map((t) => (
        <div
          key={t.id}
          onClick={() => onNav(t.id)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
            position: "relative",
            padding: "4px 16px",
          }}
        >
          {active === t.id && (
            <div
              style={{
                position: "absolute",
                top: -8,
                width: 24,
                height: 3,
                borderRadius: 2,
                background: C.grad,
              }}
            />
          )}
          <Ic
            n={t.icon}
            s={24}
            c={active === t.id ? C.g1 : C.t3}
            f={active === t.id}
          />
          <span
            style={{
              fontSize: 10,
              fontFamily: F,
              fontWeight: active === t.id ? 600 : 400,
              marginTop: 2,
              color: active === t.id ? C.g1 : C.t3,
            }}
          >
            {t.label}
          </span>
        </div>
      ))}
    </div>
  );
};
