import { useState, useMemo, useEffect } from "react";
import { makeTheme } from "./theme.js";
import { daysUntil, formatDate, toMonthly, toMonthlyJpy, effectiveAmountJpy, formatAmount, formatJpy } from "./utils.js";
import { useSubscriptions } from "./hooks/useSubscriptions.js";
import { useSettings } from "./hooks/useSettings.js";
import { useMeta } from "./hooks/useMeta.js";
import { PinModal } from "./components/PinModal.jsx";
import { AdminPanel } from "./components/AdminPanel.jsx";
import { ov, mod, iconBtn, inpStyle, Lbl, Inp, Sel } from "./styles.jsx";

const FALLBACK_CATEGORIES = ["エンタメ", "音楽", "仕事・制作", "クラウド", "ゲーム", "保険", "ショッピング", "その他"];
const CURRENCIES = ["JPY", "USD", "EUR", "GBP"];

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function emptyForm(category) {
  return {
    name: "",
    category,
    plan: "",
    amount: "",
    currency: "JPY",
    amountJpy: "",
    cycle: "monthly",
    renewalDate: "",
    url: "",
    cancelUrl: "",
    cancelMethod: "",
    notes: "",
  };
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const t = makeTheme(darkMode);

  useEffect(() => {
    const h = () => setDarkMode(localStorage.getItem("theme") === "dark");
    window.addEventListener("themechange", h);
    return () => window.removeEventListener("themechange", h);
  }, []);

  const { items: subs, loading, error, create, update, remove } = useSubscriptions();
  const { verifyPin, setPin, loading: settingsLoading } = useSettings();
  const { categories: notionCategories, loading: metaLoading, error: metaError } = useMeta();

  const [filter, setFilter] = useState("すべて");
  const [sort, setSort] = useState("renewal");
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => emptyForm(FALLBACK_CATEGORIES[0]));
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [pinTarget, setPinTarget] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminPin, setShowAdminPin] = useState(false);

  const subscriptionCategories = useMemo(() => uniq(subs.map((s) => s.category)), [subs]);
  const formCategories = useMemo(() => {
    const fromNotion = notionCategories.length ? notionCategories : FALLBACK_CATEGORIES;
    return uniq([...fromNotion, ...subscriptionCategories]);
  }, [notionCategories, subscriptionCategories]);
  const categories = useMemo(() => ["すべて", ...formCategories], [formCategories]);
  const defaultCategory = formCategories[0] || FALLBACK_CATEGORIES[0];

  useEffect(() => {
    if (filter !== "すべて" && !categories.includes(filter)) setFilter("すべて");
  }, [categories, filter]);

  const filtered = useMemo(() => {
    let list = subs.filter((s) => s.active);
    if (filter !== "すべて") list = list.filter((s) => s.category === filter);
    if (searchText) list = list.filter((s) => s.name.toLowerCase().includes(searchText.toLowerCase()));
    if (sort === "renewal") list = [...list].sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
    if (sort === "amount") list = [...list].sort((a, b) => toMonthlyJpy(b) - toMonthlyJpy(a));
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "ja"));
    return list;
  }, [subs, filter, sort, searchText]);

  const totalMonthly = useMemo(
    () => subs.filter((s) => s.active).reduce((s, x) => s + toMonthlyJpy(x), 0),
    [subs],
  );

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm(defaultCategory));
    setShowForm(true);
  }

  function openEdit(sub) {
    setEditingId(sub.id);
    setForm({
      name: sub.name,
      category: sub.category || defaultCategory,
      plan: sub.plan || "",
      amount: String(sub.amount ?? ""),
      currency: sub.currency || "JPY",
      amountJpy: sub.amountJpy == null ? "" : String(sub.amountJpy),
      cycle: sub.cycle || "monthly",
      renewalDate: sub.renewalDate || "",
      url: sub.url || "",
      cancelUrl: sub.cancelUrl || "",
      cancelMethod: sub.cancelMethod || "",
      notes: sub.notes || "",
    });
    setShowForm(true);
  }

  async function saveForm() {
    if (!form.name || !form.amount || !form.renewalDate) return;
    if (form.currency !== "JPY" && !form.amountJpy) return;
    if (saving) return;
    setSaving(true);
    const payload = {
      ...form,
      amount: Number(form.amount),
      amountJpy: form.currency === "JPY" ? Number(form.amount) : Number(form.amountJpy),
    };
    try {
      if (editingId) await update(editingId, payload);
      else await create(payload);
      setShowForm(false);
    } catch (e) {
      alert(`保存に失敗: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      setSelectedId(null);
      setDeleteTarget(null);
    } catch (e) {
      alert(`削除に失敗: ${e.message}`);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bg,
        color: t.text,
        fontFamily: "'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",
        transition: "background 0.2s,color 0.2s",
      }}
    >
      <header
        style={{
          background: t.headerBg,
          borderBottom: `1px solid ${t.border}`,
          padding: "20px 20px 0",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: t.text, letterSpacing: "-0.5px" }}>サブスク管理</div>
              <div style={{ fontSize: 11, color: t.textSub, marginTop: 1 }}>
                月額 ¥{totalMonthly.toLocaleString()} · {subs.filter((s) => s.active).length}件
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={iconBtn(t)} title="管理設定" onClick={() => setShowAdminPin(true)} disabled={settingsLoading}>
                ⚙️
              </button>
              <button
                style={{
                  background: t.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 16px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
                onClick={openAdd}
              >
                ＋ 追加
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 0,
              background: t.surfaceAlt,
              borderRadius: "10px 10px 0 0",
              overflow: "hidden",
              border: `1px solid ${t.border}`,
              borderBottom: "none",
            }}
          >
            {[
              ["月額合計", `¥${totalMonthly.toLocaleString()}`],
              ["年額換算", `¥${(totalMonthly * 12).toLocaleString()}`],
              ["契約数", `${subs.filter((s) => s.active).length}件`],
            ].map(([label, val], i, arr) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  textAlign: "center",
                  borderRight: i < arr.length - 1 ? `1px solid ${t.border}` : "none",
                }}
              >
                <div style={{ fontSize: 10, color: t.textMute, letterSpacing: 1, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "14px 20px 8px",
          borderBottom: `1px solid ${t.border}`,
          background: t.surface,
        }}
      >
        <input
          style={{
            width: "100%",
            background: t.surfaceAlt,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: "9px 12px",
            color: t.text,
            fontSize: 14,
            marginBottom: 10,
            boxSizing: "border-box",
            outline: "none",
          }}
          placeholder="🔍 サービス名で検索"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              style={{
                background: filter === cat ? t.accent : "transparent",
                border: `1px solid ${filter === cat ? t.accent : t.border}`,
                borderRadius: 20,
                padding: "4px 12px",
                color: filter === cat ? "#fff" : t.textSub,
                fontSize: 12,
                cursor: "pointer",
              }}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: t.textMute }}>並び替え</span>
          {[
            ["renewal", "更新日"],
            ["amount", "金額"],
            ["name", "名前"],
          ].map(([val, label]) => (
            <button
              key={val}
              style={{
                background: sort === val ? t.surfaceAlt : "transparent",
                border: `1px solid ${sort === val ? t.borderMid : t.border}`,
                borderRadius: 6,
                padding: "3px 10px",
                color: sort === val ? t.text : t.textSub,
                fontSize: 12,
                cursor: "pointer",
              }}
              onClick={() => setSort(val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "12px 20px 40px", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading && <div style={{ textAlign: "center", color: t.textMute, padding: "40px 0" }}>読み込み中...</div>}
        {!metaLoading && metaError && (
          <div style={{ color: t.soon, padding: "12px 16px", background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 8 }}>
            カテゴリ情報の取得に失敗しました。既定カテゴリで表示しています。
          </div>
        )}
        {error && (
          <div style={{ color: t.urgent, padding: "16px", background: t.urgentBg, border: `1px solid ${t.urgent}`, borderRadius: 8 }}>
            読み込みに失敗しました: {error.message}
          </div>
        )}
        {!loading &&
          !error &&
          filtered.map((sub) => {
            const days = daysUntil(sub.renewalDate);
            const urgent = days <= 7;
            const soon = days <= 30;
            const isOpen = selectedId === sub.id;
            const currency = sub.currency || "JPY";
            const amountJpy = effectiveAmountJpy(sub);
            const isForeign = currency !== "JPY";
            return (
              <div
                key={sub.id}
                style={{
                  background: urgent ? t.urgentBg : t.surface,
                  border: `1px solid ${urgent ? t.urgent : soon ? t.soon : t.border}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                  ...(isOpen ? { borderColor: t.accent } : {}),
                }}
                onClick={() => setSelectedId(isOpen ? null : sub.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: t.textSub,
                          background: t.surfaceAlt,
                          border: `1px solid ${t.border}`,
                          borderRadius: 5,
                          padding: "1px 8px",
                        }}
                      >
                        {sub.category}
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{sub.name}</span>
                      {sub.plan && <span style={{ fontSize: 12, color: t.accent, fontWeight: 600 }}>{sub.plan}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{formatAmount(sub.amount, sub.cycle, currency)}</div>
                    {isForeign && (
                      <div style={{ fontSize: 11, color: t.textSub }}>
                        家計計上 {amountJpy == null ? "未設定" : formatJpy(amountJpy, sub.cycle)}
                      </div>
                    )}
                    {sub.cycle === "yearly" && (
                      <div style={{ fontSize: 11, color: t.textSub }}>
                        月換算 {amountJpy == null ? "未設定" : `¥${toMonthly(amountJpy, sub.cycle).toLocaleString()}`}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: urgent ? t.urgent : soon ? t.soon : t.textSub,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    flexWrap: "wrap",
                  }}
                >
                  <span>{urgent ? "●" : soon ? "●" : "○"}</span>
                  <span style={{ fontWeight: urgent || soon ? 700 : 400 }}>
                    {days <= 0 ? "本日更新" : `${days}日後に更新`} &nbsp;·&nbsp; {formatDate(sub.renewalDate)}
                  </span>
                  <span
                    style={{
                      marginLeft: 4,
                      fontSize: 10,
                      color: t.textMute,
                      background: t.surfaceAlt,
                      border: `1px solid ${t.border}`,
                      borderRadius: 4,
                      padding: "1px 6px",
                      fontWeight: 500,
                    }}
                  >
                    {sub.cycle === "yearly" ? "年契約" : "月契約"}
                  </span>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 14 }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ height: 1, background: t.border, marginBottom: 14 }} />
                    {sub.notes && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: t.textMute, marginBottom: 3, fontWeight: 600, letterSpacing: 0.5 }}>メモ</div>
                        <div style={{ fontSize: 13, color: t.textSub }}>{sub.notes}</div>
                      </div>
                    )}
                    {sub.cancelMethod && (
                      <div
                        style={{
                          marginBottom: 14,
                          padding: "10px 12px",
                          background: t.surfaceAlt,
                          borderRadius: 8,
                          border: `1px solid ${t.border}`,
                        }}
                      >
                        <div style={{ fontSize: 11, color: t.textMute, marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>
                          解約方法
                        </div>
                        <div style={{ fontSize: 13, color: t.textSub, lineHeight: 1.7 }}>{sub.cancelMethod}</div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {sub.url && (
                        <a
                          href={sub.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: t.surfaceAlt,
                            color: t.text,
                            border: `1px solid ${t.border}`,
                            borderRadius: 8,
                            padding: "8px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          🌐 公式サイト
                        </a>
                      )}
                      {sub.cancelUrl && (
                        <button
                          style={{
                            background: t.cancelRedBg,
                            color: t.cancelRedText,
                            border: `1px solid ${t.cancelRedBorder}`,
                            borderRadius: 8,
                            padding: "8px 14px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          onClick={() => setPinTarget({ url: sub.cancelUrl, name: sub.name })}
                        >
                          解約ページへ →
                        </button>
                      )}
                      <button
                        style={{
                          background: "transparent",
                          color: t.textSub,
                          border: `1px solid ${t.border}`,
                          borderRadius: 8,
                          padding: "8px 14px",
                          fontSize: 13,
                          cursor: "pointer",
                          marginLeft: "auto",
                        }}
                        onClick={() => openEdit(sub)}
                      >
                        編集
                      </button>
                      <button
                        style={{
                          background: "transparent",
                          color: t.textMute,
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 10px",
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                        onClick={() => setDeleteTarget(sub)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", color: t.textMute, padding: "40px 0" }}>該当するサブスクがありません</div>
        )}
      </div>

      {showForm && (
        <div style={ov()} onClick={() => !saving && setShowForm(false)}>
          <div style={mod(t)} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 20 }}>
              {editingId ? "サブスクを編集" : "新しいサブスクを追加"}
            </div>

            <Lbl t={t}>サービス名 *</Lbl>
            <Inp t={t} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Netflix" />

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Lbl t={t}>カテゴリ</Lbl>
                <Sel t={t} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {formCategories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Sel>
              </div>
              <div style={{ flex: 1 }}>
                <Lbl t={t}>プラン</Lbl>
                <Inp t={t} value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))} placeholder="スタンダード" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Lbl t={t}>サイクル</Lbl>
                <Sel t={t} value={form.cycle} onChange={(e) => setForm((f) => ({ ...f, cycle: e.target.value }))}>
                  <option value="monthly">月額</option>
                  <option value="yearly">年額</option>
                </Sel>
              </div>
              <div style={{ flex: 1 }}>
                <Lbl t={t}>請求額 *</Lbl>
                <Inp
                  t={t}
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder={form.currency === "JPY" ? "1490" : "20.00"}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Lbl t={t}>通貨</Lbl>
                <Sel t={t} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Sel>
              </div>
              {form.currency !== "JPY" && (
                <div style={{ flex: 1 }}>
                  <Lbl t={t}>家計計上額 (円) *</Lbl>
                  <Inp
                    t={t}
                    type="number"
                    value={form.amountJpy}
                    onChange={(e) => setForm((f) => ({ ...f, amountJpy: e.target.value }))}
                    placeholder="3200"
                  />
                </div>
              )}
            </div>

            <Lbl t={t}>次回更新日 *</Lbl>
            <Inp
              t={t}
              type="date"
              value={form.renewalDate}
              onChange={(e) => setForm((f) => ({ ...f, renewalDate: e.target.value }))}
            />

            <Lbl t={t}>公式サイトURL</Lbl>
            <Inp t={t} value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." />

            <Lbl t={t}>解約ページURL</Lbl>
            <Inp
              t={t}
              value={form.cancelUrl}
              onChange={(e) => setForm((f) => ({ ...f, cancelUrl: e.target.value }))}
              placeholder="https://..."
            />

            <Lbl t={t}>解約方法</Lbl>
            <textarea
              style={{ ...inpStyle(t), height: 68, resize: "vertical" }}
              value={form.cancelMethod}
              onChange={(e) => setForm((f) => ({ ...f, cancelMethod: e.target.value }))}
              placeholder="解約の手順を記入..."
            />

            <Lbl t={t}>メモ</Lbl>
            <Inp t={t} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="備考など" />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button
                style={{
                  background: "transparent",
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  padding: "10px 18px",
                  color: t.textSub,
                  fontSize: 14,
                  cursor: "pointer",
                }}
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                キャンセル
              </button>
              <button
                style={{
                  background: t.accent,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 22px",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: saving ? "wait" : "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
                onClick={saveForm}
                disabled={saving}
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={ov()} onClick={() => setDeleteTarget(null)}>
          <div style={{ ...mod(t), maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 8 }}>削除の確認</div>
            <p style={{ color: t.textSub, fontSize: 14, marginBottom: 20 }}>「{deleteTarget.name}」を削除しますか？</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                style={{
                  background: "transparent",
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  padding: "9px 16px",
                  color: t.textSub,
                  fontSize: 14,
                  cursor: "pointer",
                }}
                onClick={() => setDeleteTarget(null)}
              >
                キャンセル
              </button>
              <button
                style={{
                  background: t.urgent,
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 16px",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={confirmDelete}
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {pinTarget && (
        <PinModal
          t={t}
          verifyPin={verifyPin}
          title={`「${pinTarget.name}」の解約ページへ`}
          onSuccess={() => {
            window.open(pinTarget.url, "_blank", "noopener,noreferrer");
            setPinTarget(null);
          }}
          onClose={() => setPinTarget(null)}
        />
      )}

      {showAdminPin && (
        <PinModal
          t={t}
          verifyPin={verifyPin}
          title="管理設定を開く"
          onSuccess={() => {
            setShowAdminPin(false);
            setShowAdmin(true);
          }}
          onClose={() => setShowAdminPin(false)}
        />
      )}

      {showAdmin && <AdminPanel t={t} verifyPin={verifyPin} setPin={setPin} onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
