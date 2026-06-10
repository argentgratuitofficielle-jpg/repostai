"use client";
import { useState, useEffect } from "react";

const C = {
  bg: "#0A0A0F", surface: "#12121A", card: "#1A1A26", border: "#2A2A3A",
  accent: "#1D9BF0", accentDim: "#1D9BF018", green: "#00E676", greenDim: "#00E67612",
  text: "#E8E8F0", muted: "#6B6B8A", danger: "#FF4B6E",
};

function XIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L2.18 2.25h6.827l4.236 5.605 5.001-5.605zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 46, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
        background: value ? C.accent : C.border, position: "relative", flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: value ? 23 : 3,
        width: 20, height: 20, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

function StatusMsg({ type, msg }) {
  if (!msg) return null;
  const isOk = type === "success";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
      borderRadius: 10, marginTop: 12,
      background: isOk ? C.greenDim : `${C.danger}15`,
      border: `1px solid ${isOk ? C.green + "40" : C.danger + "40"}`,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: isOk ? C.green : C.danger, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: isOk ? C.green : C.danger }}>{msg}</span>
    </div>
  );
}

function EcranConfig({ keys, setKeys, onSave }) {
  const fields = [
    { k: "apiKey", label: "API Key" },
    { k: "apiSecret", label: "API Secret" },
    { k: "accessToken", label: "Access Token" },
    { k: "accessTokenSecret", label: "Access Token Secret" },
  ];
  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, margin: 0 }}>
          Obtiens tes clés sur{" "}
          <a href="https://developer.twitter.com" target="_blank" rel="noreferrer"
            style={{ color: C.accent }}>developer.twitter.com</a>{" "}
          → ton App → <strong style={{ color: C.text }}>Keys and Tokens</strong>.
        </p>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
          Active le mode <strong style={{ color: C.text }}>Read and Write</strong> dans les permissions.
        </p>
      </div>
      {fields.map((f) => (
        <div key={f.k}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>
            {f.label}
          </label>
          <input
            type="password"
            placeholder={`Colle ton ${f.label}`}
            value={keys[f.k] || ""}
            onChange={(e) => setKeys((p) => ({ ...p, [f.k]: e.target.value }))}
            style={{
              width: "100%", background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "13px 14px", color: C.text, fontSize: 14,
              outline: "none", boxSizing: "border-box", fontFamily: "inherit",
            }}
          />
        </div>
      ))}
      <button
        onClick={onSave}
        style={{
          background: C.accent, color: "#fff", border: "none", borderRadius: 12,
          padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer",
          marginTop: 4, fontFamily: "inherit",
        }}
      >
        Enregistrer les clés
      </button>
    </div>
  );
}

