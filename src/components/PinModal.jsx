import { useState } from "react";
import { ov, mod, pinKey } from "../styles.jsx";

export function PinModal({ t, verifyPin, onSuccess, onClose, title = "管理者PINを入力" }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleKey(k) {
    if (busy || input.length >= 4) return;
    const next = input + k;
    setInput(next);
    setError(false);
    if (next.length === 4) {
      setBusy(true);
      setTimeout(async () => {
        const ok = await verifyPin(next);
        if (ok) {
          onSuccess();
        } else {
          setError(true);
          setInput("");
        }
        setBusy(false);
      }, 150);
    }
  }

  function handleDel() {
    setInput((p) => p.slice(0, -1));
    setError(false);
  }

  return (
    <div style={ov()} onClick={onClose}>
      <div style={{ ...mod(t), maxWidth: 320, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 12, color: t.textSub, marginBottom: 24 }}>4桁のPINを入力してください</div>
        <PinDots input={input} error={error} t={t} />
        {error && <div style={{ color: t.urgent, fontSize: 13, marginBottom: 12 }}>PINが違います</div>}
        <PinKeypad t={t} onKey={handleKey} onDel={handleDel} />
        <button
          style={{ marginTop: 12, background: "transparent", border: "none", color: t.textSub, cursor: "pointer", fontSize: 13 }}
          onClick={onClose}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

export function PinDots({ input, error, t }) {
  return (
    <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 24 }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: i < input.length ? t.accent : "transparent",
            border: `2px solid ${error ? t.urgent : i < input.length ? t.accent : t.borderMid}`,
            transition: "all 0.12s",
          }}
        />
      ))}
    </div>
  );
}

export function PinKeypad({ t, onKey, onDel }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 8 }}>
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
        <button key={k} style={pinKey(t)} onClick={() => onKey(k)}>
          {k}
        </button>
      ))}
      <div />
      <button style={pinKey(t)} onClick={() => onKey("0")}>
        0
      </button>
      <button style={{ ...pinKey(t), color: t.textSub, fontSize: 18 }} onClick={onDel}>
        ⌫
      </button>
    </div>
  );
}

export function PinInput({ label, input, err, t, onKey, onDel }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 16 }}>{label}</div>
      <PinDots input={input} error={err} t={t} />
      {err && <div style={{ color: t.urgent, fontSize: 13, marginBottom: 10 }}>PINが違います</div>}
      <PinKeypad t={t} onKey={onKey} onDel={onDel} />
    </div>
  );
}
