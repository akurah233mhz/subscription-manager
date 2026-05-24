export function inpStyle(t) {
  return {
    display: "block",
    width: "100%",
    background: t.surfaceAlt,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: "9px 11px",
    color: t.text,
    fontSize: 14,
    marginBottom: 12,
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
  };
}

export function ov() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 16,
  };
}

export function mod(t) {
  return {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 520,
    maxHeight: "90vh",
    overflowY: "auto",
  };
}

export function iconBtn(t) {
  return {
    background: t.surfaceAlt,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 16,
    cursor: "pointer",
    color: t.text,
  };
}

export function pinKey(t) {
  return {
    background: t.surfaceAlt,
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    padding: "14px 0",
    fontSize: 20,
    fontWeight: 600,
    color: t.text,
    cursor: "pointer",
  };
}

export function settingRow(t) {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: `1px solid ${t.border}`,
  };
}

export function smallBtn(t) {
  return {
    background: "transparent",
    border: `1px solid ${t.border}`,
    borderRadius: 7,
    padding: "6px 14px",
    fontSize: 13,
    cursor: "pointer",
  };
}

export function toggle(t, on) {
  return {
    width: 44,
    height: 24,
    borderRadius: 12,
    background: on ? t.accent : t.borderMid,
    position: "relative",
    cursor: "pointer",
    transition: "background 0.2s",
    flexShrink: 0,
  };
}

export function toggleThumb(on) {
  return {
    position: "absolute",
    top: 3,
    left: on ? 22 : 3,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#fff",
    transition: "left 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  };
}

export function Lbl({ t, children }) {
  return (
    <div style={{ fontSize: 11, color: t.textSub, marginBottom: 3, fontWeight: 600, letterSpacing: 0.5 }}>
      {children}
    </div>
  );
}

export function Inp({ t, ...props }) {
  return <input style={inpStyle(t)} {...props} />;
}

export function Sel({ t, children, ...props }) {
  return (
    <select style={inpStyle(t)} {...props}>
      {children}
    </select>
  );
}
