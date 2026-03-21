import { useState, useEffect } from "react";

const PRINT_CSS = `@media print {
  .no-print { display: none !important; }
  .print-area { display: block !important; }
}`;

const SITES  = ["楽天市場", "Yahoo!ショッピング", "その他"];
const CARDS  = ["楽天カード", "PayPayカード", "その他"];
const STORAGE_KEY = "purchase-tool-v3";

const genMonths = () => {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,
      label: `${d.getFullYear()}年${d.getMonth()+1}月`,
    };
  }).reverse();
};
const MONTHS     = genMonths();
const THIS_MONTH = MONTHS[1]?.value || MONTHS[0]?.value;

const DEMO = [
  { id:1,  site:"楽天市場",          productName:"はちみつ 国産 500g",              instructedPrice:"3280", pointAdjust:false, note:"", status:"購入済", orderedAt:"2026-03-01", actualPrice:"3280", orderNo:"R-111111111", cardType:"楽天カード",  settledAt:"",           settleMonth:THIS_MONTH },
  { id:2,  site:"Yahoo!ショッピング", productName:"オリーブオイル エキストラバージン",  instructedPrice:"3280", pointAdjust:false, note:"", status:"購入済", orderedAt:"2026-03-01", actualPrice:"3280", orderNo:"Y-222222222", cardType:"楽天カード",  settledAt:"",           settleMonth:THIS_MONTH },
  { id:3,  site:"楽天市場",          productName:"プロテインバー 12本セット",         instructedPrice:"1980", pointAdjust:true,  note:"", status:"購入済", orderedAt:"2026-03-05", actualPrice:"1980", orderNo:"R-333333333", cardType:"PayPayカード", settledAt:"",           settleMonth:THIS_MONTH },
  { id:4,  site:"Yahoo!ショッピング", productName:"抹茶パウダー 業務用",               instructedPrice:"4500", pointAdjust:false, note:"", status:"照合済", orderedAt:"2026-02-20", actualPrice:"4500", orderNo:"Y-444444444", cardType:"PayPayカード", settledAt:"2026-03-10", settleMonth:"2026-03" },
  { id:5,  site:"楽天市場",          productName:"ナッツ詰め合わせ 1kg",              instructedPrice:"3800", pointAdjust:false, note:"", status:"精算済", orderedAt:"2026-02-10", actualPrice:"3750", orderNo:"R-555555555", cardType:"楽天カード",  settledAt:"2026-02-28", settleMonth:"2026-02" },
  { id:6,  site:"楽天市場",          productName:"緑茶 有機栽培 100g",               instructedPrice:"2200", pointAdjust:false, note:"", status:"精算済", orderedAt:"2026-02-12", actualPrice:"2200", orderNo:"R-666666666", cardType:"楽天カード",  settledAt:"2026-02-28", settleMonth:"2026-03" },
  { id:7,  site:"楽天市場",          productName:"黒糖 沖縄産 500g",                 instructedPrice:"1500", pointAdjust:true,  note:"", status:"精算済", orderedAt:"2026-02-18", actualPrice:"1500", orderNo:"R-777777777", cardType:"楽天カード",  settledAt:"2026-03-05", settleMonth:"2026-03" },
  { id:8,  site:"Yahoo!ショッピング", productName:"コーヒー豆 ブレンド 200g",          instructedPrice:"2980", pointAdjust:false, note:"", status:"精算済", orderedAt:"2026-02-22", actualPrice:"2800", orderNo:"Y-888888888", cardType:"楽天カード",  settledAt:"2026-03-08", settleMonth:"2026-03" },
  { id:9,  site:"Yahoo!ショッピング", productName:"チアシード 300g",                  instructedPrice:"1800", pointAdjust:false, note:"", status:"精算済", orderedAt:"2026-02-14", actualPrice:"1800", orderNo:"Y-999999999", cardType:"PayPayカード", settledAt:"2026-03-02", settleMonth:"2026-03" },
  { id:10, site:"楽天市場",          productName:"アーモンドミルク 1L×6本",           instructedPrice:"3600", pointAdjust:false, note:"", status:"精算済", orderedAt:"2026-02-16", actualPrice:"3600", orderNo:"R-101010101", cardType:"PayPayカード", settledAt:"2026-03-04", settleMonth:"2026-03" },
  { id:11, site:"その他",            productName:"ごま油 太白 450g",                  instructedPrice:"1200", pointAdjust:true,  note:"", status:"精算済", orderedAt:"2026-02-25", actualPrice:"1100", orderNo:"O-111111111", cardType:"PayPayカード", settledAt:"2026-03-12", settleMonth:"2026-03" },
];

