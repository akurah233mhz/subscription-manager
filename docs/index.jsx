import { useState, useMemo, useEffect } from "react";

// ── デフォルトPIN ──────────────────────────────────
const DEFAULT_PIN = "1234";

// ── モックデータ ───────────────────────────────────
const MOCK_SUBSCRIPTIONS = [
  { id:"1", name:"Netflix",              category:"エンタメ",   plan:"スタンダード", amount:1490, cycle:"monthly", renewalDate:"2026-06-10", url:"https://www.netflix.com/jp/",   cancelUrl:"https://www.netflix.com/cancelplan", cancelMethod:"「アカウント」→「メンバーシップのキャンセル」", notes:"", active:true },
  { id:"2", name:"Spotify",             category:"音楽",       plan:"プレミアム",   amount:980,  cycle:"monthly", renewalDate:"2026-06-03", url:"https://www.spotify.com/jp/",  cancelUrl:"https://support.spotify.com/jp/article/how-to-cancel-your-subscription/", cancelMethod:"「アカウント」→「プランを管理」→「プレミアムをキャンセル」", notes:"", active:true },
  { id:"3", name:"Adobe Creative Cloud",category:"仕事・制作", plan:"コンプリート", amount:6480, cycle:"monthly", renewalDate:"2026-06-15", url:"https://www.adobe.com/jp/",   cancelUrl:"https://helpx.adobe.com/jp/manage-account/using/cancel-subscription.html", cancelMethod:"Adobe IDでログイン→「プランを管理」→「プランをキャンセル」。年間プランは違約金注意。", notes:"", active:true },
  { id:"4", name:"iCloud+",             category:"クラウド",   plan:"200GB",        amount:400,  cycle:"monthly", renewalDate:"2026-06-07", url:"https://www.icloud.com/",      cancelUrl:"https://support.apple.com/ja-jp/HT207254", cancelMethod:"設定アプリ→Apple ID→サブスクリプション→iCloud+をキャンセル", notes:"", active:true },
  { id:"5", name:"Nintendo Switch Online",category:"ゲーム",   plan:"ファミリー",   amount:4500, cycle:"yearly",  renewalDate:"2026-10-20", url:"https://www.nintendo.com/jp/switch/online/", cancelUrl:"https://www.nintendo.com/jp/support/switch/online/", cancelMethod:"ニンテンドーeショップ→アカウント情報→Nintendo Switch Online→自動更新をオフ", notes:"", active:true },
  { id:"6", name:"生命保険",            category:"保険",       plan:"終身",         amount:12000,cycle:"monthly", renewalDate:"2026-06-28", url:"https://www.example-insurance.co.jp/", cancelUrl:"https://www.example-insurance.co.jp/contact/", cancelMethod:"コールセンター（0120-XXX-XXX）に電話。解約返戻金の確認を忘れずに。", notes:"", active:true },
  { id:"7", name:"Amazon Prime",        category:"ショッピング",plan:"スタンダード", amount:600,  cycle:"monthly", renewalDate:"2026-07-01", url:"https://www.amazon.co.jp/prime", cancelUrl:"https://www.amazon.co.jp/mc/pipelines/cancellation", cancelMethod:"Amazonアカウント→Prime会員情報→会員資格を終了する", notes:"", active:true },
];

const CATEGORIES = ["すべて","エンタメ","音楽","仕事・制作","クラウド","ゲーム","保険","ショッピング","その他"];

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((new Date(dateStr) - today) / 86400000);
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
}
function toMonthly(amount, cycle) { return cycle === "yearly" ? Math.round(amount/12) : amount; }
function formatAmount(amount, cycle) {
  return cycle === "yearly" ? `¥${amount.toLocaleString()}/年` : `¥${amount.toLocaleString()}/月`;
}

const emptyForm = { name:"", category:"エンタメ", plan:"", amount:"", cycle:"monthly", renewalDate:"", url:"", cancelUrl:"", cancelMethod:"", notes:"" };

