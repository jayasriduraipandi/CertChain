# CertChain
Blockchain-Based Academic Certificate Verification System 
# CertChain — Blockchain-Based Academic Certificate Verification

A decentralized platform to issue tamper-proof digital certificates, verify credentials instantly via QR code, and manage revocations with immutable audit trails.

## Overview

CertChain uses **permissioned blockchain technology** (Hyperledger Fabric) to solve the global problem of fake academic credentials. Universities issue digitally signed certificates on the blockchain, students own them in a digital wallet, and employers verify them in under 2 seconds — for free.

## Key Features

- **Instant Verification** — QR scan verification in < 2 seconds
- **Tamper-Proof** — Ed25519 signatures + SHA-3 hashing + blockchain immutability
- **Multi-Sig Revocation** — 2-of-3 admin keys required to revoke any certificate
- **Student Wallet** — NFT-based credential ownership with QR & NFC sharing
- **Zero-Knowledge Proofs** — Students prove claims without revealing full data
- **Immutable Audit Trail** — Every action permanently recorded on-chain
- **AI Fraud Detection** — ML monitors verification patterns in real-time
- **Cross-Border Ready** — Works internationally from day one

## Live Prototype

Open `CertChain-Prototype.html` in any browser to explore the full working prototype.

### Three Role-Based Portals

| Portal | Features |
|--------|----------|
| **University** | Issue certificates with blockchain animation, manage issued certs, multi-sig revocation, blockchain explorer, audit log |
| **Student** | Credential wallet, certificate details with QR code, share via QR, ZK privacy mode |
| **Employer** | Verify any certificate by ID, instant VALID/REVOKED result, verification history |

### Test Certificate IDs

| Certificate ID | Status | Student |
|---------------|--------|---------|
| `CERT-IIT-2024-001` | ✅ Valid | Arjun Patel |
| `CERT-BITS-2023-047` | ✅ Valid | Priya Menon |
| `CERT-VIT-2022-112` | 🔴 Revoked | Sanjay Kumar |
| `CERT-NIT-2024-033` | ✅ Valid | Divya Iyer |

## Technology Stack

### Blockchain & Security
| Technology | Purpose |
|-----------|---------|
| Hyperledger Fabric | Permissioned blockchain network |
| Solidity / Chaincode | Smart contract automation |
| ERC-721 (NFT) | Unique certificate tokens |
| Ed25519 | Digital signatures |
| SHA-3 / Keccak-256 | Cryptographic hashing |
| Zero-Knowledge Proofs | Privacy & selective disclosure |
| HSM | Hardware key protection |

### Backend, Frontend & DevOps
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | API server |
| GraphQL + REST | Dual API layer |
| React.js | Web portals |
| React Native / Flutter | Mobile wallet |
| IPFS | Decentralized storage |
| MongoDB / PostgreSQL | Off-chain database |
| Docker + Kubernetes | Container orchestration |
| TensorFlow | AI fraud detection |

## System Architecture
```
University Registrar
       ↓
  Ed25519 Signing
       ↓
  SHA-3 Hashing
       ↓
  Blockchain Consensus (2/3 validators)
       ↓
  IPFS Storage + NFT Mint
       ↓
  QR Code Generated → Student Wallet
       ↓
  Employer Scans QR → VALID / REVOKED (< 2 seconds)
```

## Certificate Lifecycle

1. **University Registrar** — Enters student details in admin panel
2. **Sign & Encrypt** — Ed25519 signature + SHA-3 hash
3. **Blockchain Mint** — Validator consensus + new block added
4. **QR Code Generated** — Unique QR with cert hash for student
5. **Employer Verifies** — Scans QR → blockchain query → instant result

## Multi-Signature Revocation

Revocation requires **2 of 3** authorized admin signatures:

1. Admin initiates with reason code
2. Second admin reviews and co-signs
3. Revocation block written to chain
4. All nodes update within 5 seconds

## Project Structure
``
CertChain/
├── CertChain-Prototype.html          # Full interactive prototype
├── CertChain-Detailed-20-Slides.pptx # 20-slide presentation
├── CertChain-Notes-and-QA.docx       # Speaker notes + 28 Q&A
└── README.md                         # This file
```

## Implementation Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| Phase 1 | Months 1–3 | Blockchain setup, smart contracts, admin MVP |
| Phase 2 | Months 4–6 | Certificate issuance, QR system, pilot with 3 universities |
| Phase 3 | Months 7–9 | ZK proofs, mobile wallet, AI fraud detection |
| Phase 4 | Months 10–12 | National federation, 100+ universities |

## Projected Impact

| Metric | Value |
|--------|-------|
| Verification Time | < 2 seconds |
| Uptime SLA | 99.9% |
| Employer Cost | $0 |
| Audit History | Permanent & immutable |

## Team

## License

This project is developed as part of a hackathon solution proposal.