const STATUS_STYLE = {
  購入済: "bg-blue-100 text-blue-700",
  照合済: "bg-yellow-100 text-yellow-700",
  精算済: "bg-green-100 text-green-700",
};

export default function App() {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState("list");
  const [filterSt,    setFilterSt]    = useState("すべて");
  const [filterMonth, setFilterMonth] = useState(THIS_MONTH);
  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [form,        setForm]        = useState({});
  const [toast,       setToast]       = useState(null);
  const [checkInputs, setCheckInputs] = useState({});
  const [dupAlert,    setDupAlert]    = useState(null);
  const [printMode,   setPrintMode]   = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = PRINT_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        setItems(res?.value ? JSON.parse(res.value) : []);
      } catch { setItems([]); }
      setLoading(false);
    })();
  }, []);

  const persist = async (next) => {
    setItems(next);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const showToast = (msg, err) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2200);
  };

  const blankForm = () => ({
    site:"楽天市場", productName:"", instructedPrice:"", pointAdjust:false, note:"",
    status:"購入済", orderedAt:"", actualPrice:"", orderNo:"",
    cardType:"楽天カード", settledAt:"", settleMonth:THIS_MONTH,
  });

  const openNew  = () => { setForm(blankForm()); setEditId(null); setShowForm(true); };
  const openEdit = (item) => { setForm({...item}); setEditId(item.id); setShowForm(true); };
  const ff = (v) => setForm(p => ({...p, ...v}));

  const saveForm = () => {
    if (!form.productName || !form.instructedPrice) return alert("商品名と指示金額は必須です");
    const next = editId
      ? items.map(i => i.id === editId ? {...form} : i)
      : [{...form, id: Date.now()}, ...items];
    persist(next);
    setShowForm(false);
    showToast(editId ? "更新しました" : "登録しました");
  };

  const deleteItem = (id) => {
    if (!confirm("削除しますか？")) return;
    persist(items.filter(i => i.id !== id));
    setShowForm(false);
    showToast("削除しました", true);
  };

  const setCI = (id, key, val) =>
    setCheckInputs(p => ({...p, [id]: {...(p[id]||{}), [key]: val}}));
  const getCI = (id) => checkInputs[id] || { usedAt:"", usedAmount:"" };

  const handleCheck = (item) => {
    const inp = getCI(item.id);
    if (!inp.usedAt || !inp.usedAmount) { alert("利用日と金額を入力してください"); return; }
    const dupSaved = items.filter(i =>
      i.id !== item.id && (i.status === "照合済" || i.status === "精算済") &&
      i.settledAt === inp.usedAt && String(i.actualPrice) === String(inp.usedAmount)
    );
    const dupInput = items.filter(i =>
      i.id !== item.id && i.status === "購入済" &&
      checkInputs[i.id]?.usedAt === inp.usedAt &&
      String(checkInputs[i.id]?.usedAmount) === String(inp.usedAmount)
    );
    const dups = [...dupSaved, ...dupInput];
    const doSave = () => persist(items.map(i => i.id !== item.id ? i : {
      ...i, status:"照合済", settledAt:inp.usedAt, actualPrice:inp.usedAmount,
    }));
    if (dups.length > 0) {
      setDupAlert({
        msg: `利用日 ${inp.usedAt}、金額 ¥${Number(inp.usedAmount).toLocaleString()} が以下の案件と重複しています。\n\n${dups.map(d=>`・${d.productName}`).join("\n")}\n\n1件の明細を複数案件に登録している可能性があります。\n確認の上、問題なければ「照合済にする」を押してください。`,
        onConfirm: doSave,
      });
    } else { doSave(); }
  };

  const counts = { 購入済:0, 照合済:0, 精算済:0 };
  items.forEach(i => { if (counts[i.status] !== undefined) counts[i.status]++; });

  const monthItems = items.filter(i => i.settleMonth === filterMonth);
  const monthTotal = monthItems.reduce((s,i) => s+(Number(i.actualPrice)||0), 0);
  const paidTotal  = monthItems.filter(i=>i.status==="精算済").reduce((s,i)=>s+(Number(i.actualPrice)||0),0);
  const byCard     = Object.fromEntries(CARDS.map(c=>[c, monthItems.filter(i=>i.cardType===c).reduce((s,i)=>s+(Number(i.actualPrice)||0),0)]));

  const listItems    = items.filter(i => filterSt==="すべて" || i.status===filterSt);
  const pendingCheck = items.filter(i => i.status==="購入済");
  const doneCheck    = items.filter(i => i.status==="照合済");

  // 報告書データ
  const reportMonth    = MONTHS.find(m => m.value===filterMonth)?.label || filterMonth;
  const reportItems    = items.filter(i => i.status==="精算済" && i.settleMonth===filterMonth);
  const reportTotal    = reportItems.reduce((s,i)=>s+(Number(i.actualPrice)||0),0);
  const today          = new Date().toLocaleDateString("ja-JP");

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">読み込み中...</div>
  );

  // 印刷モード：報告書のみ全画面表示
  if (printMode) return (
    <div className="min-h-screen bg-white p-6 max-w-3xl mx-auto">
      <div className="no-print flex items-center justify-between mb-6">
        <button onClick={() => setPrintMode(false)} className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">← 戻る</button>
        <div className="text-sm text-gray-500">ブラウザの <strong>Ctrl+P</strong>（Mac: ⌘+P）で印刷・PDF保存できます</div>
      </div>

      {/* 報告書本体 */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仕入れ建て替え精算報告書</h1>
          <p className="text-sm text-gray-500 mt-1">精算月: {reportMonth}　／　出力日: {today}</p>
        </div>

        {reportItems.length === 0 && (
          <div className="text-center text-gray-400 py-12 border border-dashed border-gray-200 rounded-xl">精算済みの案件がありません</div>
        )}

        {CARDS.map(card => {
          const ci = reportItems.filter(i => i.cardType === card);
          if (ci.length === 0) return null;
          const ct = ci.reduce((s,i)=>s+(Number(i.actualPrice)||0),0);
          return (
            <div key={card}>
              <div className="text-sm font-bold text-indigo-700 bg-indigo-50 border-l-4 border-indigo-500 px-3 py-2 rounded-r-lg mb-2">
                💳 {card}
              </div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500">
                    <th className="text-left px-3 py-2 border-b border-gray-200">商品名</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200">注文日</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200">明細書利用日</th>
                    <th className="text-right px-3 py-2 border-b border-gray-200">明細金額</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200">注文番号</th>
                  </tr>
                </thead>
                <tbody>
                  {ci.map(item => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-800">{item.productName}</td>
                      <td className="px-3 py-2 text-gray-500">{item.orderedAt || "—"}</td>
                      <td className="px-3 py-2 text-gray-500">{item.settledAt || "—"}</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-800">¥{Number(item.actualPrice||0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-400 font-mono text-xs">{item.orderNo || "—"}</td>
                    </tr>
                  ))}
                  <tr className="bg-indigo-50">
                    <td colSpan={3} className="px-3 py-2 font-bold text-indigo-700">{card} 小計</td>
                    <td className="px-3 py-2 text-right font-bold text-indigo-700">¥{ct.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}

        {reportItems.length > 0 && (
          <div className="bg-indigo-600 text-white rounded-xl p-5 flex justify-between items-center">
            <div>
              <div className="font-bold">合計請求金額（{reportItems.length}件）</div>
              <div className="text-xs opacity-70 mt-1">クレカ明細照合・精算済みの案件合計</div>
            </div>
            <div className="text-3xl font-bold">¥{reportTotal.toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-30">
        <h1 className="text-lg font-bold text-gray-800">📦 仕入れ個人管理</h1>
      </div>

      <div className="bg-white border-b border-gray-200 flex sticky top-14 z-20">
        {[{id:"list",label:"案件一覧"},{id:"check",label:"明細照合"},{id:"monthly",label:"月次集計"},{id:"report",label:"報告書"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-4 text-base font-medium border-b-2 transition ${tab===t.id?"border-indigo-600 text-indigo-600":"border-transparent text-gray-400"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-2xl mx-auto overflow-x-hidden">

        {/* 案件一覧 */}
        {tab === "list" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(counts).map(([st, n]) => (
                <div key={st} onClick={() => setFilterSt(filterSt===st?"すべて":st)}
                  className={`bg-white rounded-xl border p-4 text-center cursor-pointer transition ${filterSt===st?"border-indigo-400 ring-1 ring-indigo-300":"border-gray-200"}`}>
                  <div className="text-3xl font-bold text-gray-700">{n}</div>
                  <div className="text-sm text-gray-400 mt-1">{st}</div>
                </div>
              ))}
            </div>
            {filterSt !== "すべて" && (
              <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2">
                <span className="text-xs text-indigo-600 font-medium">「{filterSt}」で絞り込み中</span>
                <button onClick={() => setFilterSt("すべて")} className="text-xs text-indigo-400">クリア ✕</button>
              </div>
            )}
            {listItems.length === 0 && <div className="text-center text-gray-400 py-12 bg-white rounded-xl">案件がありません</div>}
            {listItems.map(item => {
              const diff = Number(item.actualPrice) - Number(item.instructedPrice);
              return (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer active:bg-gray-50" onClick={() => openEdit(item)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs text-gray-400">{item.site}</span>
                        {item.pointAdjust && <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">ポイント調整</span>}
                      </div>
                      <div className="font-semibold text-gray-800 truncate text-base">{item.productName}</div>
                      <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-2">
                        <span>指示: <span className="font-medium text-gray-700">¥{Number(item.instructedPrice).toLocaleString()}</span></span>
                        {item.actualPrice && (
                          <span className={`font-medium ${diff>0?"text-red-500":diff<0?"text-green-500":"text-gray-700"}`}>
                            実績: ¥{Number(item.actualPrice).toLocaleString()}
                            {diff!==0 && <span className="text-xs ml-1">({diff>0?"+":""}{diff.toLocaleString()})</span>}
                          </span>
                        )}
                      </div>
                      {item.orderedAt && <div className="text-xs text-gray-400 mt-1">注文日: {item.orderedAt}　{item.cardType}</div>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_STYLE[item.status]}`}>{item.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 明細照合 */}
        {tab === "check" && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
              💳 クレカ明細（PDF）を別で開きながら、各案件に<strong>利用日・金額</strong>を入力して照合してください。
            </div>
            {pendingCheck.length===0 && doneCheck.length===0 && (
              <div className="text-center text-gray-400 py-12 bg-white rounded-xl">照合待ちの案件はありません</div>
            )}
            {pendingCheck.map(item => {
              const inp = getCI(item.id);
              const diff = inp.usedAmount && item.instructedPrice ? Number(inp.usedAmount)-Number(item.instructedPrice) : null;
              return (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-xs text-gray-400">{item.site}</span>
                        {item.pointAdjust && <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">ポイント調整</span>}
                      </div>
                      <div className="font-semibold text-gray-800 truncate">{item.productName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        指示金額: ¥{Number(item.instructedPrice).toLocaleString()}
                        {item.actualPrice && <span className="ml-2">実績: <span className="font-medium text-gray-600">¥{Number(item.actualPrice).toLocaleString()}</span></span>}
                        {item.orderedAt && <span className="ml-2">注文日: {item.orderedAt}</span>}
                        {item.orderNo && <span className="ml-2 font-mono">{item.orderNo}</span>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_STYLE[item.status]}`}>{item.status}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="text-xs font-medium text-gray-500">📄 明細から入力</div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400">利用日</label>
                        <input type="date" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 mt-0.5 text-sm bg-white"
                          value={inp.usedAt} onChange={e => setCI(item.id,"usedAt",e.target.value)} />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-400">金額（円）</label>
                        <input inputMode="numeric" pattern="[0-9]*" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 mt-0.5 text-sm bg-white"
                          placeholder="3280" value={inp.usedAmount} onChange={e => setCI(item.id,"usedAmount",e.target.value)} />
                      </div>
                    </div>
                    {diff !== null && (
                      <p className={`text-xs ${diff===0?"text-green-500":diff>0?"text-red-500":"text-green-500"}`}>
                        {diff===0?"✓ 指示金額と一致":diff>0?`⚠ 指示より ¥${diff.toLocaleString()} 高い`:`✓ 指示より ¥${Math.abs(diff).toLocaleString()} 安い`}
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleCheck(item)}
                    className="w-full bg-yellow-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition">
                    照合済にする
                  </button>
                </div>
              );
            })}
            {doneCheck.length > 0 && (
              <>
                <div className="text-xs text-gray-400 font-medium px-1 pt-2">照合済み（精算待ち） {doneCheck.length}件</div>
                {doneCheck.map(item => (
                  <div key={item.id} className="bg-white rounded-xl border border-yellow-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-700 truncate">{item.productName}</div>
                        <div className="text-sm text-gray-500">利用日: {item.settledAt}　¥{Number(item.actualPrice||0).toLocaleString()}<span className="ml-2 text-xs text-gray-400">{item.cardType}</span></div>
                      </div>
                      <span className="text-yellow-500 text-lg">✓</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* 月次集計 */}
        {tab === "monthly" && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <label className="text-xs text-gray-500 block mb-1">集計月</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="bg-indigo-600 rounded-xl p-4 text-white">
              <div className="text-sm opacity-80 mb-1">{MONTHS.find(m=>m.value===filterMonth)?.label} 建て替え合計</div>
              <div className="text-3xl font-bold mb-3">¥{monthTotal.toLocaleString()}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center"><div className="text-xs opacity-70">精算済み</div><div className="font-bold">¥{paidTotal.toLocaleString()}</div></div>
                <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center"><div className="text-xs opacity-70">未精算</div><div className="font-bold">¥{(monthTotal-paidTotal).toLocaleString()}</div></div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700">クレカ別合計</div>
              {CARDS.map(card => (
                <div key={card} className="px-4 py-3 flex justify-between border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{card}</span>
                  <span className={`font-bold text-sm ${byCard[card]>0?"text-gray-800":"text-gray-300"}`}>¥{byCard[card].toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700">内訳 ({monthItems.length}件)</div>
              {monthItems.length===0 && <div className="px-4 py-6 text-center text-sm text-gray-400">該当する案件がありません</div>}
              {monthItems.map(item => (
                <div key={item.id} className="px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50"
                  onClick={() => { openEdit(item); setTab("list"); }}>
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{item.productName}</div>
                      <div className="text-xs text-gray-400">{item.cardType}{item.settledAt&&` ／ ${item.settledAt}`}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-sm">¥{Number(item.actualPrice||0).toLocaleString()}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_STYLE[item.status]}`}>{item.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 報告書 */}
        {tab === "report" && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">精算月</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <button onClick={() => setPrintMode(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition whitespace-nowrap">
                🖨 印刷・PDF
              </button>
            </div>

            {/* プレビュー */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <div>
                <div className="text-base font-bold text-gray-800">仕入れ建て替え精算報告書</div>
                <div className="text-xs text-gray-400 mt-0.5">精算月: {reportMonth}　／　出力日: {today}</div>
              </div>
              {reportItems.length === 0 && <div className="text-center text-gray-400 py-8">精算済みの案件がありません</div>}
              {CARDS.map(card => {
                const ci = reportItems.filter(i => i.cardType===card);
                if (ci.length===0) return null;
                const ct = ci.reduce((s,i)=>s+(Number(i.actualPrice)||0),0);
                return (
                  <div key={card}>
                    <div className="text-xs font-bold text-indigo-700 bg-indigo-50 border-l-4 border-indigo-500 px-3 py-2 rounded-r-lg mb-2">💳 {card}</div>
                    <div className="space-y-1">
                      {ci.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 truncate">{item.productName}</div>
                            <div className="text-gray-400">注文日: {item.orderedAt||"—"}　明細書利用日: {item.settledAt||"—"}</div>
                          </div>
                          <div className="font-bold text-gray-800 ml-3">¥{Number(item.actualPrice||0).toLocaleString()}</div>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-bold text-indigo-700 pt-1">
                        <span>{card} 小計</span><span>¥{ct.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {reportItems.length > 0 && (
                <div className="bg-indigo-600 text-white rounded-xl p-4 flex justify-between items-center">
                  <div className="text-sm font-bold">合計請求金額（{reportItems.length}件）</div>
                  <div className="text-2xl font-bold">¥{reportTotal.toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ＋ボタン */}
      {!printMode && (
        <button onClick={openNew}
          className="fixed bottom-6 right-4 bg-indigo-600 text-white rounded-full w-14 h-14 text-3xl shadow-lg hover:bg-indigo-700 transition flex items-center justify-center z-30">
          ＋
        </button>
      )}

      {/* 入力モーダル */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40">
          <div className="min-h-full flex items-end sm:items-center justify-center">
            <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-800 text-lg">{editId?"案件を編集":"新規登録"}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl leading-none w-10 h-10 flex items-center justify-center">✕</button>
              </div>
              <div className="p-5 space-y-5">
                <div className="space-y-3">
                  <div className="text-xs font-bold text-indigo-600">📋 購入情報</div>
                  <div><label className="text-xs text-gray-500">購入サイト</label>
                    <select className="w-full border border-gray-200 rounded-xl px-4 py-3 mt-1 text-base" value={form.site} onChange={e=>ff({site:e.target.value})}>
                      {SITES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label className="text-sm text-gray-500">商品名 *</label>
                    <input className="w-full border border-gray-200 rounded-xl px-4 py-3 mt-1 text-base" placeholder="商品名" value={form.productName||""} onChange={e=>ff({productName:e.target.value})} />
                  </div>
                  <div><label className="text-sm text-gray-500">指示金額（円）*</label>
                    <input inputMode="numeric" className="w-full border border-gray-200 rounded-xl px-4 py-3 mt-1 text-base" placeholder="3280" value={form.instructedPrice||""} onChange={e=>ff({instructedPrice:e.target.value})} />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="pa" checked={!!form.pointAdjust} onChange={e=>ff({pointAdjust:e.target.checked})} className="w-5 h-5" />
                    <label htmlFor="pa" className="text-base text-gray-600">ポイント調整要</label>
                  </div>
                  <div><label className="text-sm text-gray-500">備考</label>
                    <input className="w-full border border-gray-200 rounded-xl px-4 py-3 mt-1 text-base" placeholder="備考（任意）" value={form.note||""} onChange={e=>ff({note:e.target.value})} />
                  </div>
                </div>
                <div className="border-t border-gray-100"/>
                <div className="space-y-3">
                  <div className="text-xs font-bold text-blue-600">🛒 購入報告</div>
                  <div className="flex gap-3">
                    <div className="flex-1"><label className="text-xs text-gray-500">注文日</label>
                      <input type="date" className="w-full border border-gray-200 rounded-xl px-4 py-3 mt-1 text-base" value={form.orderedAt||""} onChange={e=>ff({orderedAt:e.target.value})} />
                    </div>
                    <div className="flex-1"><label className="text-sm text-gray-500">購入金額（円）</label>
                      <input inputMode="numeric" className="w-full border border-gray-200 rounded-xl px-4 py-3 mt-1 text-base" placeholder="実購入額" value={form.actualPrice||""} onChange={e=>ff({actualPrice:e.target.value})} />
                    </div>
                  </div>
                  {form.actualPrice && form.instructedPrice && (()=>{
                    const d=Number(form.actualPrice)-Number(form.instructedPrice);
                    if(d===0)return null;
                    return <p className={`text-sm ${d>0?"text-red-500":"text-green-500"}`}>{d>0?`⚠ 指示より ¥${d.toLocaleString()} 高い（自己負担）`:`✓ 指示より ¥${Math.abs(d).toLocaleString()} 安い`}</p>;
                  })()}
                  <div><label className="text-sm text-gray-500">注文番号</label>
                    <input className="w-full border border-gray-200 rounded-xl px-4 py-3 mt-1 text-base font-mono" placeholder="例: 123-4567890-1234567" value={form.orderNo||""} onChange={e=>ff({orderNo:e.target.value})} />
                  </div>
                </div>
                <div className="border-t border-gray-100"/>
                <div className="space-y-3">
                  <div className="text-xs font-bold text-yellow-600">🧾 明細照合</div>
                  <div className="flex gap-3">
                    <div className="flex-1"><label className="text-xs text-gray-500">クレカ</label>
                      <select className="w-full border border-gray-200 rounded-xl px-4 py-3 mt-1 text-base" value={form.cardType||"楽天カード"} onChange={e=>ff({cardType:e.target.value})}>
                        {CARDS.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex-1"><label className="text-sm text-gray-500">決済日</label>
                      <input type="date" className="w-full border border-gray-200 rounded-xl px-4 py-3 mt-1 text-base" value={form.settledAt||""} onChange={e=>ff({settledAt:e.target.value})} />
                    </div>
                  </div>
                  <div><label className="text-sm text-gray-500">精算月</label>
                    <select className="w-full border border-gray-200 rounded-xl px-4 py-3 mt-1 text-base" value={form.settleMonth||THIS_MONTH} onChange={e=>ff({settleMonth:e.target.value})}>
                      {MONTHS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="border-t border-gray-100"/>
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-2">📌 ステータス</div>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(STATUS_STYLE).map(([st,cls])=>(
                      <button key={st} onClick={()=>ff({status:st})}
                        className={`py-3 rounded-xl text-sm font-medium border-2 transition ${form.status===st?"border-indigo-500 "+cls:"border-gray-200 text-gray-400"}`}>
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1 pb-4">
                  {editId && <button onClick={()=>deleteItem(editId)} className="px-5 py-3 text-base text-red-400 border border-red-200 rounded-xl min-w-16">削除</button>}
                  {editId && <button onClick={()=>{
                    const src = items.find(i=>i.id===editId);
                    const duped = {...src, id:Date.now(), status:"購入済", orderedAt:"", actualPrice:"", orderNo:"", settledAt:""};
                    persist([duped, ...items]);
                    setShowForm(false);
                    showToast("複製しました");
                  }} className="px-5 py-3 text-base text-indigo-500 border border-indigo-200 rounded-xl">複製</button>}
                  <button onClick={()=>setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-base">キャンセル</button>
                  <button onClick={saveForm} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-base font-semibold">保存する</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 重複アラート */}
      {dupAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="text-2xl text-center">⚠️</div>
            <div className="text-sm font-bold text-gray-800 text-center">重複の可能性があります</div>
            <div className="text-xs text-gray-600 whitespace-pre-line bg-red-50 rounded-lg p-3">{dupAlert.msg}</div>
            <div className="flex gap-2">
              <button onClick={()=>setDupAlert(null)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm">戻って確認する</button>
              <button onClick={()=>{dupAlert.onConfirm();setDupAlert(null);}} className="flex-1 bg-yellow-500 text-white py-2 rounded-xl text-sm font-semibold">照合済にする</button>
            </div>
          </div>
        </div>
      )}

      {/* トースト */}
      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium shadow-lg z-50 whitespace-nowrap ${toast.err?"bg-red-500":"bg-gray-800"} text-white`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}