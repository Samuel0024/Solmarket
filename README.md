# SolMarket — Next.js DApp

Nigeria's on-chain marketplace. Built on Solana with Next.js + proper Wallet Adapter.

## Tech Stack
- **Next.js 14** (React framework)
- **@solana/wallet-adapter-react** (real wallet connections — Phantom, Solflare, Backpack, Jupiter, Trust, Bitget)
- **Helius RPC** (fast Solana node — much faster than public RPC)
- **AES-256-GCM encrypted localStorage** (all user data encrypted)
- **Admin access: wallet-only** (super-admin wallet = god mode)

---

## 🚀 Deploy to Vercel (Recommended — 5 minutes)

### Step 1 — Get your free Helius API key
1. Go to https://helius.dev
2. Sign up free
3. Copy your API key (looks like: `a1b2c3d4-...`)

### Step 2 — Push to GitHub
1. Create a new repo on github.com
2. Upload all these files into it (drag and drop works)

### Step 3 — Deploy on Vercel
1. Go to https://vercel.com → New Project
2. Connect your GitHub repo
3. In **Environment Variables**, add:
   ```
   NEXT_PUBLIC_HELIUS_RPC = https://mainnet.helius-rpc.com/?api-key=YOUR_KEY_HERE
   NEXT_PUBLIC_SUPER_ADMIN_WALLET = 7tsf2T6S9bPPVSwT4AqaWRTDuneeiy5362BgQnA3shcL
   NEXT_PUBLIC_PLATFORM_WALLET = 7tsf2T6S9bPPVSwT4AqaWRTDuneeiy5362BgQnA3shcL
   ```
4. Click **Deploy** — done! You get a `.vercel.app` URL instantly.

---

## 🔥 Deploy to Firebase (Alternative)

### Step 1 — Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### Step 2 — Build the app
```bash
npm install
npm run build
```

### Step 3 — Init Firebase Hosting
```bash
firebase init hosting
# Select your Firebase project
# Set public directory to: out
# Configure as SPA: Yes
```

### Step 4 — Add to next.config.js for static export
Add `output: 'export'` to next.config.js, then:
```bash
npm run build
firebase deploy
```

> **Vercel is easier** for Next.js — Firebase Hosting is better if you plan to add Firestore/Auth later.

---

## 💻 Run Locally

```bash
npm install
# Copy .env.local and fill in your Helius key
npm run dev
# Open http://localhost:3000
```

---

## 🔑 Admin Access
- Connect the super-admin wallet (set in env var) → automatic full access
- No hardcoded admin code in source — admin codes stored as SHA-256 hash only

## 🔒 Security
- AES-256-GCM encrypted localStorage (Web Crypto API)
- No plaintext secrets in source code
- Wallet-only authentication — no passwords
- SOL released only when buyer confirms delivery

## 💰 Superteam Grant Tips
1. Record a video of someone buying a physical item (e.g. rice bag) using this app
2. Show the SOL transfer on Solana Explorer
3. Deploy to Vercel first — have a live `.vercel.app` URL
4. Apply at: https://earn.superteam.fun/grants