function EcranRepost({ keys, options, addToHistory }) {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [status, setStatus] = useState(null);

  const hasKeys = ["apiKey", "apiSecret", "accessToken", "accessTokenSecret"].every((k) => keys[k]);

  async function handleReformulate() {
    if (!original.trim()) return;
    setLoading(true); setStatus(null);
    try {
      const instructions = [
        "Traduis et reformule légèrement ce tweet en français.",
        "Garde le même sens mais change la structure pour que ça paraisse original.",
        options.tone === "pro" && "Ton professionnel et soigné.",
        options.tone === "casual" && "Ton décontracté et naturel.",
        options.tone === "punchy" && "Ton percutant et direct.",
        options.addHashtags && "Ajoute 2-3 hashtags pertinents en français.",
        options.addEmoji && "Ajoute 1-2 emojis bien placés.",
        "Réponds UNIQUEMENT avec le texte du tweet, sans guillemets ni explication. Max 280 caractères.",
      ].filter(Boolean).join(" ");

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: `${instructions}\n\nTweet original:\n"${original}"` }],
        }),
      });
      const data = await res.json();
      setModified(data.content?.[0]?.text?.trim() || "");
    } catch { setStatus({ type: "error", msg: "Erreur IA. Vérifie ta connexion." }); }
    setLoading(false);
  }

  async function handlePost() {
    if (!modified.trim() || !hasKeys) return;
    setPosting(true); setStatus(null);
    try {
      const res = await fetch("/api/tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: modified, ...keys }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      addToHistory({ original: original.slice(0, 80), posted: modified, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) });
      setStatus({ type: "success", msg: "Tweet publié !" });
      setOriginal(""); setModified("");
    } catch (e) { setStatus({ type: "error", msg: e.message || "Erreur lors du post." }); }
    setPosting(false);
  }

  const over = modified.length > 280;

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      {!hasKeys && (
        <div style={{
          background: `${C.danger}12`, border: `1px solid ${C.danger}40`,
          borderRadius: 10, padding: "12px 14px", fontSize: 13, color: C.danger,
        }}>
          ⚠️ Configure tes clés Twitter dans l'onglet Réglages d'abord.
        </div>
      )}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>
          TWEET ORIGINAL
        </label>
        <textarea
          placeholder="Colle le texte du tweet que tu veux reposter…"
          value={original}
          onChange={(e) => setOriginal(e.target.value)}
          style={{
            width: "100%", background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "13px 14px", color: C.text, fontSize: 15,
            outline: "none", boxSizing: "border-box", resize: "none",
            minHeight: 110, fontFamily: "inherit", lineHeight: 1.6,
          }}
        />
      </div>
      <button
        onClick={handleReformulate}
        disabled={loading || !original.trim()}
        style={{
          background: C.accent, color: "#fff", border: "none", borderRadius: 12,
          padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer",
          opacity: loading || !original.trim() ? 0.5 : 1, fontFamily: "inherit",
        }}
      >
        {loading ? "✨ Génération en cours…" : "✨ Reformuler en français"}
      </button>
      {modified && (
        <>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>
              APERÇU — tu peux encore modifier
            </label>
            <textarea
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              style={{
                width: "100%", background: C.surface,
                border: `1px solid ${over ? C.danger : C.accent}50`,
                borderRadius: 10, padding: "13px 14px", color: C.text, fontSize: 15,
                outline: "none", boxSizing: "border-box", resize: "none",
                minHeight: 120, fontFamily: "inherit", lineHeight: 1.6,
              }}
            />
            <div style={{ textAlign: "right", fontSize: 12, color: over ? C.danger : C.muted, marginTop: 4 }}>
              {modified.length} / 280
            </div>
          </div>
          <button
            onClick={handlePost}
            disabled={posting || over || !hasKeys}
            style={{
              background: C.green, color: "#000", border: "none", borderRadius: 12,
              padding: "15px", fontWeight: 800, fontSize: 16, cursor: "pointer",
              opacity: posting || over || !hasKeys ? 0.45 : 1, fontFamily: "inherit",
            }}
          >
            {posting ? "Publication…" : "🚀 Publier sur Twitter / X"}
          </button>
        </>
      )}
      <StatusMsg type={status?.type} msg={status?.msg} />
    </div>
  );
}