// ── テーマ定義 ─────────────────────────────────────
function makeTheme(dark) {
  return dark ? {
    bg:         "#0f1117",
    surface:    "#1a1d27",
    surfaceAlt: "#22263a",
    border:     "#2a2d3d",
    borderMid:  "#333650",
    text:       "#e8eaf0",
    textSub:    "#7a7f99",
    textMute:   "#454860",
    accent:     "#5b6af0",
    accentText: "#fff",
    urgent:     "#e53935",
    urgentBg:   "#1a1010",
    soon:       "#e6a817",
    ok:         "#3d9e6a",
    cancelRed:  "#c62828",
    cancelRedBg:"#2a1010",
    cancelRedBorder:"#8b2020",
    cancelRedText:"#ef9a9a",
    headerBg:   "#12151f",
  } : {
    bg:         "#f4f5f8",
    surface:    "#ffffff",
    surfaceAlt: "#f0f1f6",
    border:     "#dde0ec",
    borderMid:  "#c8cbdc",
    text:       "#1a1d2e",
    textSub:    "#5a5f7a",
    textMute:   "#a0a3b8",
    accent:     "#5b6af0",
    accentText: "#fff",
    urgent:     "#d32f2f",
    urgentBg:   "#fff5f5",
    soon:       "#c77700",
    ok:         "#2e7d52",
    cancelRed:  "#c62828",
    cancelRedBg:"#fff5f5",
    cancelRedBorder:"#e57373",
    cancelRedText:"#b71c1c",
    headerBg:   "#ffffff",
  };
}

// ── PINモーダル ────────────────────────────────────
function PinModal({ t, onSuccess, onClose, title = "管理者PINを入力" }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const storedPin = localStorage.getItem("adminPin") || DEFAULT_PIN;

  function handleKey(k) {
    if (input.length >= 4) return;
    const next = input + k;
    setInput(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === storedPin) { onSuccess(); }
        else { setError(true); setInput(""); }
      }, 150);
    }
  }
  function handleDel() { setInput(p => p.slice(0,-1)); setError(false); }

  return (
    <div style={ov(t)} onClick={onClose}>
      <div style={{...mod(t), maxWidth:320, textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:700,color:t.text,marginBottom:6}}>{title}</div>
        <div style={{fontSize:12,color:t.textSub,marginBottom:24}}>4桁のPINを入力してください</div>
        {/* dots */}
        <div style={{display:"flex",gap:16,justifyContent:"center",marginBottom:24}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{
              width:14,height:14,borderRadius:"50%",
              background: i < input.length ? t.accent : "transparent",
              border: `2px solid ${error ? t.urgent : i < input.length ? t.accent : t.borderMid}`,
              transition:"all 0.12s"
            }}/>
          ))}
        </div>
        {error && <div style={{color:t.urgent,fontSize:13,marginBottom:12}}>PINが違います</div>}
        {/* keypad */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:8}}>
          {["1","2","3","4","5","6","7","8","9"].map(k=>(
            <button key={k} style={pinKey(t)} onClick={()=>handleKey(k)}>{k}</button>
          ))}
          <div/>
          <button style={pinKey(t)} onClick={()=>handleKey("0")}>0</button>
          <button style={{...pinKey(t),color:t.textSub,fontSize:18}} onClick={handleDel}>⌫</button>
        </div>
        <button style={{marginTop:12,background:"transparent",border:"none",color:t.textSub,cursor:"pointer",fontSize:13}} onClick={onClose}>キャンセル</button>
      </div>
    </div>
  );
}

