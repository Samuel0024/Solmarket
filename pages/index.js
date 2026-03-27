import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  SUPER_ADMIN_WALLET, PLATFORM_WALLET, PRIMARY, ACCENT, ORANGE, RED,
  DARK, MUTED, BORDER_C, WHITE, SOL_GRAD,
  fmtN, fmtSOL, stars, shortAddr, genTrackId, genTxHash,
  BANNERS, CATS, QUICK_CATS, TRACK_STAGES, INITIAL_PRODUCTS,
} from "../lib/constants";
import { encSave, encLoad, setAdminCodeHash, sha256hex } from "../lib/storage";

export const dynamic = 'force-dynamic';


// ─── SOL Price Hook ────────────────────────────────────────────
function useSolPrice() {
  const [priceNGN, setPriceNGN] = useState(null);
  const [priceUSD, setPriceUSD] = useState(null);
  useEffect(() => {
    const fetch_ = () =>
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=ngn,usd")
        .then((r) => r.json())
        .then((d) => { setPriceNGN(d?.solana?.ngn); setPriceUSD(d?.solana?.usd); })
        .catch(() => { if (!priceNGN) setPriceNGN(200000); });
    fetch_();
    const t = setInterval(fetch_, 60000);
    return () => clearInterval(t);
  }, []);
  const ngnToSol = useCallback((ngn) => (!priceNGN ? null : ngn / priceNGN), [priceNGN]);
  return { priceNGN, priceUSD, ngnToSol };
}

// ─── Spinner ──────────────────────────────────────────────────
function Spinner({ color = "#fff", size = 24 }) {
  return (
    <div className="spinner" style={{
      width: size, height: size,
      border: `3px solid ${color}30`,
      borderTop: `3px solid ${color}`,
    }} />
  );
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ msg, type }) {
  const bg = type === "success" ? "#0EA66D" : type === "info" ? "#4A90E2" : RED;
  const prefix = type === "success" ? "✓ " : type === "info" ? "ℹ " : "⚠ ";
  return <div className="toast" style={{ background: bg }}>{prefix}{msg}</div>;
}

// ─── Bottom Sheet ─────────────────────────────────────────────
function BottomSheet({ onClose, title, sub, children }) {
  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="sheet-handle" />
        {title && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: DARK, fontFamily: "Syne,sans-serif" }}>{title}</div>
              {sub && <div style={{ color: MUTED, fontSize: 13, marginTop: 2 }}>{sub}</div>}
            </div>
            <button onClick={onClose} style={{ background: "#F0F0F0", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 18, color: MUTED, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────
function PCard({ product, onOpen, wishlist, onToggleWish }) {
  const wishlisted = wishlist.some((p) => p.id === product.id);
  return (
    <div className="prod-card" onClick={() => onOpen(product)}>
      <div style={{ background: "linear-gradient(135deg,#FAF5FF,#F0FDF8)", height: 130, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 62, position: "relative" }}>
        {product.img}
        {product.off > 0 && <div style={{ position: "absolute", top: 8, left: 8, background: RED, color: "white", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 800 }}>-{product.off}%</div>}
        {product.flash && <div style={{ position: "absolute", top: 8, right: 36, background: ORANGE, color: "white", borderRadius: 6, padding: "2px 7px", fontSize: 9, fontWeight: 800 }}>FLASH</div>}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWish(product); }}
          style={{ position: "absolute", bottom: 6, right: 6, background: wishlisted ? "#FFE4E8" : "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%", width: 28, height: 28, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}
        >{wishlisted ? "❤️" : "🤍"}</button>
      </div>
      <div style={{ padding: "10px 10px 12px" }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: DARK, lineHeight: 1.3, marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{product.name}</div>
        <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, fontFamily: "Syne,sans-serif" }}>{fmtN(product.price)}</div>
        {product.oldPrice && <div style={{ textDecoration: "line-through", color: MUTED, fontSize: 11, marginTop: 1 }}>{fmtN(product.oldPrice)}</div>}
        <div style={{ color: MUTED, fontSize: 10, marginTop: 2 }}>🚚 {product.deliveryFee > 0 ? fmtN(product.deliveryFee) : "Free delivery"}</div>
        <div style={{ color: "#FFB800", fontSize: 11, marginTop: 4 }}>{stars(product.rating)} <span style={{ color: MUTED }}>({product.reviews})</span></div>
      </div>
    </div>
  );
}

// ─── Banner Carousel ─────────────────────────────────────────
function BannerCarousel({ bannerIdx, onSwipe }) {
  const b = BANNERS[bannerIdx];
  const startX = useRef(0);
  return (
    <div
      style={{ position: "relative", margin: "0 12px", borderRadius: 18, overflow: "hidden", height: 165, background: b.bg }}
      onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - startX.current; if (Math.abs(dx) > 40) onSwipe(dx < 0 ? 1 : -1); }}
    >
      <div style={{ position: "absolute", top: 12, left: 14, background: b.tagBg, color: "white", borderRadius: 8, padding: "3px 12px", fontSize: 11, fontWeight: 800, fontFamily: "Syne,sans-serif" }}>{b.tag}</div>
      <div style={{ position: "absolute", bottom: 16, left: 14, right: "38%" }}>
        <div style={{ color: "white", fontWeight: 900, fontSize: 18, lineHeight: 1.2, fontFamily: "Syne,sans-serif" }}>{b.title}</div>
        <div style={{ marginTop: 8, display: "inline-block", background: "rgba(255,255,255,0.22)", color: "white", borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>{b.sub}</div>
      </div>
      <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 72 }}>{b.emoji}</div>
      <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
        {BANNERS.map((_, i) => (
          <div key={i} style={{ width: i === bannerIdx ? 20 : 6, height: 6, borderRadius: 3, background: `rgba(255,255,255,${i === bannerIdx ? 0.95 : 0.4})`, transition: "all 0.3s" }} />
        ))}
      </div>
    </div>
  );
}