function EcranOptions({ options, setOptions }) {
  const tones = [
    { v: "casual", l: "Décontracté" },
    { v: "pro", l: "Professionnel" },
    { v: "punchy", l: "Percutant" },
  ];
  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 10 }}>
          TON DU TEXTE
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {tones.map((t) => (
            <button key={t.v} onClick={() => setOptions((o) => ({ ...o, tone: t.v }))}
              style={{
                flex: 1, padding: "11px 0", border: `1px solid ${options.tone === t.v ? C.accent + "80" : C.border}`,
                borderRadius: 10, background: options.tone === t.v ? C.accentDim : "transparent",
                color: options.tone === t.v ? C.accent : C.muted,
                fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>
      {[
        { key: "addHashtags", label: "Hashtags automatiques", desc: "Ajoute 2-3 hashtags en français" },
        { key: "addEmoji", label: "Emojis", desc: "Ajoute 1-2 emojis pour dynamiser" },
      ].map((item) => (
        <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
          <div>
            <div style={{ fontSize: 15, color: C.text, fontWeight: 500 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{item.desc}</div>
          </div>
          <Toggle value={options[item.key]} onChange={(v) => setOptions((o) => ({ ...o, [item.key]: v }))} />
        </div>
      ))}
    </div>
  );
}

function EcranHistorique({ history }) {
  if (!history.length) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.muted, fontSize: 14 }}>
        Aucun repost pour l'instant.<br />
        <span style={{ fontSize: 12, marginTop: 6, display: "block" }}>
          Tes publications apparaîtront ici.
        </span>
      </div>
    );
  }
  return (
    <div style={{ padding: "12px 16px" }}>
      {history.map((item, i) => (
        <div key={item.id} style={{
          padding: "16px 0",
          borderBottom: i < history.length - 1 ? `1px solid ${C.border}` : "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{
              background: C.greenDim, color: C.green,
              border: `1px solid ${C.green}30`, borderRadius: 6,
              padding: "2px 8px", fontSize: 11, fontWeight: 700,
            }}>✓ Publié</span>
            <span style={{ fontSize: 11, color: C.muted }}>{item.time}</span>
          </div>
          <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 6 }}>{item.posted}</div>
          <div style={{ fontSize: 12, color: C.muted }}>Original : {item.original}{item.original.length >= 80 ? "…" : ""}</div>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: "repost", label: "Repost", icon: "🔁" },
  { id: "options", label: "Options", icon: "⚙️" },
  { id: "historique", label: "Historique", icon: "📋" },
  { id: "config", label: "Réglages", icon: "🔑" },
];

export default function App() {
  const [tab, setTab] = useState("repost");
  const [keys, setKeys] = useState({ apiKey: "", apiSecret: "", accessToken: "", accessTokenSecret: "" });
  const [options, setOptions] = useState({ tone: "casual", addHashtags: true, addEmoji: false });
  const [history, setHistory] = useState([]);
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("repostai_keys");
      if (saved) setKeys(JSON.parse(saved));
    } catch {}
  }, []);

  function handleSaveKeys() {
    try { localStorage.setItem("repostai_keys", JSON.stringify(keys)); } catch {}
    setConfigSaved(true);
    setTimeout(() => { setConfigSaved(false); setTab("repost"); }, 1200);
  }

  function addToHistory(item) {
    setHistory((h) => [{ ...item, id: Date.now() }, ...h.slice(0, 29)]);
  }

  const hasKeys = ["apiKey", "apiSecret", "accessToken", "accessTokenSecret"].every((k) => keys[k]);

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderBottom: `1px solid ${C.border}`,
        position: "sticky", top: 0, background: C.bg, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 18 }}>
          <XIcon />
          RepostAI
        </div>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: hasKeys ? C.green : C.danger,
          boxShadow: `0 0 8px ${hasKeys ? C.green : C.danger}`,
        }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {tab === "repost" && <EcranRepost keys={keys} options={options} addToHistory={addToHistory} />}
        {tab === "options" && <EcranOptions options={options} setOptions={setOptions} />}
        {tab === "historique" && <EcranHistorique history={history} />}
        {tab === "config" && (
          <>
            <EcranConfig keys={keys} setKeys={setKeys} onSave={handleSaveKeys} />
            {configSaved && <StatusMsg type="success" msg="Clés sauvegardées !" />}
          </>
        )}
      </div>
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        display: "flex", background: C.surface,
        borderTop: `1px solid ${C.border}`, zIndex: 20,
      }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "12px 0 14px", border: "none", background: "transparent",
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3,
            }}
          >
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: tab === t.id ? C.accent : C.muted,
              fontFamily: "inherit",
            }}>{t.label}</span>
            {tab === t.id && (
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.accent, marginTop: 1 }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
