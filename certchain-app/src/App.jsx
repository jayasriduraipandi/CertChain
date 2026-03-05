import { useState, useEffect, useCallback, useRef } from "react";

const FONTS_LINK = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap";

// Simulated blockchain state
const INITIAL_CHAIN = [
  {
    blockIndex: 0,
    prevHash: "0x0000000000000000",
    hash: "0x3f4a8b2c1d9e7f6a",
    certId: "CERT-IIT-2024-001",
    studentName: "Aarav Sharma",
    degree: "B.Tech Computer Science",
    university: "IIT Bombay",
    cgpa: "9.2",
    issueDate: "2024-06-15",
    status: "VALID",
    issuerSig: "Ed25519::0xab12...f4e9",
    revokeReason: null,
  },
  {
    blockIndex: 1,
    prevHash: "0x3f4a8b2c1d9e7f6a",
    hash: "0xa1b2c3d4e5f6a7b8",
    certId: "CERT-BITS-2023-047",
    studentName: "Priya Nair",
    degree: "M.Sc Data Science",
    university: "BITS Pilani",
    cgpa: "8.7",
    issueDate: "2023-11-20",
    status: "VALID",
    issuerSig: "Ed25519::0xcd34...a1b2",
    revokeReason: null,
  },
  {
    blockIndex: 2,
    prevHash: "0xa1b2c3d4e5f6a7b8",
    hash: "0xd7e8f9a0b1c2d3e4",
    certId: "CERT-VIT-2022-112",
    studentName: "Ravi Kumar",
    degree: "B.Tech Mechanical Eng.",
    university: "VIT University",
    cgpa: "7.5",
    issueDate: "2022-09-01",
    status: "REVOKED",
    issuerSig: "Ed25519::0xef56...c3d4",
    revokeReason: "Academic Misconduct",
  },
];

const INITIAL_AUDIT = [
  { timestamp: "2024-06-15 09:02", action: "ISSUED", actor: "IIT Bombay Registrar", certId: "CERT-IIT-2024-001", blockHash: "0x3f4a8b2c1d9e7f6a" },
  { timestamp: "2024-08-20 14:35", action: "VERIFIED", actor: "Infosys HR Portal", certId: "CERT-IIT-2024-001", blockHash: "0x3f4a8b2c1d9e7f6a" },
  { timestamp: "2023-11-20 10:14", action: "ISSUED", actor: "BITS Pilani Registrar", certId: "CERT-BITS-2023-047", blockHash: "0xa1b2c3d4e5f6a7b8" },
  { timestamp: "2024-01-05 11:20", action: "VERIFIED", actor: "Google Recruitment", certId: "CERT-BITS-2023-047", blockHash: "0xa1b2c3d4e5f6a7b8" },
  { timestamp: "2023-03-01 16:55", action: "REVOKED", actor: "VIT University Admin", certId: "CERT-VIT-2022-112", blockHash: "0xd7e8f9a0b1c2d3e4" },
];

const UNIVERSITIES = ["IIT Bombay", "BITS Pilani", "VIT University", "Sri Krishna Arts & Science College", "Anna University"];
const DEGREES = ["B.Tech Computer Science", "M.Sc Data Science", "B.Tech Mechanical Eng.", "B.Com Honours", "M.Tech AI & ML", "B.Sc Mathematics"];

function generateHash() {
  const chars = "0123456789abcdef";
  let h = "0x";
  for (let i = 0; i < 16; i++) h += chars[Math.floor(Math.random() * 16)];
  return h;
}

function generateSig() {
  const chars = "0123456789abcdef";
  let s = "Ed25519::0x";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * 16)];
  s += "...";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

function generateCertId(uni) {
  const prefix = uni.split(" ").map(w => w[0]).join("").toUpperCase();
  const yr = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `CERT-${prefix}-${yr}-${num}`;
}

// QR Code SVG Generator (simplified)
function QRCodeSVG({ data, size = 160 }) {
  const modules = 21;
  const cellSize = size / modules;
  // Deterministic pattern from data string
  const seed = data.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells = [];
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      const isFinderPattern =
        (r < 7 && c < 7) || (r < 7 && c >= modules - 7) || (r >= modules - 7 && c < 7);
      const isFinderInner =
        (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
        (r >= 2 && r <= 4 && c >= modules - 5 && c <= modules - 3) ||
        (r >= modules - 5 && r <= modules - 3 && c >= 2 && c <= 4);
      const isFinderBorder =
        isFinderPattern && !isFinderInner &&
        !(r === 1 && c >= 1 && c <= 5) && !(r === 5 && c >= 1 && c <= 5) &&
        !(c === 1 && r >= 1 && r <= 5) && !(c === 5 && r >= 1 && r <= 5);
      const hash = ((seed * (r * modules + c + 1) * 7 + 13) % 100);
      const filled = isFinderPattern ? (isFinderInner || (r === 0 || r === 6 || c === 0 || c === 6 ||
        c === modules - 1 || c === modules - 7 || r === modules - 1 || r === modules - 7)) : hash < 45;
      if (filled) {
        cells.push(
          <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize}
            width={cellSize} height={cellSize} fill="#0ff" rx={0.5} />
        );
      }
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ background: "#0a0e1a", borderRadius: 8, border: "1px solid rgba(0,255,255,0.2)" }}>
      {cells}
    </svg>
  );
}

