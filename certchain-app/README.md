# CertChain - Blockchain Academic Certificate Verification

## PS-02 | Solvathon | Binary Expo 2026
### Sri Krishna Arts and Science College

---

## Quick Start

### Prerequisites
- **Node.js** (v16 or higher) — Download from https://nodejs.org

### Steps to Run

1. Open this folder in **VS Code**
2. Open Terminal in VS Code (`Ctrl + `` ` ``)
3. Run these commands:

```bash
npm install
npm start
```

4. The app will automatically open at **http://localhost:3000**

---

## Project Structure

```
certchain-app/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── index.js            # Entry point
│   └── App.jsx             # Main CertChain prototype (all code here)
├── package.json            # Dependencies & scripts
└── README.md               # This file
```

---

## How to Use the Prototype

### Switch Roles (top-right buttons):
- **University** — Issue certificates, revoke with multi-sig, view blockchain
- **Student** — Browse wallet, share QR codes
- **Employer** — Verify certificates, view audit trail

### Demo Flow:
1. **Issue** → Fill student details → Watch signing animation → Certificate minted
2. **Verify** → Enter cert ID (try `CERT-IIT-2024-001`) → See blockchain result
3. **Revoke** → Enter cert ID → Sign with 2 of 3 admin keys → Execute revocation
4. **Audit** → See all actions logged immutably

### Sample Certificate IDs:
- `CERT-IIT-2024-001` — Valid certificate
- `CERT-BITS-2023-047` — Valid certificate
- `CERT-VIT-2022-112` — Revoked certificate

---

## Team
- Danisha K — 22MSS007
- Jayasri D — 22MSS015
- Poojasri P — 22MSS029