// ─── Wallet Modal (custom — wraps adapter) ────────────────────
function WalletModal({ onClose, onConnectAdapter, notify }) {
  const [showMore, setShowMore] = useState(false);
  const [connecting, setConnecting] = useState(null);
  const { select, connect, wallets } = useWallet();
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Jupiter deep-link
  const jupiterDeepLink = () => `https://jup.ag/browser?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`;
  const trustDeepLink = () => `https://link.trustwallet.com/open_url?coin_id=501&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`;

  const EXTRA_WALLETS = [
    { name: "Jupiter", emoji: "🪐", detected: typeof window !== "undefined" && !!(window.jupiter?.solana || window.solana?.isJupiter || /Jupiter/i.test(navigator.userAgent)), deepLink: jupiterDeepLink, provider: typeof window !== "undefined" ? (window.jupiter?.solana || (window.solana?.isJupiter || /Jupiter/i.test(navigator.userAgent) ? window.solana : null)) : null },
  ];

  const adapterWallets = wallets.map((w) => ({
    name: w.adapter.name,
    emoji: { Phantom: "👻", Solflare: "🔥", Backpack: "🎒", Glow: "✨", Bitget: "💜", "Trust Wallet": "🛡️" }[w.adapter.name] || "💼",
    detected: w.readyState === "Installed",
    adapter: w.adapter,
  }));

  const allWallets = [...EXTRA_WALLETS, ...adapterWallets];
  const visible = showMore ? allWallets : allWallets.slice(0, 4);

  const handleConnect = async (w) => {
    // Jupiter or custom provider
    if (w.provider) {
      try {
        setConnecting(w.name);
        const resp = await w.provider.connect();
        const pubkey = resp?.publicKey?.toString() || resp?.toString();
        if (!pubkey || pubkey.length < 32) throw new Error("Invalid key");
        onConnectAdapter(pubkey, w.name);
        onClose();
      } catch (e) {
        notify("Connection failed — " + (e?.message || "").slice(0, 40), "error");
        setConnecting(null);
      }
      return;
    }
    if (!w.detected && isMobile && w.deepLink) {
      notify(`Opening ${w.name}…`, "info");
      setTimeout(() => { window.location.href = typeof w.deepLink === "function" ? w.deepLink() : w.deepLink; }, 500);
      return;
    }
    if (!w.detected && !w.adapter) {
      notify(`${w.name} not installed`, "error"); return;
    }
    if (w.adapter) {
      try {
        setConnecting(w.name);
        select(w.adapter.name);
        await connect();
        // wallet publicKey is set via useWallet — handled by parent effect
        onClose();
      } catch (e) {
        const msg = (e?.message || "").toLowerCase();
        if (msg.includes("rejected") || msg.includes("cancel")) notify("Cancelled", "error");
        else notify(`${w.name} failed — open the app first`, "error");
        setConnecting(null);
      }
    }
  };

  return (
    <BottomSheet onClose={onClose} title="Connect Wallet" sub="Choose your Solana wallet">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
        {connecting ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "30px 0" }}>
            <Spinner color={PRIMARY} size={36} />
            <div style={{ color: MUTED, fontSize: 14, marginTop: 14, fontWeight: 600 }}>Connecting {connecting}…</div>
            <div style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>Approve in your wallet app</div>
          </div>
        ) : (
          <>
            {visible.map((w) => (
              <button key={w.name} className="wallet-btn" onClick={() => handleConnect(w)}>
                <span style={{ fontSize: 24 }}>{w.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: DARK }}>{w.name}</div>
                  {w.detected
                    ? <div style={{ color: ACCENT, fontSize: 10, fontWeight: 700 }}>● Detected</div>
                    : isMobile && w.deepLink
                    ? <div style={{ color: "#4A90E2", fontSize: 10, fontWeight: 700 }}>📲 Open App</div>
                    : <div style={{ color: MUTED, fontSize: 10 }}>Install extension</div>}
                </div>
              </button>
            ))}
            <button
              onClick={() => setShowMore(!showMore)}
              style={{ gridColumn: "1/-1", background: "#F0F0F0", border: `1.5px dashed ${BORDER_C}`, borderRadius: 14, padding: 12, fontWeight: 700, fontSize: 13, color: MUTED }}
            >{showMore ? "Show less ↑" : `Show more wallets (${allWallets.length - 4} more) ↓`}</button>
          </>
        )}
      </div>
      <p style={{ color: MUTED, fontSize: 11, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
        By connecting you agree to SolMarket Terms. Your wallet is your identity — no password needed.
      </p>
    </BottomSheet>
  );
}

// ─── Product Modal ────────────────────────────────────────────
function ProductModal({ product, onClose, onAddCart, walletAddr, connection, walletAdapter, ngnToSol, notify, onOrderPlaced }) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const fee = product.deliveryFee || 0;
  const total = product.price * qty;
  const grandTotal = total + fee;

  const handleOrder = async () => {
    if (!walletAddr) { onClose(); return; }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const order = {
        id: Date.now(), trackId: genTrackId(), txHash: genTxHash(),
        product: { ...product }, qty, total, deliveryFee: fee, grandTotal,
        solAmount: null, merchantWallet: product.sellerWallet || null,
        buyerWallet: walletAddr, status: "placed", paymentStatus: "pending_delivery",
        stageIndex: 0,
        stages: [{ key: "placed", ts: new Date().toLocaleString(), note: "Order placed — Pay cash on delivery" }],
        createdAt: new Date().toISOString(),
      };
      setLastOrder(order);
      setOrdered(true);
      onOrderPlaced(order);
      notify("Order placed! Pay on delivery 🎉");
    } catch (e) {
      notify("Order failed: " + (e?.message || "unknown").slice(0, 40), "error");
    }
    setLoading(false);
  };

  return (
    <BottomSheet onClose={onClose} title={null} sub={null}>
      {/* Image */}
      <div style={{ background: "linear-gradient(135deg,#F8F0FF,#F0FDF8)", borderRadius: 16, height: 180, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 90, marginBottom: 16, position: "relative" }}>
        {product.img}
        {product.off > 0 && <div style={{ position: "absolute", top: 10, right: 10, background: RED, color: "white", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 800 }}>-{product.off}%</div>}
      </div>

      <div style={{ fontWeight: 800, fontSize: 17, color: DARK, marginBottom: 4, lineHeight: 1.3, fontFamily: "Syne,sans-serif" }}>{product.name}</div>
      <div style={{ color: MUTED, fontSize: 13, marginBottom: 4 }}>by <span style={{ color: PRIMARY, fontWeight: 700 }}>{product.seller}</span></div>
      <div style={{ color: "#FFB800", fontSize: 13, marginBottom: 14 }}>{stars(product.rating)} <span style={{ color: MUTED }}>({product.reviews} reviews)</span></div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 28, color: ORANGE, fontFamily: "Syne,sans-serif" }}>{fmtN(total)}</div>
        {product.oldPrice && <div style={{ textDecoration: "line-through", color: MUTED, fontSize: 14 }}>{fmtN(product.oldPrice)}</div>}
      </div>

      {/* Qty */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <span style={{ color: MUTED, fontSize: 13, fontWeight: 600 }}>Qty:</span>
        <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${BORDER_C}`, borderRadius: 10, overflow: "hidden" }}>
          <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 38, height: 38, border: "none", background: "white", fontSize: 18, color: DARK }}>-</button>
          <span style={{ width: 38, textAlign: "center", fontWeight: 700, fontSize: 15 }}>{qty}</span>
          <button onClick={() => setQty(Math.min(product.stock, qty + 1))} style={{ width: 38, height: 38, border: "none", background: "white", fontSize: 18, color: DARK }}>+</button>
        </div>
        <span style={{ color: MUTED, fontSize: 12 }}>{product.stock} in stock</span>
      </div>

      {ordered && lastOrder ? (
        <div style={{ background: "#F0FDF8", border: `2px solid #14F195`, borderRadius: 14, padding: 20, textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
          <div style={{ fontWeight: 800, color: "#0EA66D", fontSize: 17, fontFamily: "Syne,sans-serif" }}>Order Placed! Pay on Delivery</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FF6B0015", border: "1px solid #FF6B0030", borderRadius: 8, padding: "6px 14px", marginTop: 8 }}>
            <span>💵</span>
            <span style={{ fontWeight: 800, color: ORANGE, fontSize: 14 }}>{fmtN(lastOrder.grandTotal)} due on delivery</span>
          </div>
          <div style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>Includes {fmtN(fee)} delivery fee set by {product.seller}</div>
          <div style={{ marginTop: 10, padding: 10, background: "white", borderRadius: 10, border: `1px solid ${BORDER_C}` }}>
            <div style={{ fontSize: 11, color: MUTED }}>Tracking ID</div>
            <div style={{ fontWeight: 800, color: PRIMARY, fontSize: 16, fontFamily: "Syne,sans-serif", letterSpacing: "0.5px" }}>{lastOrder.trackId}</div>
          </div>
        </div>
      ) : (
        <>
          {/* Delivery notice */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFF8F0", border: "1px solid #FF6B0030", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>🚚</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: DARK }}>Pay on Delivery</div>
              <div style={{ color: MUTED, fontSize: 11 }}>Delivery fee: {fee > 0 ? fmtN(fee) : "Free"} · Set by {product.seller}</div>
            </div>
          </div>
          {/* Grand total */}
          <div style={{ display: "flex", justifyContent: "space-between", background: "#F8F8F8", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
            <span style={{ color: MUTED, fontSize: 13, fontWeight: 600 }}>Total (incl. delivery)</span>
            <span style={{ fontWeight: 900, fontSize: 16, color: ORANGE, fontFamily: "Syne,sans-serif" }}>{fmtN(grandTotal)}</span>
          </div>
          <button className="sol-btn" style={{ width: "100%", padding: 16, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }} onClick={handleOrder} disabled={loading}>
            {loading ? <><Spinner size={20} /> Placing Order…</> : walletAddr ? `💵 Pay on Delivery — ${fmtN(grandTotal)}` : "Connect Wallet to Order"}
          </button>
          <button className="out-btn" style={{ width: "100%" }} onClick={() => { onAddCart(product, qty); onClose(); }}>🛒 Add to Cart</button>
        </>
      )}
    </BottomSheet>
  );
}