// Animated blockchain visualization
function BlockchainViz({ chain }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", padding: "16px 0" }}>
      {chain.slice(-4).map((block, i) => (
        <div key={block.certId} style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            background: block.status === "REVOKED"
              ? "linear-gradient(135deg, #1a0a0a, #2a0f0f)"
              : "linear-gradient(135deg, #0a1a2a, #0f1e30)",
            border: `1px solid ${block.status === "REVOKED" ? "rgba(255,60,60,0.4)" : "rgba(0,255,255,0.25)"}`,
            borderRadius: 10, padding: "12px 16px", minWidth: 170,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            animation: `fadeSlideIn 0.5s ease ${i * 0.15}s both`
          }}>
            <div style={{ color: "#0ff", fontWeight: 700, marginBottom: 4, fontSize: 11 }}>
              Block #{block.blockIndex}
            </div>
            <div style={{ color: "#8af", marginBottom: 2 }}>{block.certId}</div>
            <div style={{ color: "#ccc", marginBottom: 2 }}>{block.studentName}</div>
            <div style={{
              color: block.status === "VALID" ? "#0f6" : "#f44",
              fontWeight: 600, fontSize: 11
            }}>
              ● {block.status}
            </div>
            <div style={{ color: "#556", marginTop: 4, fontSize: 9 }}>{block.hash}</div>
          </div>
          {i < chain.slice(-4).length - 1 && (
            <div style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
              <svg width="32" height="20" viewBox="0 0 32 20">
                <line x1="0" y1="10" x2="24" y2="10" stroke="#0ff" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="24,5 32,10 24,15" fill="#0ff" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Particle background
function ParticleBG() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 8,
    duration: Math.random() * 6 + 4,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          borderRadius: "50%",
          background: "rgba(0,255,255,0.3)",
          animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
        }} />
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    VALID: { bg: "rgba(0,255,100,0.12)", border: "rgba(0,255,100,0.35)", text: "#0f6" },
    REVOKED: { bg: "rgba(255,60,60,0.12)", border: "rgba(255,60,60,0.35)", text: "#f44" },
    ISSUED: { bg: "rgba(0,180,255,0.12)", border: "rgba(0,180,255,0.35)", text: "#0bf" },
    VERIFIED: { bg: "rgba(180,140,255,0.12)", border: "rgba(180,140,255,0.35)", text: "#b8f" },
  };
  const c = colors[status] || colors.VALID;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.text, padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace"
    }}>
      ● {status}
    </span>
  );
}

