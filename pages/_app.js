import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  GlowWalletAdapter,
  BitgetWalletAdapter,
  TrustWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { HELIUS_RPC } from "../lib/constants";
import "../styles/globals.css";

// NOTE: We do NOT import the default wallet adapter CSS —
// we use our own wallet UI built into the app.

export default function App({ Component, pageProps }) {
  const endpoint = HELIUS_RPC;

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new GlowWalletAdapter(),
      new BitgetWalletAdapter(),
      new TrustWalletAdapter(),
      // Jupiter uses standard Solana wallet detection (window.jupiter.solana)
      // — handled manually in the wallet modal below
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <Component {...pageProps} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