// ─── Cart Modal ───────────────────────────────────────────────
function CartModal({ cart, onClose, onRemove, onOrder, walletAddr }) {
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const deliveryTotal = cart.reduce((s, i) => s + (i.product.deliveryFee || 0), 0);
  const grandTotal = subtotal + deliveryTotal;
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!walletAddr) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    for (const item of cart) {
      const fee = item.product.deliveryFee || 0;
      onOrder({
        id: Date.now() + Math.random(), trackId: genTrackId(), txHash: genTxHash(),
        product: { ...item.product }, qty: item.qty,
        total: item.product.price * item.qty, deliveryFee: fee,
        grandTotal: item.product.price * item.qty + fee,
        solAmount: null, merchantWallet: item.product.sellerWallet || null,
        buyerWallet: walletAddr, status: "placed", paymentStatus: "pending_delivery",
        stageIndex: 0,
        stages: [{ key: "placed", ts: new Date().toLocaleString(), note: "Order placed — Pay cash on delivery" }],
        createdAt: new Date().toISOString(),
      });
    }
    setLoading(false);
  };

  return (
    <BottomSheet onClose={onClose} title="My Cart" sub={`${cart.length} item(s)`}>
      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🛒</div>
          <div style={{ fontWeight: 800, color: DARK, fontSize: 16 }}>Your cart is empty</div>
          <div style={{ color: MUTED, fontSize: 13, marginTop: 6 }}>Add some items to get started</div>
        </div>
      ) : (
        <>
          {cart.map((item) => (
            <div key={item.product.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${BORDER_C}`, alignItems: "center" }}>
              <div style={{ fontSize: 36, width: 50, height: 50, background: "#F8F8F8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.product.img}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: DARK, fontSize: 13, lineHeight: 1.3 }}>{item.product.name.slice(0, 35)}…</div>
                <div style={{ color: ORANGE, fontWeight: 900, fontSize: 14, marginTop: 4 }}>{fmtN(item.product.price * item.qty)}</div>
                <div style={{ color: MUTED, fontSize: 11 }}>Qty: {item.qty} · Delivery: {item.product.deliveryFee > 0 ? fmtN(item.product.deliveryFee) : "Free"}</div>
              </div>
              <button onClick={() => onRemove(item.product.id)} style={{ background: "#FFF0F0", border: "none", borderRadius: 8, width: 32, height: 32, color: RED, fontSize: 18, flexShrink: 0 }}>×</button>
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px 0", borderTop: `2px solid ${BORDER_C}`, marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: MUTED, fontSize: 13 }}>Subtotal</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{fmtN(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: MUTED, fontSize: 13 }}>🚚 Delivery fees</span>
              <span style={{ fontWeight: 700, color: ORANGE, fontSize: 13 }}>{deliveryTotal > 0 ? fmtN(deliveryTotal) : "Free"}</span>
            </div>
            {cart.length > 1 && <div style={{ fontSize: 10, color: MUTED }}>Delivery fees set individually by each merchant</div>}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${BORDER_C}` }}>
              <span style={{ fontWeight: 700, color: DARK, fontSize: 15 }}>Total (COD)</span>
              <span style={{ fontWeight: 900, color: ORANGE, fontSize: 18, fontFamily: "Syne,sans-serif" }}>{fmtN(grandTotal)}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFF8F0", border: "1px solid #FF6B0025", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>💵</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: DARK }}>Pay on Delivery</div>
              <div style={{ color: MUTED, fontSize: 11 }}>Pay cash when your order arrives</div>
            </div>
          </div>
          <button className="sol-btn" style={{ width: "100%", padding: 16, fontSize: 16 }} onClick={handleCheckout} disabled={loading || !walletAddr}>
            {loading ? "Placing Orders…" : "Place Order — Pay on Delivery"}
          </button>
        </>
      )}
    </BottomSheet>
  );
}