// ============ MAIN APP ============
export default function CertChainApp() {
  const [activeRole, setActiveRole] = useState("university");
  const [activeTab, setActiveTab] = useState("issue");
  const [chain, setChain] = useState(INITIAL_CHAIN);
  const [audit, setAudit] = useState(INITIAL_AUDIT);
  const [notification, setNotification] = useState(null);

  // University Issue Form
  const [issueForm, setIssueForm] = useState({
    studentName: "", degree: DEGREES[0], university: UNIVERSITIES[0], cgpa: "",
  });
  const [issuingState, setIssuingState] = useState(null); // null | 'signing' | 'hashing' | 'mining' | 'done'
  const [lastIssued, setLastIssued] = useState(null);

  // Employer Verify
  const [verifyCertId, setVerifyCertId] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Revocation
  const [revokeCertId, setRevokeCertId] = useState("");
  const [revokeReason, setRevokeReason] = useState("Academic Misconduct");
  const [revokeAdmins, setRevokeAdmins] = useState([false, false, false]);
  const [revoking, setRevoking] = useState(false);

  // Student wallet
  const [selectedCert, setSelectedCert] = useState(null);

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Issue certificate
  const handleIssue = async () => {
    if (!issueForm.studentName || !issueForm.cgpa) { showNotif("Fill all fields", "error"); return; }
    const cgpaNum = parseFloat(issueForm.cgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) { showNotif("CGPA must be 0-10", "error"); return; }

    setIssuingState("signing");
    await new Promise(r => setTimeout(r, 1200));
    setIssuingState("hashing");
    await new Promise(r => setTimeout(r, 1000));
    setIssuingState("mining");
    await new Promise(r => setTimeout(r, 1500));

    const newBlock = {
      blockIndex: chain.length,
      prevHash: chain[chain.length - 1].hash,
      hash: generateHash(),
      certId: generateCertId(issueForm.university),
      studentName: issueForm.studentName,
      degree: issueForm.degree,
      university: issueForm.university,
      cgpa: issueForm.cgpa,
      issueDate: new Date().toISOString().split("T")[0],
      status: "VALID",
      issuerSig: generateSig(),
      revokeReason: null,
    };

    setChain(prev => [...prev, newBlock]);
    setAudit(prev => [{
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      action: "ISSUED",
      actor: `${issueForm.university} Registrar`,
      certId: newBlock.certId,
      blockHash: newBlock.hash,
    }, ...prev]);

    setLastIssued(newBlock);
    setIssuingState("done");
    showNotif(`Certificate ${newBlock.certId} minted on-chain!`);
    setIssueForm({ studentName: "", degree: DEGREES[0], university: issueForm.university, cgpa: "" });
  };

  // Verify certificate
  const handleVerify = async () => {
    if (!verifyCertId.trim()) { showNotif("Enter a Certificate ID", "error"); return; }
    setVerifying(true);
    setVerifyResult(null);
    await new Promise(r => setTimeout(r, 1800));
    const found = chain.find(b => b.certId.toLowerCase() === verifyCertId.trim().toLowerCase());
    setVerifyResult(found || "NOT_FOUND");
    setVerifying(false);
    if (found) {
      setAudit(prev => [{
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        action: "VERIFIED",
        actor: "Employer Portal",
        certId: found.certId,
        blockHash: found.hash,
      }, ...prev]);
    }
  };

  // Revoke certificate
  const handleRevoke = async () => {
    const signedCount = revokeAdmins.filter(Boolean).length;
    if (signedCount < 2) { showNotif("Need 2 of 3 admin signatures!", "error"); return; }
    const found = chain.find(b => b.certId.toLowerCase() === revokeCertId.trim().toLowerCase());
    if (!found) { showNotif("Certificate not found", "error"); return; }
    if (found.status === "REVOKED") { showNotif("Already revoked", "error"); return; }

    setRevoking(true);
    await new Promise(r => setTimeout(r, 2000));

    setChain(prev => prev.map(b =>
      b.certId === found.certId ? { ...b, status: "REVOKED", revokeReason: revokeReason } : b
    ));
    setAudit(prev => [{
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      action: "REVOKED",
      actor: `${found.university} Admin (Multi-Sig 2/3)`,
      certId: found.certId,
      blockHash: found.hash,
    }, ...prev]);

    setRevoking(false);
    showNotif(`Certificate ${found.certId} REVOKED on-chain`, "error");
    setRevokeCertId("");
    setRevokeAdmins([false, false, false]);
  };

  const roleConfig = {
    university: { icon: "🏛", label: "University", color: "#0ff", tabs: ["issue", "revoke", "chain"] },
    student: { icon: "🎓", label: "Student", color: "#b8f", tabs: ["wallet", "chain"] },
    employer: { icon: "💼", label: "Employer", color: "#0f6", tabs: ["verify", "audit"] },
  };

  const tabLabels = {
    issue: "Issue Certificate", revoke: "Revoke", chain: "Blockchain",
    wallet: "My Wallet", verify: "Verify Certificate", audit: "Audit Trail",
  };

  useEffect(() => {
    setActiveTab(roleConfig[activeRole].tabs[0]);
    setVerifyResult(null);
    setIssuingState(null);
    setLastIssued(null);
    setSelectedCert(null);
  }, [activeRole]);

  const inputStyle = {
    background: "rgba(0,255,255,0.04)", border: "1px solid rgba(0,255,255,0.15)",
    borderRadius: 8, padding: "10px 14px", color: "#e0e8f0",
    fontFamily: "'Outfit', sans-serif", fontSize: 14, outline: "none", width: "100%",
    transition: "border-color 0.2s",
  };

  const btnPrimary = {
    background: "linear-gradient(135deg, #00bcd4, #0097a7)",
    border: "none", borderRadius: 8, padding: "12px 28px",
    color: "#fff", fontFamily: "'Outfit', sans-serif", fontWeight: 600,
    fontSize: 14, cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 4px 20px rgba(0,188,212,0.3)",
  };

  return (
    <>
      <link href={FONTS_LINK} rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { from { transform: translateY(0) scale(1); opacity:0.3; } to { transform: translateY(-20px) scale(1.5); opacity:0.1; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scanLine { 0% { top:0; } 100% { top:100%; } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 8px rgba(0,255,255,0.2); } 50% { box-shadow: 0 0 24px rgba(0,255,255,0.5); } }
        input:focus, select:focus { border-color: rgba(0,255,255,0.5) !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,255,0.2); border-radius: 3px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #060b18 0%, #0a1628 40%, #0d1a2d 70%, #081020 100%)",
        fontFamily: "'Outfit', sans-serif", color: "#c8d6e5", position: "relative",
      }}>
        <ParticleBG />

        {/* Notification */}
        {notification && (
          <div style={{
            position: "fixed", top: 20, right: 20, zIndex: 1000,
            background: notification.type === "error"
              ? "linear-gradient(135deg, #2a0f0f, #1a0808)"
              : "linear-gradient(135deg, #0a2a1a, #081f14)",
            border: `1px solid ${notification.type === "error" ? "rgba(255,60,60,0.4)" : "rgba(0,255,100,0.4)"}`,
            borderRadius: 12, padding: "14px 22px",
            color: notification.type === "error" ? "#f88" : "#8f8",
            fontWeight: 500, fontSize: 13,
            animation: "slideDown 0.3s ease",
            boxShadow: `0 8px 32px ${notification.type === "error" ? "rgba(255,0,0,0.15)" : "rgba(0,255,100,0.15)"}`,
          }}>
            {notification.type === "error" ? "✕" : "✓"} {notification.msg}
          </div>
        )}

        {/* Header */}
        <header style={{
          position: "relative", zIndex: 1,
          borderBottom: "1px solid rgba(0,255,255,0.08)",
          padding: "16px 24px",
          background: "rgba(6,11,24,0.8)",
          backdropFilter: "blur(20px)",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: "linear-gradient(135deg, #0ff, #0097a7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, color: "#060b18",
              }}>⛓</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: -0.5, lineHeight: 1.1 }}>
                  CERT<span style={{ color: "#0ff" }}>CHAIN</span>
                </div>
                <div style={{ fontSize: 9, color: "#5a7a9a", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2 }}>
                  BLOCKCHAIN VERIFICATION PROTOTYPE
                </div>
              </div>
            </div>

            {/* Role Switcher */}
            <div style={{ display: "flex", gap: 6, background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 4 }}>
              {Object.entries(roleConfig).map(([key, val]) => (
                <button key={key} onClick={() => setActiveRole(key)} style={{
                  background: activeRole === key ? `linear-gradient(135deg, ${val.color}22, ${val.color}11)` : "transparent",
                  border: activeRole === key ? `1px solid ${val.color}44` : "1px solid transparent",
                  borderRadius: 8, padding: "8px 16px",
                  color: activeRole === key ? val.color : "#5a7a9a",
                  fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 13,
                  cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span>{val.icon}</span> {val.label}
                </button>
              ))}
            </div>

            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#3a5a7a",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0f6", display: "inline-block", animation: "pulse 2s infinite" }} />
              3 Validator Nodes Online
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div style={{ position: "relative", zIndex: 1, borderBottom: "1px solid rgba(0,255,255,0.06)", background: "rgba(6,11,24,0.5)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", gap: 4 }}>
            {roleConfig[activeRole].tabs.map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setVerifyResult(null); setIssuingState(null); }} style={{
                background: "transparent",
                border: "none", borderBottom: activeTab === tab ? `2px solid ${roleConfig[activeRole].color}` : "2px solid transparent",
                padding: "12px 18px", color: activeTab === tab ? "#fff" : "#5a7a9a",
                fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: 13,
                cursor: "pointer", transition: "all 0.2s",
              }}>
                {tabLabels[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

          {/* ====== ISSUE CERTIFICATE ====== */}
          {activeTab === "issue" && (
            <div style={{ animation: "fadeSlideIn 0.4s ease" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                Issue Digital Certificate
              </h2>
              <p style={{ color: "#5a7a9a", fontSize: 13, marginBottom: 24 }}>
                Sign & mint a tamper-proof certificate as a blockchain record (ERC-721 NFT)
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Form */}
                <div style={{
                  background: "rgba(0,20,40,0.5)", border: "1px solid rgba(0,255,255,0.08)",
                  borderRadius: 14, padding: 24,
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#5a9aba", fontWeight: 600, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Student Full Name</label>
                      <input style={inputStyle} placeholder="e.g. Aarav Sharma" value={issueForm.studentName}
                        onChange={e => setIssueForm(p => ({ ...p, studentName: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#5a9aba", fontWeight: 600, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Issuing University</label>
                      <select style={{ ...inputStyle, cursor: "pointer" }} value={issueForm.university}
                        onChange={e => setIssueForm(p => ({ ...p, university: e.target.value }))}>
                        {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#5a9aba", fontWeight: 600, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Degree Programme</label>
                      <select style={{ ...inputStyle, cursor: "pointer" }} value={issueForm.degree}
                        onChange={e => setIssueForm(p => ({ ...p, degree: e.target.value }))}>
                        {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#5a9aba", fontWeight: 600, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>CGPA (0-10)</label>
                      <input style={inputStyle} type="number" step="0.1" min="0" max="10" placeholder="e.g. 8.5"
                        value={issueForm.cgpa}
                        onChange={e => setIssueForm(p => ({ ...p, cgpa: e.target.value }))} />
                    </div>
                    <button onClick={handleIssue} disabled={issuingState && issuingState !== "done"}
                      style={{
                        ...btnPrimary, opacity: issuingState && issuingState !== "done" ? 0.5 : 1,
                        marginTop: 4,
                      }}>
                      {issuingState === null || issuingState === "done" ? "⛓ Sign & Mint Certificate" : "Processing..."}
                    </button>
                  </div>
                </div>

                {/* Signing Process / Result */}
                <div style={{
                  background: "rgba(0,20,40,0.5)", border: "1px solid rgba(0,255,255,0.08)",
                  borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", justifyContent: "center",
                }}>
                  {!issuingState && !lastIssued && (
                    <div style={{ textAlign: "center", color: "#3a5a7a" }}>
                      <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>⛓</div>
                      <div style={{ fontSize: 14 }}>Fill the form and mint a certificate</div>
                      <div style={{ fontSize: 11, marginTop: 6 }}>
                        Digital signature → SHA-3 hash → Consensus → Block minted
                      </div>
                    </div>
                  )}

                  {issuingState && issuingState !== "done" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
                      {["signing", "hashing", "mining"].map((step, i) => {
                        const labels = ["Ed25519 Digital Signing...", "SHA-3/Keccak-256 Hashing...", "Broadcasting to Validator Nodes..."];
                        const icons = ["🔐", "#️⃣", "⛏"];
                        const active = step === issuingState;
                        const done = ["signing", "hashing", "mining"].indexOf(issuingState) > i;
                        return (
                          <div key={step} style={{
                            display: "flex", alignItems: "center", gap: 12, width: "100%",
                            padding: "12px 16px", borderRadius: 10,
                            background: active ? "rgba(0,255,255,0.06)" : "transparent",
                            border: active ? "1px solid rgba(0,255,255,0.2)" : "1px solid transparent",
                            opacity: done ? 0.5 : active ? 1 : 0.3,
                            transition: "all 0.3s",
                          }}>
                            <span style={{ fontSize: 20 }}>{done ? "✅" : icons[i]}</span>
                            <span style={{ fontWeight: 500, color: active ? "#0ff" : "#88a" }}>{labels[i]}</span>
                            {active && <span style={{ marginLeft: "auto", width: 16, height: 16, border: "2px solid #0ff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {issuingState === "done" && lastIssued && (
                    <div style={{ animation: "fadeSlideIn 0.4s ease", textAlign: "center" }}>
                      <div style={{ fontSize: 14, color: "#0f6", fontWeight: 700, marginBottom: 12 }}>
                        ✓ Certificate Minted Successfully
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                        <QRCodeSVG data={lastIssued.certId} size={130} />
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#0ff", marginBottom: 6 }}>
                        {lastIssued.certId}
                      </div>
                      <div style={{ fontSize: 12, color: "#8aa" }}>
                        Block #{lastIssued.blockIndex} • {lastIssued.hash}
                      </div>
                      <div style={{ fontSize: 11, color: "#5a7a9a", marginTop: 8 }}>
                        Sig: {lastIssued.issuerSig}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ====== VERIFY CERTIFICATE ====== */}
          {activeTab === "verify" && (
            <div style={{ animation: "fadeSlideIn 0.4s ease" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                Verify Certificate
              </h2>
              <p style={{ color: "#5a7a9a", fontSize: 13, marginBottom: 24 }}>
                Scan QR code or enter Certificate ID — blockchain lookup in under 2 seconds
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Input */}
                <div style={{
                  background: "rgba(0,20,40,0.5)", border: "1px solid rgba(0,255,255,0.08)",
                  borderRadius: 14, padding: 24,
                }}>
                  <label style={{ fontSize: 11, color: "#5a9aba", fontWeight: 600, marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>
                    Certificate ID / QR Data
                  </label>
                  <input style={{ ...inputStyle, marginBottom: 12 }}
                    placeholder="e.g. CERT-IIT-2024-001"
                    value={verifyCertId}
                    onChange={e => setVerifyCertId(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleVerify()}
                  />

                  <div style={{ fontSize: 11, color: "#3a5a7a", marginBottom: 16 }}>
                    Try: CERT-IIT-2024-001 (valid) or CERT-VIT-2022-112 (revoked)
                  </div>

                  <button onClick={handleVerify} disabled={verifying} style={{
                    ...btnPrimary, width: "100%",
                    background: "linear-gradient(135deg, #00c853, #009624)",
                    boxShadow: "0 4px 20px rgba(0,200,83,0.3)",
                    opacity: verifying ? 0.6 : 1,
                  }}>
                    {verifying ? "Querying Blockchain..." : "🔍 Verify on Blockchain"}
                  </button>

                  {/* Simulated QR scanner */}
                  <div style={{
                    marginTop: 20, borderRadius: 12, overflow: "hidden",
                    border: "1px solid rgba(0,255,255,0.1)",
                    background: "#000", height: 160, position: "relative",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{
                      position: "absolute", left: 0, right: 0, height: 2,
                      background: "linear-gradient(90deg, transparent, #0f6, transparent)",
                      animation: "scanLine 2s linear infinite",
                    }} />
                    <div style={{
                      width: 80, height: 80, border: "2px solid rgba(0,255,100,0.4)",
                      borderRadius: 8, position: "relative",
                    }}>
                      <div style={{ position: "absolute", top: -1, left: -1, width: 14, height: 14, borderTop: "3px solid #0f6", borderLeft: "3px solid #0f6" }} />
                      <div style={{ position: "absolute", top: -1, right: -1, width: 14, height: 14, borderTop: "3px solid #0f6", borderRight: "3px solid #0f6" }} />
                      <div style={{ position: "absolute", bottom: -1, left: -1, width: 14, height: 14, borderBottom: "3px solid #0f6", borderLeft: "3px solid #0f6" }} />
                      <div style={{ position: "absolute", bottom: -1, right: -1, width: 14, height: 14, borderBottom: "3px solid #0f6", borderRight: "3px solid #0f6" }} />
                    </div>
                    <div style={{ position: "absolute", bottom: 8, fontSize: 10, color: "#3a5a3a", fontFamily: "'JetBrains Mono', monospace" }}>
                      QR Scanner Simulation
                    </div>
                  </div>
                </div>

                {/* Result */}
                <div style={{
                  background: "rgba(0,20,40,0.5)", border: "1px solid rgba(0,255,255,0.08)",
                  borderRadius: 14, padding: 24,
                }}>
                  {!verifyResult && !verifying && (
                    <div style={{ textAlign: "center", color: "#3a5a7a", paddingTop: 60 }}>
                      <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>🔍</div>
                      <div>Enter a Certificate ID to verify</div>
                    </div>
                  )}

                  {verifying && (
                    <div style={{ textAlign: "center", paddingTop: 40 }}>
                      <div style={{ width: 48, height: 48, border: "3px solid rgba(0,255,100,0.2)", borderTopColor: "#0f6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                      <div style={{ color: "#0f6", fontWeight: 600, marginBottom: 6 }}>Querying Blockchain...</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#3a5a7a" }}>
                        Contacting 3 validator nodes...
                      </div>
                    </div>
                  )}

                  {verifyResult && verifyResult !== "NOT_FOUND" && (
                    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
                      <div style={{
                        textAlign: "center", padding: "16px 0", marginBottom: 16,
                        borderRadius: 10,
                        background: verifyResult.status === "VALID"
                          ? "rgba(0,255,100,0.06)" : "rgba(255,60,60,0.06)",
                        border: `1px solid ${verifyResult.status === "VALID" ? "rgba(0,255,100,0.2)" : "rgba(255,60,60,0.2)"}`,
                      }}>
                        <div style={{
                          fontSize: 28, fontWeight: 800,
                          color: verifyResult.status === "VALID" ? "#0f6" : "#f44",
                        }}>
                          {verifyResult.status === "VALID" ? "✓ VALID" : "✕ REVOKED"}
                        </div>
                        <div style={{ fontSize: 11, color: "#5a7a9a", marginTop: 4 }}>
                          Verified in 1.{Math.floor(Math.random() * 9)}s via 3 nodes
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                        <QRCodeSVG data={verifyResult.certId} size={100} />
                      </div>

                      <div style={{ display: "grid", gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                        {[
                          ["Cert ID", verifyResult.certId],
                          ["Student", verifyResult.studentName],
                          ["Degree", verifyResult.degree],
                          ["University", verifyResult.university],
                          ["CGPA", verifyResult.cgpa],
                          ["Issued", verifyResult.issueDate],
                          ["Block Hash", verifyResult.hash],
                          ["Signature", verifyResult.issuerSig],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <span style={{ color: "#5a7a9a" }}>{k}</span>
                            <span style={{ color: "#c8d6e5", textAlign: "right", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span>
                          </div>
                        ))}
                        {verifyResult.revokeReason && (
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                            <span style={{ color: "#f44" }}>Reason</span>
                            <span style={{ color: "#f88" }}>{verifyResult.revokeReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {verifyResult === "NOT_FOUND" && (
                    <div style={{ textAlign: "center", paddingTop: 50, animation: "fadeSlideIn 0.3s ease" }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                      <div style={{ color: "#fa0", fontWeight: 700, fontSize: 18 }}>NOT FOUND</div>
                      <div style={{ color: "#8a6a3a", fontSize: 12, marginTop: 6 }}>
                        This certificate does not exist on the blockchain.
                        <br />Possible forgery detected.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ====== STUDENT WALLET ====== */}
          {activeTab === "wallet" && (
            <div style={{ animation: "fadeSlideIn 0.4s ease" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                My Digital Wallet
              </h2>
              <p style={{ color: "#5a7a9a", fontSize: 13, marginBottom: 24 }}>
                Your credentials are stored as NFTs — share via QR or NFC tap
              </p>

              <div style={{ display: "grid", gridTemplateColumns: selectedCert ? "1fr 1fr" : "1fr", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {chain.filter(b => b.status === "VALID").map(cert => (
                    <div key={cert.certId} onClick={() => setSelectedCert(cert)} style={{
                      background: selectedCert?.certId === cert.certId
                        ? "rgba(180,140,255,0.08)" : "rgba(0,20,40,0.5)",
                      border: selectedCert?.certId === cert.certId
                        ? "1px solid rgba(180,140,255,0.3)" : "1px solid rgba(0,255,255,0.08)",
                      borderRadius: 14, padding: 18, cursor: "pointer",
                      transition: "all 0.2s",
                      animation: selectedCert?.certId === cert.certId ? "glow 2s infinite" : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{cert.degree}</div>
                          <div style={{ fontSize: 12, color: "#8aa", marginTop: 2 }}>{cert.university}</div>
                        </div>
                        <StatusBadge status={cert.status} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#5a7a9a" }}>
                        <span>{cert.certId}</span>
                        <span>CGPA: {cert.cgpa}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedCert && (
                  <div style={{
                    background: "rgba(0,20,40,0.5)", border: "1px solid rgba(180,140,255,0.15)",
                    borderRadius: 14, padding: 24, textAlign: "center",
                    animation: "fadeSlideIn 0.3s ease",
                  }}>
                    <div style={{ fontSize: 13, color: "#b8f", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                      Share Certificate
                    </div>
                    <div style={{ fontSize: 12, color: "#5a7a9a", marginBottom: 20 }}>
                      Scan this QR or tap NFC to verify
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                      <QRCodeSVG data={selectedCert.certId} size={180} />
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#0ff", marginBottom: 12 }}>
                      {selectedCert.certId}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{selectedCert.studentName}</div>
                    <div style={{ fontSize: 13, color: "#8aa", marginTop: 2 }}>{selectedCert.degree}</div>
                    <div style={{ fontSize: 12, color: "#5a7a9a", marginTop: 2 }}>{selectedCert.university} • {selectedCert.issueDate}</div>
                    <div style={{
                      display: "flex", gap: 8, justifyContent: "center", marginTop: 20,
                    }}>
                      <button style={{
                        background: "rgba(180,140,255,0.1)", border: "1px solid rgba(180,140,255,0.3)",
                        borderRadius: 8, padding: "8px 18px", color: "#b8f",
                        fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: 12, cursor: "pointer",
                      }}>📱 Share QR</button>
                      <button style={{
                        background: "rgba(0,255,255,0.1)", border: "1px solid rgba(0,255,255,0.3)",
                        borderRadius: 8, padding: "8px 18px", color: "#0ff",
                        fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: 12, cursor: "pointer",
                      }}>📡 NFC Tap</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ====== REVOKE CERTIFICATE ====== */}
          {activeTab === "revoke" && (
            <div style={{ animation: "fadeSlideIn 0.4s ease" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                Revoke Certificate
              </h2>
              <p style={{ color: "#5a7a9a", fontSize: 13, marginBottom: 24 }}>
                Multi-signature revocation — requires 2 of 3 admin keys
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{
                  background: "rgba(40,10,10,0.4)", border: "1px solid rgba(255,60,60,0.12)",
                  borderRadius: 14, padding: 24,
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#a05a5a", fontWeight: 600, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Certificate ID to Revoke</label>
                      <input style={{ ...inputStyle, borderColor: "rgba(255,60,60,0.15)" }}
                        placeholder="e.g. CERT-IIT-2024-001"
                        value={revokeCertId}
                        onChange={e => setRevokeCertId(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#a05a5a", fontWeight: 600, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Reason Code</label>
                      <select style={{ ...inputStyle, borderColor: "rgba(255,60,60,0.15)", cursor: "pointer" }}
                        value={revokeReason} onChange={e => setRevokeReason(e.target.value)}>
                        {["Academic Misconduct", "Fraudulent Admission", "Degree Rescinded", "Administrative Error", "Court Order"].map(r =>
                          <option key={r} value={r}>{r}</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: "#a05a5a", fontWeight: 600, marginBottom: 10, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>
                        Multi-Signature Authorization ({revokeAdmins.filter(Boolean).length}/3 signed — need 2)
                      </label>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {["Registrar Key (Admin 1)", "Dean Key (Admin 2)", "Chancellor Key (Admin 3)"].map((label, i) => (
                          <label key={i} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                            background: revokeAdmins[i] ? "rgba(255,60,60,0.08)" : "rgba(0,0,0,0.2)",
                            border: `1px solid ${revokeAdmins[i] ? "rgba(255,60,60,0.3)" : "rgba(255,255,255,0.05)"}`,
                            transition: "all 0.2s",
                          }}>
                            <input type="checkbox" checked={revokeAdmins[i]}
                              onChange={() => setRevokeAdmins(prev => prev.map((v, j) => j === i ? !v : v))}
                              style={{ accentColor: "#f44" }} />
                            <span style={{ fontSize: 12, color: revokeAdmins[i] ? "#f88" : "#6a5a5a", fontWeight: 500 }}>
                              🔑 {label}
                            </span>
                            {revokeAdmins[i] && <span style={{ marginLeft: "auto", fontSize: 10, color: "#f44" }}>SIGNED</span>}
                          </label>
                        ))}
                      </div>
                    </div>

                    <button onClick={handleRevoke} disabled={revoking} style={{
                      ...btnPrimary,
                      background: revokeAdmins.filter(Boolean).length >= 2
                        ? "linear-gradient(135deg, #d32f2f, #b71c1c)"
                        : "rgba(100,40,40,0.5)",
                      boxShadow: revokeAdmins.filter(Boolean).length >= 2 ? "0 4px 20px rgba(211,47,47,0.3)" : "none",
                      opacity: revoking ? 0.6 : 1,
                      cursor: revokeAdmins.filter(Boolean).length >= 2 ? "pointer" : "not-allowed",
                    }}>
                      {revoking ? "Broadcasting Revocation..." : "⚠ Execute Multi-Sig Revocation"}
                    </button>
                  </div>
                </div>

                {/* Revocation visual */}
                <div style={{
                  background: "rgba(40,10,10,0.3)", border: "1px solid rgba(255,60,60,0.08)",
                  borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#6a4a4a", textTransform: "uppercase", letterSpacing: 2, marginBottom: 20 }}>
                      Revocation Security Model
                    </div>
                    <svg width="220" height="200" viewBox="0 0 220 200">
                      {/* Key nodes */}
                      {[
                        { x: 110, y: 30, label: "Admin 1", signed: revokeAdmins[0] },
                        { x: 40, y: 140, label: "Admin 2", signed: revokeAdmins[1] },
                        { x: 180, y: 140, label: "Admin 3", signed: revokeAdmins[2] },
                      ].map((node, i) => (
                        <g key={i}>
                          <line x1={110} y1={100} x2={node.x} y2={node.y}
                            stroke={node.signed ? "#f44" : "#2a1515"} strokeWidth={2} strokeDasharray={node.signed ? "" : "4 4"} />
                          <circle cx={node.x} cy={node.y} r={18}
                            fill={node.signed ? "rgba(255,60,60,0.2)" : "rgba(40,20,20,0.5)"}
                            stroke={node.signed ? "#f44" : "#3a2020"} strokeWidth={2} />
                          <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
                            fill={node.signed ? "#f88" : "#5a3a3a"} fontSize="10" fontFamily="Outfit">
                            🔑
                          </text>
                          <text x={node.x} y={node.y + 32} textAnchor="middle"
                            fill={node.signed ? "#f88" : "#4a3030"} fontSize="9" fontFamily="JetBrains Mono">
                            {node.label}
                          </text>
                        </g>
                      ))}
                      {/* Center */}
                      <circle cx={110} cy={100} r={22}
                        fill={revokeAdmins.filter(Boolean).length >= 2 ? "rgba(255,60,60,0.15)" : "rgba(30,15,15,0.5)"}
                        stroke={revokeAdmins.filter(Boolean).length >= 2 ? "#f44" : "#2a1515"} strokeWidth={2} />
                      <text x={110} y={96} textAnchor="middle" fill="#f88" fontSize="14">
                        {revokeAdmins.filter(Boolean).length >= 2 ? "✕" : "🔒"}
                      </text>
                      <text x={110} y={110} textAnchor="middle" fill="#6a4a4a" fontSize="8" fontFamily="JetBrains Mono">
                        {revokeAdmins.filter(Boolean).length}/3
                      </text>
                    </svg>
                    <div style={{ fontSize: 11, color: "#5a3a3a", marginTop: 8 }}>
                      {revokeAdmins.filter(Boolean).length < 2
                        ? `Need ${2 - revokeAdmins.filter(Boolean).length} more signature(s)`
                        : "✓ Threshold reached — ready to revoke"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====== BLOCKCHAIN EXPLORER ====== */}
          {activeTab === "chain" && (
            <div style={{ animation: "fadeSlideIn 0.4s ease" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                Blockchain Explorer
              </h2>
              <p style={{ color: "#5a7a9a", fontSize: 13, marginBottom: 16 }}>
                Live view of the CertChain — {chain.length} blocks minted
              </p>

              <div style={{
                background: "rgba(0,20,40,0.4)", border: "1px solid rgba(0,255,255,0.08)",
                borderRadius: 14, padding: 16, marginBottom: 20, overflowX: "auto",
              }}>
                <BlockchainViz chain={chain} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {chain.map(block => (
                  <div key={block.certId} style={{
                    background: "rgba(0,20,40,0.5)", border: "1px solid rgba(0,255,255,0.08)",
                    borderRadius: 12, padding: "14px 18px",
                    display: "grid", gridTemplateColumns: "60px 1fr 1fr 1fr auto", alignItems: "center", gap: 12,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                  }}>
                    <div style={{ color: "#0ff", fontWeight: 700 }}>#{block.blockIndex}</div>
                    <div>
                      <div style={{ color: "#fff", fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 13 }}>{block.studentName}</div>
                      <div style={{ color: "#5a7a9a" }}>{block.degree}</div>
                    </div>
                    <div>
                      <div style={{ color: "#8af" }}>{block.certId}</div>
                      <div style={{ color: "#3a5a7a", fontSize: 9 }}>{block.university}</div>
                    </div>
                    <div style={{ color: "#3a5a7a", fontSize: 9 }}>
                      <div>Hash: {block.hash}</div>
                      <div>Prev: {block.prevHash}</div>
                    </div>
                    <StatusBadge status={block.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====== AUDIT TRAIL ====== */}
          {activeTab === "audit" && (
            <div style={{ animation: "fadeSlideIn 0.4s ease" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                Immutable Audit Trail
              </h2>
              <p style={{ color: "#5a7a9a", fontSize: 13, marginBottom: 24 }}>
                Every action is permanently recorded on-chain — no record can be altered or deleted
              </p>

              <div style={{
                background: "rgba(0,20,40,0.5)", border: "1px solid rgba(0,255,255,0.08)",
                borderRadius: 14, overflow: "hidden",
              }}>
                {/* Header */}
                <div style={{
                  display: "grid", gridTemplateColumns: "140px 90px 1fr 160px 1fr",
                  gap: 12, padding: "12px 18px",
                  background: "rgba(0,0,0,0.3)",
                  borderBottom: "1px solid rgba(0,255,255,0.08)",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                  color: "#3a5a7a", textTransform: "uppercase", letterSpacing: 1,
                }}>
                  <div>Timestamp</div>
                  <div>Action</div>
                  <div>Actor</div>
                  <div>Cert ID</div>
                  <div>Block Hash</div>
                </div>

                {/* Rows */}
                {audit.map((entry, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "140px 90px 1fr 160px 1fr",
                    gap: 12, padding: "10px 18px",
                    borderBottom: "1px solid rgba(0,255,255,0.04)",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                    animation: `fadeSlideIn 0.3s ease ${i * 0.05}s both`,
                  }}>
                    <div style={{ color: "#5a7a9a" }}>{entry.timestamp}</div>
                    <div><StatusBadge status={entry.action} /></div>
                    <div style={{ color: "#c8d6e5", fontFamily: "'Outfit', sans-serif", fontSize: 12 }}>{entry.actor}</div>
                    <div style={{ color: "#8af" }}>{entry.certId}</div>
                    <div style={{ color: "#3a5a7a", fontSize: 9, overflow: "hidden", textOverflow: "ellipsis" }}>{entry.blockHash}</div>
                  </div>
                ))}
              </div>

              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20,
              }}>
                {[
                  { icon: "🔒", label: "Immutable", desc: "Cannot be edited or deleted" },
                  { icon: "👁", label: "Transparent", desc: "All parties can query records" },
                  { icon: "📋", label: "Compliant", desc: "GDPR & audit regulation ready" },
                  { icon: "📊", label: "Analytics", desc: "Universities see usage patterns" },
                ].map(item => (
                  <div key={item.label} style={{
                    background: "rgba(0,20,40,0.5)", border: "1px solid rgba(0,255,255,0.08)",
                    borderRadius: 12, padding: 16, textAlign: "center",
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{item.label}</div>
                    <div style={{ color: "#5a7a9a", fontSize: 11 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={{
          position: "relative", zIndex: 1,
          borderTop: "1px solid rgba(0,255,255,0.06)",
          padding: "16px 24px", textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#2a4a6a",
        }}>
          CertChain Prototype • PS-02 • Sri Krishna Arts and Science College • Binary Expo 2026 Solvathon
        </footer>
      </div>
    </>
  );
}