// ── 管理画面 ───────────────────────────────────────
function AdminPanel({ t, onClose }) {
  const currentPin = localStorage.getItem("adminPin") || DEFAULT_PIN;
  const [step, setStep]       = useState("menu"); // menu | changePin1 | changePin2
  const [newPin, setNewPin]   = useState("");
  const [inputA, setInputA]   = useState("");
  const [inputB, setInputB]   = useState("");
  const [errA, setErrA]       = useState(false);
  const [errB, setErrB]       = useState(false);
  const [done, setDone]       = useState(false);
  const [dark, setDarkLocal]  = useState(localStorage.getItem("theme")==="dark");

  function pinKeyStep(key, input, setInput, setErr, onFull) {
    if (input.length >= 4) return;
    const next = input + key;
    setInput(next);
    setErr(false);
    if (next.length === 4) setTimeout(()=>onFull(next),150);
  }

  return (
    <div style={ov(t)} onClick={onClose}>
      <div style={{...mod(t),maxWidth:380}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:17,fontWeight:800,color:t.text,marginBottom:20}}>⚙️ 管理設定</div>

        {step === "menu" && (
          <>
            <div style={settingRow(t)}>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:t.text}}>テーマ</div>
                <div style={{fontSize:12,color:t.textSub}}>ダーク / ライト</div>
              </div>
              <div style={toggle(t, dark)} onClick={()=>{
                const next = !dark;
                setDarkLocal(next);
                localStorage.setItem("theme", next?"dark":"light");
                window.dispatchEvent(new Event("themechange"));
              }}>
                <div style={toggleThumb(dark)}/>
              </div>
            </div>
            <div style={settingRow(t)}>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:t.text}}>管理PIN変更</div>
                <div style={{fontSize:12,color:t.textSub}}>現在のPIN：{"●".repeat(currentPin.length)}</div>
              </div>
              <button style={{...smallBtn(t),borderColor:t.accent,color:t.accent}} onClick={()=>{setStep("changePin1");setInputA("");setErrA(false);}}>変更</button>
            </div>
            <div style={{marginTop:8,padding:"10px 12px",background:t.surfaceAlt,borderRadius:8,fontSize:12,color:t.textSub}}>
              💡 管理PINは解約ページへ進む際に必要です。家族には教えないでください。
            </div>
          </>
        )}

        {step === "changePin1" && (
          <PinInput label="現在のPINを入力" input={inputA} err={errA} t={t}
            onKey={k=>pinKeyStep(k,inputA,setInputA,setErrA,v=>{
              if(v===currentPin){setStep("changePin2");setInputB("");setErrB(false);}
              else{setErrA(true);setInputA("");}
            })}
            onDel={()=>setInputA(p=>p.slice(0,-1))}
          />
        )}

        {step === "changePin2" && !done && (
          <PinInput label="新しいPINを入力" input={inputB} err={errB} t={t}
            onKey={k=>pinKeyStep(k,inputB,setInputB,setErrB,v=>{
              localStorage.setItem("adminPin",v);
              setDone(true);
            })}
            onDel={()=>setInputB(p=>p.slice(0,-1))}
          />
        )}

        {done && (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:32,marginBottom:8}}>✅</div>
            <div style={{color:t.text,fontWeight:700}}>PINを変更しました</div>
          </div>
        )}

        <button style={{marginTop:16,background:"transparent",border:"none",color:t.textSub,cursor:"pointer",fontSize:13,display:"block",marginLeft:"auto"}} onClick={onClose}>閉じる</button>
      </div>
    </div>
  );
}

function PinInput({label, input, err, t, onKey, onDel}) {
  return (
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:14,fontWeight:600,color:t.text,marginBottom:16}}>{label}</div>
      <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:20}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{
            width:14,height:14,borderRadius:"50%",
            background: i < input.length ? t.accent : "transparent",
            border:`2px solid ${err?t.urgent:i<input.length?t.accent:t.borderMid}`,
            transition:"all 0.12s"
          }}/>
        ))}
      </div>
      {err && <div style={{color:t.urgent,fontSize:13,marginBottom:10}}>PINが違います</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {["1","2","3","4","5","6","7","8","9"].map(k=>(
          <button key={k} style={pinKey(t)} onClick={()=>onKey(k)}>{k}</button>
        ))}
        <div/>
        <button style={pinKey(t)} onClick={()=>onKey("0")}>0</button>
        <button style={{...pinKey(t),fontSize:18,color:t.textSub}} onClick={onDel}>⌫</button>
      </div>
    </div>
  );
}