// ─── Track Modal ──────────────────────────────────────────────
function TrackModal({ orders, walletAddr, onClose, connection, walletName, walletAdapter, ngnToSol, notify, onOrderUpdate, initialOrder }) {
  const [trackInput, setTrackInput] = useState("");
  const [err, setErr] = useState("");
  const [order, setOrder] = useState(initialOrder || null);
  const [releasing, setReleasing] = useState(false);

  const handleSearch = () => {
    const found = orders.find((o) => o.trackId === trackInput.trim().toUpperCase());
    if (found) { setErr(""); setOrder(found); }
    else setErr("No order found with that ID.");
  };

  const handleConfirmDelivery = async () => {
    if (!order) return;
    setReleasing(true);
    try {
      const solAmt = ngnToSol(order.total);
      let txSig;
      const recipientWallet = order.merchantWallet || PLATFORM_WALLET;
      if (walletAdapter?.sendTransaction && walletAddr && !walletAddr.startsWith("Demo") && solAmt && connection) {
        const fromPubkey = new PublicKey(walletAddr);
        const toPubkey = new PublicKey(recipientWallet);
        const lamports = Math.round(solAmt * LAMPORTS_PER_SOL);
        const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports }));
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = fromPubkey;
        txSig = await walletAdapter.sendTransaction(tx, connection);
        await connection.confirmTransaction({ signature: txSig, blockhash, lastValidBlockHeight }, "confirmed");
      } else {
        await new Promise((r) => setTimeout(r, 1800));
        txSig = genTxHash();
      }
      const now = new Date().toLocaleString();
      const updated = {
        ...order, status: "delivered", stageIndex: 4,
        paymentStatus: "paid", solAmount: ngnToSol(order.total), txHash: txSig,
        stages: [...order.stages, { key: "delivered", ts: now, note: `SOL released to seller · TX: ${txSig?.slice(0, 12)}…` }],
      };
      setOrder(updated);
      onOrderUpdate(updated);
      notify("SOL sent to seller! Order complete 🎉");
    } catch (e) {
      notify("SOL release failed: " + (e?.message || "").slice(0, 40), "error");
    }
    setReleasing(false);
  };

  const myOrders = orders.filter((o) => o.buyerWallet === walletAddr).slice(0, 3);

  if (!order) {
    return (
      <BottomSheet onClose={onClose} title="Track Order" sub="Real-time order tracking">
        <div style={{ textAlign: "center", fontSize: 48, padding: "10px 0" }}>📦</div>
        <p style={{ color: MUTED, fontSize: 14, textAlign: "center", lineHeight: 1.6, marginBottom: 14 }}>Enter your tracking ID to see real-time order status</p>
        <input className="inp" placeholder="e.g. SOL-ABC123-DEF" value={trackInput} onChange={(e) => setTrackInput(e.target.value)} style={{ textAlign: "center", fontWeight: 700, letterSpacing: 1 }} />
        {err && <div style={{ color: RED, fontSize: 13, textAlign: "center", marginTop: 8, fontWeight: 600 }}>{err}</div>}
        <button className="sol-btn" style={{ width: "100%", marginTop: 14 }} onClick={handleSearch}>Track Order →</button>
        {myOrders.length > 0 && (
          <>
            <div style={{ fontWeight: 700, color: DARK, fontSize: 14, marginTop: 20, marginBottom: 8 }}>Recent Orders</div>
            {myOrders.map((o) => (
              <div key={o.id} onClick={() => setOrder(o)} style={{ background: "#F8F8F8", borderRadius: 12, padding: 12, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, color: DARK, fontSize: 13 }}>{o.product.name.slice(0, 28)}…</div>
                  <div style={{ fontFamily: "monospace", color: PRIMARY, fontSize: 11, marginTop: 3 }}>{o.trackId}</div>
                </div>
                <span style={{ background: `${TRACK_STAGES[o.stageIndex]?.color || ORANGE}20`, color: TRACK_STAGES[o.stageIndex]?.color || ORANGE, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{o.status}</span>
              </div>
            ))}
          </>
        )}
      </BottomSheet>
    );
  }

  const stageIdx = order.stageIndex ?? 0;
  const showConfirmBtn = (order.status === "shipped" || order.status === "delivered") && order.paymentStatus === "pending_delivery";
  const showPaid = order.paymentStatus === "paid";

  return (
    <BottomSheet onClose={onClose} title={null} sub={null}>
      {/* Track ID header */}
      <div style={{ background: "linear-gradient(135deg,#FAF5FF,#F0FDF8)", borderRadius: 14, padding: 16, marginBottom: 16, textAlign: "center" }}>
        <div style={{ color: MUTED, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>TRACKING ID</div>
        <div style={{ fontWeight: 900, fontSize: 20, color: PRIMARY, fontFamily: "Syne,sans-serif", letterSpacing: 1 }}>{order.trackId}</div>
      </div>
      {/* Product row */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", background: "#F8F8F8", borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 36, width: 50, height: 50, background: "white", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${BORDER_C}`, flexShrink: 0 }}>{order.product.img}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: DARK, fontSize: 13, lineHeight: 1.3 }}>{order.product.name.slice(0, 40)}</div>
          <div style={{ color: ORANGE, fontWeight: 900, fontSize: 14, marginTop: 4 }}>{fmtN(order.grandTotal || order.total)}</div>
          <div style={{ color: MUTED, fontSize: 11 }}>incl. {fmtN(order.deliveryFee || 0)} delivery</div>
        </div>
      </div>
      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          {TRACK_STAGES.map((stage, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < TRACK_STAGES.length - 1 ? "1" : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: i <= stageIdx ? stage.color : BORDER_C, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{i <= stageIdx ? stage.icon : ""}</div>
              {i < TRACK_STAGES.length - 1 && <div style={{ flex: 1, height: 3, background: i < stageIdx ? "#14F195" : BORDER_C }} />}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {TRACK_STAGES.map((stage, i) => (
            <div key={i} style={{ fontSize: 9, color: i <= stageIdx ? DARK : MUTED, fontWeight: i <= stageIdx ? 700 : 400, textAlign: "center", maxWidth: 52, lineHeight: 1.2 }}>{stage.label}</div>
          ))}
        </div>
      </div>
      {/* Confirm delivery button */}
      {showConfirmBtn && (
        <div style={{ background: "linear-gradient(135deg,#F0FDF8,#FAF5FF)", border: "2px solid #14F19560", borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ fontWeight: 800, color: DARK, fontSize: 14, marginBottom: 4, fontFamily: "Syne,sans-serif" }}>📦 Did your order arrive?</div>
          <div style={{ color: MUTED, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>Confirming releases SOL ({ngnToSol(order.total) ? fmtSOL(ngnToSol(order.total)) : "…"}) from your wallet directly to the seller.</div>
          <button className="sol-btn" style={{ width: "100%", padding: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={handleConfirmDelivery} disabled={releasing}>
            {releasing ? <><Spinner size={18} /> Sending SOL to seller…</> : "✅ Confirm Delivery & Release SOL"}
          </button>
        </div>
      )}
      {showPaid && (
        <div style={{ background: "#F0FDF8", border: "2px solid #14F195", borderRadius: 14, padding: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>✅</span>
          <div>
            <div style={{ fontWeight: 800, color: "#0EA66D", fontSize: 14 }}>SOL Released to Seller</div>
            {order.solAmount && <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>◎ {fmtSOL(order.solAmount)} sent · TX: {(order.txHash || "").slice(0, 12)}…</div>}
          </div>
        </div>
      )}
      {/* Timeline */}
      <div style={{ fontWeight: 700, color: DARK, fontSize: 14, marginBottom: 12 }}>Order Timeline</div>
      {[...order.stages].reverse().map((s, i) => {
        const stageDef = TRACK_STAGES.find((t) => t.key === s.key);
        return (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: i === 0 ? `${stageDef?.color || PRIMARY}15` : BORDER_C, border: `2px solid ${i === 0 ? stageDef?.color || PRIMARY : BORDER_C}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{stageDef?.icon || "📋"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: i === 0 ? DARK : MUTED, fontSize: 13 }}>{stageDef?.label || s.key}</div>
              <div style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{s.note}</div>
              <div style={{ color: MUTED, fontSize: 10, marginTop: 2 }}>{s.ts}</div>
            </div>
          </div>
        );
      })}
      <button className="out-btn" style={{ width: "100%", marginTop: 8 }} onClick={() => setOrder(null)}>← Track Another Order</button>
    </BottomSheet>
  );
}

// ─── Wishlist Modal ───────────────────────────────────────────
function WishlistModal({ wishlist, onClose, onToggle, onAddCart }) {
  return (
    <BottomSheet onClose={onClose} title="My Wishlist" sub={`${wishlist.length} saved item${wishlist.length !== 1 ? "s" : ""}`}>
      {wishlist.length === 0 ? (
        <div style={{ textAlign: "center", padding: "36px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>❤️</div>
          <div style={{ fontWeight: 800, color: DARK, fontSize: 16, marginBottom: 6 }}>Your wishlist is empty</div>
          <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.5 }}>Tap the 🤍 heart on any product to save it here</div>
        </div>
      ) : (
        <>
          {wishlist.map((product) => (
            <div key={product.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${BORDER_C}`, alignItems: "center" }}>
              <div style={{ fontSize: 36, width: 52, height: 52, background: "#F8F8F8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{product.img}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: DARK, fontSize: 13, lineHeight: 1.3, marginBottom: 4 }}>{product.name.slice(0, 40)}</div>
                <div style={{ color: ORANGE, fontWeight: 900, fontSize: 14 }}>{fmtN(product.price)}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <button onClick={() => { onAddCart(product, 1); onToggle(product); }} style={{ background: PRIMARY, color: "white", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>+Cart</button>
                <button onClick={() => onToggle(product)} style={{ background: "#FFF0F0", border: "none", borderRadius: 8, width: 32, height: 32, color: RED, fontSize: 16 }}>×</button>
              </div>
            </div>
          ))}
          <button className="out-btn" style={{ width: "100%", marginTop: 14, borderColor: "#FFD0D0", color: RED }} onClick={() => { wishlist.forEach((p) => onToggle(p)); }}>Clear Wishlist</button>
        </>
      )}
    </BottomSheet>
  );
}

// ─── Profile Modal ────────────────────────────────────────────
function ProfileModal({ user, walletAddr, walletName, orders, cart, merchantStatus, onClose, onDisconnect, onOpenTrack, onOpenCart, onOpenAdmin, onOpenMerchant }) {
  const myOrders = orders.filter((o) => o.buyerWallet === walletAddr);
  const isAdmin = walletAddr === SUPER_ADMIN_WALLET || user?.role === "admin";
  return (
    <BottomSheet onClose={onClose} title="My Account" sub={shortAddr(walletAddr)}>
      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: "linear-gradient(135deg,#FAF5FF,#F0FDF8)", borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ width: 58, height: 58, borderRadius: "50%", background: SOL_GRAD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{user?.avatar || "👤"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: DARK, fontFamily: "Syne,sans-serif" }}>{user?.username || "Guest"}</div>
          <div style={{ fontFamily: "monospace", color: PRIMARY, fontSize: 11, marginTop: 2 }}>{shortAddr(walletAddr)}</div>
          {walletName && <div style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>via {walletName}</div>}
        </div>
      </div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
        {[[myOrders.length, "Orders"], [cart.length, "In Cart"], [user?.role === "seller" ? "✓" : "—", "Seller"]].map(([v, l]) => (
          <div key={l} style={{ background: "#F8F8F8", borderRadius: 12, padding: 12, textAlign: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 20, color: DARK, fontFamily: "Syne,sans-serif" }}>{String(v)}</div>
            <div style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      {/* Menu */}
      {[
        { icon: "📦", label: "My Orders", action: onOpenTrack },
        { icon: "🛒", label: "My Cart", action: onOpenCart },
        ...(isAdmin ? [{ icon: "👑", label: "Admin Panel", action: onOpenAdmin, highlight: true }] : []),
        ...(merchantStatus === "approved" ? [{ icon: "🏪", label: "My Store Dashboard", action: null }] : merchantStatus === "pending" ? [{ icon: "⏳", label: "Seller Application: Pending Review", action: null }] : [{ icon: "🏪", label: "Become a Seller", action: onOpenMerchant }]),
      ].map((item) => (
        <div key={item.label} onClick={item.action || undefined} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, background: item.highlight ? "#FFF8E1" : "#F8F8F8", borderRadius: 12, cursor: item.action ? "pointer" : "default", border: item.highlight ? "1.5px solid #FFD700" : "none", marginBottom: 8 }}>
          <div style={{ fontSize: 20 }}>{item.icon}</div>
          <div style={{ fontWeight: 600, color: item.highlight ? "#B8860B" : DARK, fontSize: 14 }}>{item.label}</div>
          {item.action && <div style={{ marginLeft: "auto", color: MUTED, fontSize: 18 }}>›</div>}
        </div>
      ))}
      <button className="out-btn" style={{ width: "100%", borderColor: "#FFD0D0", color: RED, marginTop: 8 }} onClick={onDisconnect}>Disconnect Wallet</button>
    </BottomSheet>
  );
}

// ─── Admin Modal ──────────────────────────────────────────────
function AdminModal({ walletAddr, onClose, orders, products, adminApps, onApprove, onReject, notify }) {
  const [tab, setTab] = useState("pending");
  const [newCode, setNewCode] = useState("");
  const isSuper = walletAddr === SUPER_ADMIN_WALLET;
  const filtered = tab === "all" ? adminApps : adminApps.filter((a) => a.status === tab);
  const SC = { approved: ACCENT, pending: ORANGE, rejected: RED };

  return (
    <BottomSheet onClose={onClose} title="Admin Panel 👑" sub={isSuper ? "Super Admin" : "Admin"}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto" }}>
        {["pending", "approved", "rejected", "all", "orders"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 12px", border: "none", background: tab === t ? PRIMARY : "#F0F0F0", color: tab === t ? "white" : MUTED, borderRadius: 20, fontWeight: 700, fontSize: 11, whiteSpace: "nowrap", flexShrink: 0 }}>{t}</button>
        ))}
      </div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
        {[["Pending", adminApps.filter((a) => a.status === "pending").length, ORANGE], ["Approved", adminApps.filter((a) => a.status === "approved").length, ACCENT], ["Rejected", adminApps.filter((a) => a.status === "rejected").length, RED]].map(([l, n, c]) => (
          <div key={l} style={{ background: "#F8F8F8", borderRadius: 10, padding: 10, textAlign: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 22, color: c, fontFamily: "Syne,sans-serif" }}>{n}</div>
            <div style={{ color: MUTED, fontSize: 11 }}>{l}</div>
          </div>
        ))}
      </div>
      {/* Orders tab */}
      {tab === "orders" && (
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {orders.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: MUTED }}>No orders yet</div> : orders.map((o) => (
            <div key={o.id} style={{ background: "#F8F8F8", borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, color: DARK, fontSize: 13 }}>{o.product?.name?.slice(0, 28) || "Product"}</div>
                  <div style={{ fontFamily: "monospace", color: PRIMARY, fontSize: 10 }}>{o.trackId}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900, color: ORANGE, fontSize: 13 }}>{fmtN(o.grandTotal || o.total)}</div>
                  <span style={{ background: `${ORANGE}20`, color: ORANGE, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{o.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Merchant apps */}
      {tab !== "orders" && (
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {filtered.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: MUTED }}>No applications</div> : filtered.map((app) => (
            <div key={app.id} style={{ background: "#F8F8F8", borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${BORDER_C}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, color: DARK, fontSize: 14, fontFamily: "Syne,sans-serif" }}>{app.name}</div>
                  <div style={{ color: MUTED, fontSize: 12 }}>{app.desc}</div>
                </div>
                <span style={{ background: `${SC[app.status]}20`, color: SC[app.status], borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{app.status}</span>
              </div>
              <div style={{ color: MUTED, fontSize: 12, marginBottom: app.status === "pending" ? 10 : 0 }}>{app.category} · {shortAddr(app.wallet)}</div>
              {app.status === "pending" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onApprove(app.id)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", background: "#0EA66D", color: "white", fontWeight: 700, fontSize: 13 }}>✓ Approve</button>
                  <button onClick={() => onReject(app.id)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", background: RED, color: "white", fontWeight: 700, fontSize: 13 }}>✗ Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Admin code setter */}
      {isSuper && (
        <div style={{ marginTop: 16, background: "#F8F8F8", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🔒 Set Admin Code (stored as hash)</div>
          <input className="inp" type="password" placeholder="New admin code…" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
          <button className="sol-btn" style={{ width: "100%", marginTop: 8 }} onClick={async () => { if (newCode.length < 6) { notify("Min 6 chars", "error"); return; } await setAdminCodeHash(newCode); setNewCode(""); notify("Code saved securely ✓"); }}>Save Code Hash</button>
        </div>
      )}
    </BottomSheet>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function SolMarket() {
  const { publicKey, disconnect, wallet, sendTransaction, connected, select, connect } = useWallet();
  const { connection } = useConnection();
  const { priceNGN, priceUSD, ngnToSol } = useSolPrice();

  const walletAddr = publicKey?.toString() || null;
  const walletName = wallet?.adapter?.name || null;

  // ── State ──
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [adminApps, setAdminApps] = useState([
    { id: 1, wallet: "7xKp...Mn3Z", name: "SneakerVault", category: "Fashion", desc: "Authenticated luxury sneakers", status: "pending", date: "Mar 18", email: "sneaker@vault.io" },
    { id: 2, wallet: "Bq9L...Wr7P", name: "CryptoTech Hub", category: "Electronics", desc: "Blockchain hardware", status: "pending", date: "Mar 19", email: "crypto@techhub.io" },
    { id: 3, wallet: "Tz5R...Hk2M", name: "ArtNative", category: "Art", desc: "Physical + digital art", status: "approved", date: "Mar 15", email: "art@native.sol" },
  ]);
  const [user, setUser] = useState(null);
  const [merchantStatus, setMerchantStatus] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // UI
  const [modal, setModal] = useState(null); // 'wallet'|'product'|'cart'|'track'|'wishlist'|'profile'|'admin'
  const [modalData, setModalData] = useState(null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [bannerIdx, setBannerIdx] = useState(0);
  const [countdown, setCountdown] = useState(13 * 3600 + 53 * 60 + 59);
  const [toast, setToast] = useState(null);
  const [searchDebounce, setSearchDebounce] = useState("");

  // ── Load from encrypted storage ──
  useEffect(() => {
    encLoad().then((data) => {
      if (data.orders) setOrders(data.orders);
      if (data.cart) setCart(data.cart);
      if (data.wishlist) setWishlist(data.wishlist);
      if (data.user) setUser(data.user);
      if (data.adminApps) setAdminApps(data.adminApps);
      setLoaded(true);
    });
  }, []);

  // ── Persist on state change ──
  useEffect(() => {
    if (!loaded) return;
    encSave({ orders, cart, wishlist, user, adminApps });
  }, [orders, cart, wishlist, user, adminApps, loaded]);

  // ── Sync wallet adapter to user ──
  useEffect(() => {
    if (!walletAddr) return;
    const isAdmin = walletAddr === SUPER_ADMIN_WALLET;
    setUser((prev) => prev?.walletAddr === walletAddr ? prev : {
      walletAddr, walletName: walletName || "Wallet",
      username: isAdmin ? "SuperAdmin" : shortAddr(walletAddr),
      role: isAdmin ? "admin" : "buyer",
      merchantStatus: null,
      createdAt: new Date().toISOString(),
      avatar: isAdmin ? "👑" : ["😊","🦊","🐉","🦁","🐺","🦅","🦋","🌟"][Math.floor(Math.random() * 8)],
    });
    if (isAdmin) setMerchantStatus("approved");
    setModal(null);
    notify(isAdmin ? "Admin wallet connected 👑" : "Wallet connected! Welcome 🚀");
  }, [walletAddr]);

  // ── Custom wallet connect (Jupiter etc.) ──
  const handleManualConnect = useCallback((addr, name) => {
    const isAdmin = addr === SUPER_ADMIN_WALLET;
    setUser({ walletAddr: addr, walletName: name, username: isAdmin ? "SuperAdmin" : shortAddr(addr), role: isAdmin ? "admin" : "buyer", merchantStatus: null, createdAt: new Date().toISOString(), avatar: isAdmin ? "👑" : "😊" });
    if (isAdmin) setMerchantStatus("approved");
    setModal(null);
    notify(isAdmin ? "Admin wallet connected 👑" : "Wallet connected! Welcome 🚀");
  }, []);

  // ── Timers ──
  useEffect(() => { const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 4000); return () => clearInterval(t); }, []);

  // ── Search debounce ──
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // ── Toast ──
  const notify = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Cart ──
  const addToCart = useCallback((product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      return existing ? prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i) : [...prev, { product, qty }];
    });
    notify("Added to cart!");
  }, [notify]);

  const removeFromCart = useCallback((productId) => setCart((prev) => prev.filter((i) => i.product.id !== productId)), []);

  // ── Wishlist ──
  const toggleWishlist = useCallback((product) => {
    setWishlist((prev) => {
      const isIn = prev.some((p) => p.id === product.id);
      notify(isIn ? "Removed from wishlist" : "Added to wishlist ❤️");
      return isIn ? prev.filter((p) => p.id !== product.id) : [...prev, product];
    });
  }, [notify]);

  // ── Orders ──
  const addOrder = useCallback((order) => setOrders((prev) => [order, ...prev]), []);
  const addOrders = useCallback((newOrders) => { setOrders((prev) => [...newOrders, ...prev]); setCart([]); notify(`${newOrders.length} order(s) placed! 🎉`); }, [notify]);
  const updateOrder = useCallback((updated) => setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o)), []);

  // ── Admin ──
  const handleApprove = (id) => setAdminApps((prev) => prev.map((a) => a.id === id ? { ...a, status: "approved" } : a));
  const handleReject = (id) => setAdminApps((prev) => prev.map((a) => a.id === id ? { ...a, status: "rejected" } : a));

  // ── Disconnect ──
  const handleDisconnect = async () => {
    try { await disconnect(); } catch {}
    setUser(null); setMerchantStatus(null); setCart([]); setModal(null);
    notify("Wallet disconnected");
  };

  // ── Filtered products ──
  const filtered = products.filter((p) => {
    const mc = cat === "All" || p.cat === cat;
    const ms = p.name.toLowerCase().includes(searchDebounce.toLowerCase());
    return mc && ms;
  });
  const flashProducts = products.filter((p) => p.flash);

  // ── Countdown ──
  const h = Math.floor(countdown / 3600);
  const m = Math.floor((countdown % 3600) / 60);
  const s = countdown % 60;

  const isAdmin = walletAddr === SUPER_ADMIN_WALLET || user?.role === "admin";

  // ── Wallet gate ──
  if (!walletAddr && loaded) {
    return (
      <div className="app-shell">
        {toast && <Toast {...toast} />}
        <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#1A1A1A 0%,#2D1B4E 60%,#0D2B1A 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 44, fontFamily: "Syne,sans-serif", color: "white", marginBottom: 24 }}>S</div>
          <div style={{ fontWeight: 900, fontSize: 28, color: "white", fontFamily: "Syne,sans-serif", marginBottom: 8 }}>SolMarket</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 40, lineHeight: 1.6, maxWidth: 280 }}>Nigeria&apos;s on-chain marketplace. Connect your Solana wallet to shop.</div>
          <button style={{ background: SOL_GRAD, border: "none", borderRadius: 14, padding: "16px 40px", fontWeight: 800, fontSize: 16, color: "white", cursor: "pointer", width: "100%", maxWidth: 320 }} onClick={() => setModal("wallet")}>Connect Wallet to Enter</button>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 20 }}>🔒 Your wallet is your identity — no passwords</div>
        </div>
        {modal === "wallet" && <WalletModal onClose={() => setModal(null)} onConnectAdapter={handleManualConnect} notify={notify} />}
      </div>
    );
  }

  // ── Loading ──
  if (!loaded) {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Spinner color={PRIMARY} size={40} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {toast && <Toast {...toast} />}

      {/* ── TOP BAR ── */}
      <div style={{ background: PRIMARY, padding: "12px 14px 10px", position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", fontSize: 18, fontFamily: "Syne,sans-serif" }}>S</div>
            <span style={{ fontWeight: 900, fontSize: 20, color: "white", fontFamily: "Syne,sans-serif" }}>SolMarket</span>
          </div>
          {/* Right buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isAdmin && (
              <button onClick={() => setModal("admin")} style={{ background: "#FFD700", border: "none", color: "#1A1A1A", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 800 }}>👑 Admin</button>
            )}
            {merchantStatus === "approved" && !isAdmin && (
              <button style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 10, padding: "6px 10px", fontSize: 12, fontWeight: 700 }}>My Store</button>
            )}
            <div onClick={() => setModal("profile")} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "6px 10px", cursor: "pointer" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: ACCENT }} />
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "white" }}>{user?.username || shortAddr(walletAddr)}</span>
            </div>
          </div>
        </div>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
          <input
            style={{ width: "100%", background: WHITE, border: "none", borderRadius: 10, padding: "11px 14px 11px 40px", fontSize: 14, color: DARK, outline: "none" }}
            placeholder="Search on SolMarket"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Promo bar */}
      <div style={{ background: ORANGE, padding: "8px 16px", textAlign: "center", fontWeight: 700, fontSize: 13, color: "white" }}>📞 ORDER: 07006000000 | 02018883300</div>

      {/* SOL ticker */}
      <div style={{ background: "#1A1A1A", padding: "5px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: ACCENT, fontWeight: 700 }}>◎ SOL</span>
        <span style={{ fontSize: 12, color: "white", fontWeight: 700 }}>{priceNGN ? fmtN(Math.round(priceNGN)) : "Loading…"}</span>
        {priceUSD && <span style={{ fontSize: 11, color: "#888" }}>${priceUSD.toLocaleString()}</span>}
        <span style={{ fontSize: 10, color: "#555" }}>Live price</span>
      </div>

      {/* ── SCROLL AREA ── */}
      <div style={{ overflowY: "auto", paddingBottom: 72 }}>
        {/* Banner */}
        <div style={{ padding: "14px 0 10px" }}>
          <BannerCarousel bannerIdx={bannerIdx} onSwipe={(dir) => setBannerIdx((i) => (i + dir + BANNERS.length) % BANNERS.length)} />
        </div>

        {/* Quick cats */}
        <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 12px 14px" }}>
          {QUICK_CATS.map((c) => (
            <div key={c.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0, cursor: "pointer" }}>
              <div style={{ width: 58, height: 58, borderRadius: 14, background: c.bg + "18", border: `2px solid ${c.bg}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{c.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: DARK, textAlign: "center", maxWidth: 58, lineHeight: 1.2 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Flash Sales */}
        <div style={{ background: WHITE, borderRadius: 16, margin: "0 12px 14px", overflow: "hidden", border: `1px solid ${BORDER_C}` }}>
          <div style={{ background: RED, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16, color: "white", fontFamily: "Syne,sans-serif" }}>Flash Sales</div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 10 }}>TIME LEFT:</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {[h, m, s].map((v, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ background: DARK, color: "white", borderRadius: 8, padding: "4px 8px", fontWeight: 900, fontSize: 18, minWidth: 36, textAlign: "center", fontFamily: "Syne,sans-serif" }}>{String(v).padStart(2, "0")}</span>
                    {i < 2 && <span style={{ color: "white", fontWeight: 900 }}>:</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: BORDER_C }}>
            {flashProducts.map((p) => (
              <div key={p.id} onClick={() => { setModalData(p); setModal("product"); }} style={{ background: WHITE, padding: 10, cursor: "pointer" }}>
                <div style={{ position: "relative", background: "#FFF5F0", borderRadius: 10, height: 90, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, marginBottom: 8 }}>
                  {p.img}
                  <div style={{ position: "absolute", top: 4, right: 4, background: RED, color: "white", borderRadius: 5, padding: "1px 6px", fontSize: 10, fontWeight: 800 }}>-{p.off}%</div>
                </div>
                <div style={{ fontWeight: 900, fontSize: 14, color: ORANGE, fontFamily: "Syne,sans-serif" }}>{fmtN(p.price)}</div>
                <div style={{ color: MUTED, fontSize: 9, marginTop: 2 }}>{p.stock} left</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 12px 12px" }}>
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: 20, border: `1.5px solid ${cat === c ? PRIMARY : BORDER_C}`, background: cat === c ? PRIMARY : WHITE, color: cat === c ? "white" : DARK, fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>{c}</button>
          ))}
        </div>

        {/* Products grid */}
        <div style={{ padding: "0 14px 10px" }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: DARK, fontFamily: "Syne,sans-serif", marginBottom: 10 }}>
            {cat === "All" ? "All Products" : cat} <span style={{ color: MUTED, fontWeight: 600, fontSize: 13 }}>({filtered.length})</span>
          </div>
        </div>
        <div style={{ padding: "0 12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {filtered.map((p) => (
            <PCard key={p.id} product={p} onOpen={(prod) => { setModalData(prod); setModal("product"); }} wishlist={wishlist} onToggleWish={toggleWishlist} />
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: MUTED, gridColumn: "1/-1" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 800, color: DARK, fontSize: 17 }}>No products found</div>
            </div>
          )}
        </div>

        {/* Why SolMarket */}
        <div style={{ background: WHITE, borderRadius: 16, margin: "0 12px 16px", padding: 18, border: `1px solid ${BORDER_C}` }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: DARK, marginBottom: 14, fontFamily: "Syne,sans-serif" }}>Why SolMarket?</div>
          {[["🔗","Wallet Sign-in Only","Your Solana wallet is your identity — no passwords."],["🛡️","Verified Merchants","Every seller is on-chain approved."],["⚡","Real-time Tracking","Track from payment to doorstep."],["📦","Pay on Delivery","SOL released only when you confirm delivery."]].map(([icon, title, desc]) => (
            <div key={title} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#F5F0FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: DARK }}>{title}</div>
                <div style={{ color: MUTED, fontSize: 12, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div className="bottom-nav">
        {[
          { icon: "🏠", label: "Home", action: null },
          { icon: "📦", label: "Track", action: () => setModal("track") },
          { icon: "🛒", label: "Cart", badge: cart.length, action: () => setModal("cart") },
          { icon: "❤️", label: "Wishlist", action: () => setModal("wishlist") },
          { icon: "👤", label: "Account", action: () => setModal("profile") },
        ].map((item) => (
          <button key={item.label} className="nav-btn" onClick={item.action || undefined}>
            <div style={{ position: "relative" }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              {item.badge > 0 && <div style={{ position: "absolute", top: -4, right: -6, width: 16, height: 16, borderRadius: "50%", background: ORANGE, color: "white", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.badge}</div>}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: MUTED }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── MODALS ── */}
      {modal === "wallet" && <WalletModal onClose={() => setModal(null)} onConnectAdapter={handleManualConnect} notify={notify} />}
      {modal === "product" && modalData && (
        <ProductModal product={modalData} onClose={() => { setModal(null); setModalData(null); }} onAddCart={addToCart}
          walletAddr={walletAddr} connection={connection} walletAdapter={wallet?.adapter} ngnToSol={ngnToSol}
          notify={notify} onOrderPlaced={(o) => { addOrder(o); }} />
      )}
      {modal === "cart" && <CartModal cart={cart} onClose={() => setModal(null)} onRemove={removeFromCart} onOrder={(o) => addOrder(o)} walletAddr={walletAddr} />}
      {modal === "track" && <TrackModal orders={orders} walletAddr={walletAddr} onClose={() => setModal(null)} connection={connection} walletName={walletName} walletAdapter={wallet?.adapter} ngnToSol={ngnToSol} notify={notify} onOrderUpdate={updateOrder} initialOrder={null} />}
      {modal === "wishlist" && <WishlistModal wishlist={wishlist} onClose={() => setModal(null)} onToggle={toggleWishlist} onAddCart={addToCart} />}
      {modal === "profile" && (
        <ProfileModal user={user} walletAddr={walletAddr} walletName={walletName} orders={orders} cart={cart} merchantStatus={merchantStatus}
          onClose={() => setModal(null)} onDisconnect={handleDisconnect}
          onOpenTrack={() => setModal("track")} onOpenCart={() => setModal("cart")}
          onOpenAdmin={() => setModal("admin")} onOpenMerchant={() => {}} />
      )}
      {modal === "admin" && isAdmin && (
        <AdminModal walletAddr={walletAddr} onClose={() => setModal(null)} orders={orders} products={products}
          adminApps={adminApps} onApprove={handleApprove} onReject={handleReject} notify={notify} />
      )}
    </div>
  );
}
