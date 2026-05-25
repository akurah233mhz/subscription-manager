import { useState } from "react";
import { ov, mod, settingRow, smallBtn, toggle, toggleThumb } from "../styles.jsx";
import { PinInput } from "./PinModal.jsx";

export function AdminPanel({ t, verifyPin, setPin, onClose }) {
  const [step, setStep] = useState("menu");
  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [errA, setErrA] = useState(false);
  const [errB, setErrB] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dark, setDarkLocal] = useState(localStorage.getItem("theme") === "dark");

  function pinKeyStep(key, input, setInput, setErr, onFull) {
    if (input.length >= 4) return;
    const next = input + key;
    setInput(next);
    setErr(false);
    if (next.length === 4) setTimeout(() => onFull(next), 150);
  }

  return (
    <div style={ov()} onClick={onClose}>
      <div style={{ ...mod(t), maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 20 }}>⚙️ 管理設定</div>

        {step === "menu" && (
          <>
            <div style={settingRow(t)}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>テーマ</div>
                <div style={{ fontSize: 12, color: t.textSub }}>ダーク / ライト</div>
              </div>
              <div
                style={toggle(t, dark)}
                onClick={() => {
                  const next = !dark;
                  setDarkLocal(next);
                  localStorage.setItem("theme", next ? "dark" : "light");
                  window.dispatchEvent(new Event("themechange"));
                }}
              >
                <div style={toggleThumb(dark)} />
              </div>
            </div>
            <div style={settingRow(t)}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>管理PIN変更</div>
                <div style={{ fontSize: 12, color: t.textSub }}>現在のPIN確認 → 新PIN入力</div>
              </div>
              <button
                style={{ ...smallBtn(t), borderColor: t.accent, color: t.accent }}
                onClick={() => {
                  setStep("changePin1");
                  setInputA("");
                  setErrA(false);
                }}
              >
                変更
              </button>
            </div>
            <div style={{ marginTop: 8, padding: "10px 12px", background: t.surfaceAlt, borderRadius: 8, fontSize: 12, color: t.textSub }}>
              管理PINは管理設定を開く際に必要です。家族には教えないでください。
            </div>
          </>
        )}

        {step === "changePin1" && (
          <PinInput
            label="現在のPINを入力"
            input={inputA}
            err={errA}
            t={t}
            onKey={(k) =>
              pinKeyStep(k, inputA, setInputA, setErrA, async (v) => {
                const ok = await verifyPin(v);
                if (ok) {
                  setStep("changePin2");
                  setInputB("");
                  setErrB(false);
                } else {
                  setErrA(true);
                  setInputA("");
                }
              })
            }
            onDel={() => setInputA((p) => p.slice(0, -1))}
          />
        )}

        {step === "changePin2" && !done && (
          <PinInput
            label="新しいPINを入力"
            input={inputB}
            err={errB}
            t={t}
            onKey={(k) =>
              pinKeyStep(k, inputB, setInputB, setErrB, async (v) => {
                if (saving) return;
                setSaving(true);
                try {
                  await setPin(v);
                  setDone(true);
                } catch (e) {
                  setErrB(true);
                  setInputB("");
                  alert(`保存に失敗: ${e.message}`);
                } finally {
                  setSaving(false);
                }
              })
            }
            onDel={() => setInputB((p) => p.slice(0, -1))}
          />
        )}

        {done && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ color: t.text, fontWeight: 700 }}>PINを変更しました</div>
          </div>
        )}

        <button
          style={{
            marginTop: 16,
            background: "transparent",
            border: "none",
            color: t.textSub,
            cursor: "pointer",
            fontSize: 13,
            display: "block",
            marginLeft: "auto",
          }}
          onClick={onClose}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