// ── メインアプリ ───────────────────────────────────
export default function App() {
  const [darkMode, setDarkMode] = useState(()=>localStorage.getItem("theme")==="dark");
  const t = makeTheme(darkMode);

  useEffect(()=>{
    const h = ()=>setDarkMode(localStorage.getItem("theme")==="dark");
    window.addEventListener("themechange",h);
    return ()=>window.removeEventListener("themechange",h);
  },[]);

  const [subs, setSubs]               = useState(MOCK_SUBSCRIPTIONS);
  const [filter, setFilter]           = useState("すべて");
  const [sort, setSort]               = useState("renewal");
  const [selectedId, setSelectedId]   = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [form, setForm]               = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchText, setSearchText]   = useState("");
  const [pinTarget, setPinTarget]     = useState(null); // {url, name}
  const [showAdmin, setShowAdmin]     = useState(false);
  const [showAdminPin, setShowAdminPin] = useState(false);

  const filtered = useMemo(()=>{
    let list = subs.filter(s=>s.active);
    if (filter !== "すべて") list = list.filter(s=>s.category===filter);
    if (searchText) list = list.filter(s=>s.name.toLowerCase().includes(searchText.toLowerCase()));
    if (sort==="renewal") list=[...list].sort((a,b)=>new Date(a.renewalDate)-new Date(b.renewalDate));
    if (sort==="amount")  list=[...list].sort((a,b)=>toMonthly(b.amount,b.cycle)-toMonthly(a.amount,a.cycle));
    if (sort==="name")    list=[...list].sort((a,b)=>a.name.localeCompare(b.name,"ja"));
    return list;
  },[subs,filter,sort,searchText]);

  const totalMonthly = useMemo(()=>subs.filter(s=>s.active).reduce((s,x)=>s+toMonthly(x.amount,x.cycle),0),[subs]);

  function openAdd()  { setEditingId(null); setForm(emptyForm); setShowForm(true); }
  function openEdit(sub) { setEditingId(sub.id); setForm({...sub}); setShowForm(true); }
  function saveForm() {
    if (!form.name||!form.amount||!form.renewalDate) return;
    if (editingId) setSubs(prev=>prev.map(s=>s.id===editingId?{...s,...form,amount:Number(form.amount)}:s));
    else setSubs(prev=>[...prev,{...form,id:Date.now().toString(),amount:Number(form.amount),active:true}]);
    setShowForm(false);
  }
  function deleteSub(id) { setSubs(prev=>prev.map(s=>s.id===id?{...s,active:false}:s)); setSelectedId(null); }

  // カード
  const selected = subs.find(s=>s.id===selectedId);

  return (
    <div style={{minHeight:"100vh",background:t.bg,color:t.text,fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",transition:"background 0.2s,color 0.2s"}}>

      {/* Header */}
      <header style={{background:t.headerBg,borderBottom:`1px solid ${t.border}`,padding:"20px 20px 0",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:t.text,letterSpacing:"-0.5px"}}>サブスク管理</div>
              <div style={{fontSize:11,color:t.textSub,marginTop:1}}>月額 ¥{totalMonthly.toLocaleString()} · {subs.filter(s=>s.active).length}件</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button style={{...iconBtn(t)}} title="管理設定" onClick={()=>setShowAdminPin(true)}>⚙️</button>
              <button style={{background:t.accent,color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",fontWeight:700,fontSize:14,cursor:"pointer"}} onClick={openAdd}>＋ 追加</button>
            </div>
          </div>

          {/* Summary bar */}
          <div style={{display:"flex",gap:0,background:t.surfaceAlt,borderRadius:"10px 10px 0 0",overflow:"hidden",border:`1px solid ${t.border}`,borderBottom:"none"}}>
            {[
              ["月額合計", `¥${totalMonthly.toLocaleString()}`],
              ["年額換算", `¥${(totalMonthly*12).toLocaleString()}`],
              ["契約数",   `${subs.filter(s=>s.active).length}件`],
            ].map(([label,val],i,arr)=>(
              <div key={label} style={{flex:1,padding:"12px 0",textAlign:"center",borderRight:i<arr.length-1?`1px solid ${t.border}`:"none"}}>
                <div style={{fontSize:10,color:t.textMute,letterSpacing:1,marginBottom:3}}>{label}</div>
                <div style={{fontSize:17,fontWeight:800,color:t.text}}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Controls */}
      <div style={{maxWidth:680,margin:"0 auto",padding:"14px 20px 8px",borderBottom:`1px solid ${t.border}`,background:t.surface}}>
        <input style={{width:"100%",background:t.surfaceAlt,border:`1px solid ${t.border}`,borderRadius:8,padding:"9px 12px",color:t.text,fontSize:14,marginBottom:10,boxSizing:"border-box",outline:"none"}}
          placeholder="🔍 サービス名で検索" value={searchText} onChange={e=>setSearchText(e.target.value)}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          {CATEGORIES.map(cat=>(
            <button key={cat} style={{
              background: filter===cat ? t.accent : "transparent",
              border:`1px solid ${filter===cat ? t.accent : t.border}`,
              borderRadius:20, padding:"4px 12px", color:filter===cat?"#fff":t.textSub, fontSize:12, cursor:"pointer",
            }} onClick={()=>setFilter(cat)}>{cat}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:11,color:t.textMute}}>並び替え</span>
          {[["renewal","更新日"],["amount","金額"],["name","名前"]].map(([val,label])=>(
            <button key={val} style={{background:sort===val?t.surfaceAlt:"transparent",border:`1px solid ${sort===val?t.borderMid:t.border}`,borderRadius:6,padding:"3px 10px",color:sort===val?t.text:t.textSub,fontSize:12,cursor:"pointer"}}
              onClick={()=>setSort(val)}>{label}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{maxWidth:680,margin:"0 auto",padding:"12px 20px 40px",display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map(sub=>{
          const days = daysUntil(sub.renewalDate);
          const urgent = days <= 7;
          const soon   = days <= 30;
          const isOpen = selectedId === sub.id;
          return (
            <div key={sub.id} style={{
              background: urgent ? t.urgentBg : t.surface,
              border:`1px solid ${urgent?t.urgent:soon?t.soon:t.border}`,
              borderRadius:12, padding:"14px 16px", cursor:"pointer",
              transition:"border-color 0.15s",
              ...(isOpen?{borderColor:t.accent}:{})
            }} onClick={()=>setSelectedId(isOpen?null:sub.id)}>

              {/* top row */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:t.textSub,background:t.surfaceAlt,border:`1px solid ${t.border}`,borderRadius:5,padding:"1px 8px"}}>{sub.category}</span>
                    <span style={{fontSize:16,fontWeight:700,color:t.text}}>{sub.name}</span>
                    {sub.plan && <span style={{fontSize:12,color:t.accent,fontWeight:600}}>{sub.plan}</span>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:16,fontWeight:800,color:t.text}}>{formatAmount(sub.amount,sub.cycle)}</div>
                  {sub.cycle==="yearly" && <div style={{fontSize:11,color:t.textSub}}>月換算 ¥{toMonthly(sub.amount,sub.cycle).toLocaleString()}</div>}
                </div>
              </div>

              {/* renewal */}
              <div style={{marginTop:8,fontSize:12,color:urgent?t.urgent:soon?t.soon:t.textSub,display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                <span>{urgent?"●":soon?"●":"○"}</span>
                <span style={{fontWeight:urgent||soon?700:400}}>
                  {days<=0?"本日更新":`${days}日後に更新`} &nbsp;·&nbsp; {formatDate(sub.renewalDate)}
                </span>
                <span style={{marginLeft:4,fontSize:10,color:t.textMute,background:t.surfaceAlt,border:`1px solid ${t.border}`,borderRadius:4,padding:"1px 6px",fontWeight:500}}>
                  {sub.cycle==="yearly"?"年契約":"月契約"}
                </span>
              </div>

              {/* detail */}
              {isOpen && (
                <div style={{marginTop:14}} onClick={e=>e.stopPropagation()}>
                  <div style={{height:1,background:t.border,marginBottom:14}}/>

                  {sub.notes && (
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:11,color:t.textMute,marginBottom:3,fontWeight:600,letterSpacing:0.5}}>メモ</div>
                      <div style={{fontSize:13,color:t.textSub}}>{sub.notes}</div>
                    </div>
                  )}

                  {sub.cancelMethod && (
                    <div style={{marginBottom:14,padding:"10px 12px",background:t.surfaceAlt,borderRadius:8,border:`1px solid ${t.border}`}}>
                      <div style={{fontSize:11,color:t.textMute,marginBottom:4,fontWeight:600,letterSpacing:0.5}}>解約方法</div>
                      <div style={{fontSize:13,color:t.textSub,lineHeight:1.7}}>{sub.cancelMethod}</div>
                    </div>
                  )}

                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <a href={sub.url} target="_blank" rel="noopener noreferrer"
                      style={{background:t.surfaceAlt,color:t.text,border:`1px solid ${t.border}`,borderRadius:8,padding:"8px 14px",fontSize:13,fontWeight:600,textDecoration:"none"}}>
                      🌐 公式サイト
                    </a>
                    <button style={{background:t.cancelRedBg,color:t.cancelRedText,border:`1px solid ${t.cancelRedBorder}`,borderRadius:8,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}
                      onClick={()=>setPinTarget({url:sub.cancelUrl,name:sub.name})}>
                      解約ページへ →
                    </button>
                    <button style={{background:"transparent",color:t.textSub,border:`1px solid ${t.border}`,borderRadius:8,padding:"8px 14px",fontSize:13,cursor:"pointer",marginLeft:"auto"}}
                      onClick={()=>openEdit(sub)}>編集</button>
                    <button style={{background:"transparent",color:t.textMute,border:"none",borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer"}}
                      onClick={()=>setDeleteTarget(sub)}>削除</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length===0 && <div style={{textAlign:"center",color:t.textMute,padding:"40px 0"}}>該当するサブスクがありません</div>}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={ov(t)} onClick={()=>setShowForm(false)}>
          <div style={mod(t)} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:17,fontWeight:800,color:t.text,marginBottom:20}}>{editingId?"サブスクを編集":"新しいサブスクを追加"}</div>

            <Lbl t={t}>サービス名 *</Lbl>
            <Inp t={t} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Netflix"/>

            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1}}>
                <Lbl t={t}>カテゴリ</Lbl>
                <Sel t={t} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {CATEGORIES.filter(c=>c!=="すべて").map(c=><option key={c}>{c}</option>)}
                </Sel>
              </div>
              <div style={{flex:1}}>
                <Lbl t={t}>プラン</Lbl>
                <Inp t={t} value={form.plan} onChange={e=>setForm(f=>({...f,plan:e.target.value}))} placeholder="スタンダード"/>
              </div>
            </div>

            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1}}>
                <Lbl t={t}>サイクル</Lbl>
                <Sel t={t} value={form.cycle} onChange={e=>setForm(f=>({...f,cycle:e.target.value}))}>
                  <option value="monthly">月額</option>
                  <option value="yearly">年額</option>
                </Sel>
              </div>
              <div style={{flex:1}}>
                <Lbl t={t}>金額 (円) *</Lbl>
                <Inp t={t} type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="1490"/>
              </div>
            </div>

            <Lbl t={t}>次回更新日 *</Lbl>
            <Inp t={t} type="date" value={form.renewalDate} onChange={e=>setForm(f=>({...f,renewalDate:e.target.value}))}/>

            <Lbl t={t}>公式サイトURL</Lbl>
            <Inp t={t} value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} placeholder="https://..."/>

            <Lbl t={t}>解約ページURL</Lbl>
            <Inp t={t} value={form.cancelUrl} onChange={e=>setForm(f=>({...f,cancelUrl:e.target.value}))} placeholder="https://..."/>

            <Lbl t={t}>解約方法</Lbl>
            <textarea style={{...inpStyle(t),height:68,resize:"vertical"}} value={form.cancelMethod} onChange={e=>setForm(f=>({...f,cancelMethod:e.target.value}))} placeholder="解約の手順を記入..."/>

            <Lbl t={t}>メモ</Lbl>
            <Inp t={t} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="備考など"/>

            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
              <button style={{background:"transparent",border:`1px solid ${t.border}`,borderRadius:8,padding:"10px 18px",color:t.textSub,fontSize:14,cursor:"pointer"}} onClick={()=>setShowForm(false)}>キャンセル</button>
              <button style={{background:t.accent,border:"none",borderRadius:8,padding:"10px 22px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}} onClick={saveForm}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div style={ov(t)} onClick={()=>setDeleteTarget(null)}>
          <div style={{...mod(t),maxWidth:340}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,color:t.text,marginBottom:8}}>削除の確認</div>
            <p style={{color:t.textSub,fontSize:14,marginBottom:20}}>「{deleteTarget.name}」を削除しますか？</p>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button style={{background:"transparent",border:`1px solid ${t.border}`,borderRadius:8,padding:"9px 16px",color:t.textSub,fontSize:14,cursor:"pointer"}} onClick={()=>setDeleteTarget(null)}>キャンセル</button>
              <button style={{background:t.urgent,border:"none",borderRadius:8,padding:"9px 16px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}} onClick={()=>{deleteSub(deleteTarget.id);setDeleteTarget(null);}}>削除する</button>
            </div>
          </div>
        </div>
      )}

      {/* PIN for cancel */}
      {pinTarget && (
        <PinModal t={t}
          title={`「${pinTarget.name}」の解約ページへ`}
          onSuccess={()=>{ window.open(pinTarget.url,"_blank","noopener,noreferrer"); setPinTarget(null); }}
          onClose={()=>setPinTarget(null)}
        />
      )}

      {/* Admin PIN gate */}
      {showAdminPin && (
        <PinModal t={t} title="管理設定を開く"
          onSuccess={()=>{ setShowAdminPin(false); setShowAdmin(true); }}
          onClose={()=>setShowAdminPin(false)}
        />
      )}

      {/* Admin panel */}
      {showAdmin && <AdminPanel t={t} onClose={()=>setShowAdmin(false)}/>}
    </div>
  );
}

// ── 小コンポーネント ───────────────────────────────
function Lbl({t,children}){ return <div style={{fontSize:11,color:t.textSub,marginBottom:3,fontWeight:600,letterSpacing:0.5}}>{children}</div>; }
function Inp({t,...props}){ return <input style={inpStyle(t)} {...props}/>; }
function Sel({t,children,...props}){ return <select style={inpStyle(t)} {...props}>{children}</select>; }

function inpStyle(t){ return {display:"block",width:"100%",background:t.surfaceAlt,border:`1px solid ${t.border}`,borderRadius:8,padding:"9px 11px",color:t.text,fontSize:14,marginBottom:12,boxSizing:"border-box",outline:"none",fontFamily:"inherit"}; }
function ov(t)  { return {position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}; }
function mod(t) { return {background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,padding:24,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto"}; }
function iconBtn(t){ return {background:t.surfaceAlt,border:`1px solid ${t.border}`,borderRadius:8,padding:"8px 10px",fontSize:16,cursor:"pointer",color:t.text}; }
function pinKey(t){ return {background:t.surfaceAlt,border:`1px solid ${t.border}`,borderRadius:10,padding:"14px 0",fontSize:20,fontWeight:600,color:t.text,cursor:"pointer"}; }
function settingRow(t){ return {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:`1px solid ${t.border}`}; }
function smallBtn(t){ return {background:"transparent",border:`1px solid ${t.border}`,borderRadius:7,padding:"6px 14px",fontSize:13,cursor:"pointer"}; }
function toggle(t,on){ return {width:44,height:24,borderRadius:12,background:on?t.accent:t.borderMid,position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0}; }
function toggleThumb(on){ return {position:"absolute",top:3,left:on?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}; }
