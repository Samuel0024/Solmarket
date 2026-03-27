// lib/constants.js

export const PRIMARY = "#9945FF";
export const ACCENT = "#14F195";
export const ORANGE = "#FF6B00";
export const RED = "#E8001C";
export const DARK = "#1A1A1A";
export const MUTED = "#888";
export const BORDER_C = "#E8E8E8";
export const WHITE = "#FFFFFF";
export const SOL_GRAD = "linear-gradient(135deg,#9945FF 0%,#14F195 100%)";

export const SUPER_ADMIN_WALLET = process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET || "7tsf2T6S9bPPVSwT4AqaWRTDuneeiy5362BgQnA3shcL";
export const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET || "7tsf2T6S9bPPVSwT4AqaWRTDuneeiy5362BgQnA3shcL";
export const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC || "https://api.mainnet-beta.solana.com";

export const fmtN = (n) => "₦" + Number(n).toLocaleString();
export const fmtSOL = (n) => parseFloat(n.toFixed(4)) + " SOL";
export const stars = (r) => "★".repeat(Math.floor(r)) + "☆".repeat(5 - Math.floor(r));
export const shortAddr = (a) => (a ? a.slice(0, 4) + "..." + a.slice(-4) : "");
export const genTrackId = () => "SOL-" + Date.now().toString(36).toUpperCase().slice(-6) + "-" + Math.random().toString(36).slice(2, 5).toUpperCase();
export const genTxHash = () => Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 6)).join("").toUpperCase().slice(0, 44);

export const BANNERS = [
  { id: 1, bg: "linear-gradient(120deg,#6B21E8,#9945FF)", emoji: "📱", tag: "PHONE PLUG", tagBg: "#FF6B00", title: "Your plug for the best phones", sub: "UP TO 20% OFF" },
  { id: 2, bg: "linear-gradient(120deg,#0EA66D,#14F195)", emoji: "👟", tag: "SOL DEALS", tagBg: "#E8001C", title: "Flash fashion at chain speed", sub: "UP TO 50% OFF" },
  { id: 3, bg: "linear-gradient(120deg,#FF6B00,#FFB347)", emoji: "🎮", tag: "GAMING WEEK", tagBg: "#9945FF", title: "Level up your setup", sub: "UP TO 35% OFF" },
  { id: 4, bg: "linear-gradient(120deg,#E8001C,#FF6B6B)", emoji: "🏠", tag: "HOME DEALS", tagBg: "#14F195", title: "Refresh your space on-chain", sub: "UP TO 60% OFF" },
];

export const CATS = ["All", "Phones", "Electronics", "Fashion", "Gaming", "Home", "Sports", "Beauty", "Books", "Food"];

export const QUICK_CATS = [
  { icon: "🔥", label: "Awoof Deals", bg: "#FF6B00" },
  { icon: "🏷️", label: "Up to 80% Off", bg: "#E8001C" },
  { icon: "💎", label: "SOL Exclusive", bg: "#9945FF" },
  { icon: "👔", label: "Men's Fashion", bg: "#1A1A1A" },
  { icon: "👗", label: "Women's Fashion", bg: "#D63384" },
  { icon: "📦", label: "Fast Delivery", bg: "#FF6B00" },
  { icon: "🎮", label: "Gaming", bg: "#6610F2" },
  { icon: "🏠", label: "Home & Garden", bg: "#198754" },
];

export const TRACK_STAGES = [
  { key: "placed", label: "Order Placed", icon: "📋", color: "#9945FF" },
  { key: "confirmed", label: "Payment Confirmed", icon: "✅", color: "#14F195" },
  { key: "packed", label: "Packed & Ready", icon: "📦", color: "#FF6B00" },
  { key: "shipped", label: "Out for Delivery", icon: "🚚", color: "#4A90E2" },
  { key: "delivered", label: "Delivered", icon: "🎉", color: "#0EA66D" },
];

export const INITIAL_PRODUCTS = [
  { id: 1, name: "2L Industrial 8500W Blender & Dry Grinder", price: 21750, oldPrice: 60000, off: 64, img: "🥤", cat: "Home", stock: 100, rating: 4.3, reviews: 230, seller: "KitchenHub.sol", flash: true, sellerId: null, sellerWallet: null, deliveryFee: 800 },
  { id: 2, name: "20000mAh Ultra Slim Power Bank Fast Charge", price: 7800, oldPrice: 15000, off: 48, img: "🔋", cat: "Electronics", stock: 259, rating: 4.5, reviews: 512, seller: "TechStore.sol", flash: true, sellerId: null, sellerWallet: null, deliveryFee: 500 },
  { id: 3, name: "20 Litres Microwave Oven Hisense", price: 77075, oldPrice: 95000, off: 19, img: "📦", cat: "Home", stock: 90, rating: 4.1, reviews: 87, seller: "ApplianceKing.sol", flash: true, sellerId: null, sellerWallet: null, deliveryFee: 2500 },
  { id: 4, name: "Redmi A5 Smartphone 4GB RAM 128GB", price: 89000, oldPrice: 110000, off: 19, img: "📱", cat: "Phones", stock: 45, rating: 4.6, reviews: 891, seller: "PhoneVault.sol", flash: false, sellerId: null, sellerWallet: null, deliveryFee: 1200 },
  { id: 5, name: "Samsung 43in 4K Smart TV Crystal UHD", price: 265000, oldPrice: 310000, off: 15, img: "📺", cat: "Electronics", stock: 22, rating: 4.7, reviews: 340, seller: "SmartGadget.sol", flash: false, sellerId: null, sellerWallet: null, deliveryFee: 3500 },
  { id: 6, name: "Nike Air Max 270 Running Shoes", price: 45000, oldPrice: 58000, off: 22, img: "👟", cat: "Fashion", stock: 78, rating: 4.4, reviews: 203, seller: "SneakerChain.sol", flash: false, sellerId: null, sellerWallet: null, deliveryFee: 700 },
  { id: 7, name: "PS5 DualSense Wireless Controller", price: 38000, oldPrice: 48000, off: 21, img: "🎮", cat: "Gaming", stock: 14, rating: 4.9, reviews: 672, seller: "GamersDAO.sol", flash: false, sellerId: null, sellerWallet: null, deliveryFee: 600 },
  { id: 8, name: "JBL Charge 5 Portable Bluetooth Speaker", price: 32000, oldPrice: 42000, off: 24, img: "🔊", cat: "Electronics", stock: 33, rating: 4.7, reviews: 445, seller: "AudioVault.sol", flash: false, sellerId: null, sellerWallet: null, deliveryFee: 700 },
  { id: 9, name: "Men's Slim Fit Suit 3-Piece Navy Blue", price: 18500, oldPrice: 25000, off: 26, img: "👔", cat: "Fashion", stock: 55, rating: 4.2, reviews: 128, seller: "StyleSOL.sol", flash: false, sellerId: null, sellerWallet: null, deliveryFee: 800 },
  { id: 10, name: "Dyson V11 Cordless Vacuum Cleaner", price: 185000, oldPrice: 220000, off: 16, img: "🧹", cat: "Home", stock: 8, rating: 4.8, reviews: 256, seller: "CleanChain.sol", flash: false, sellerId: null, sellerWallet: null, deliveryFee: 2000 },
  { id: 11, name: "MacBook Air M2 13in 8GB 256GB", price: 850000, oldPrice: 980000, off: 13, img: "💻", cat: "Electronics", stock: 12, rating: 4.9, reviews: 1024, seller: "AppleSOL.sol", flash: false, sellerId: null, sellerWallet: null, deliveryFee: 3000 },
  { id: 12, name: "Canon EOS R50 Mirrorless Camera Kit", price: 420000, oldPrice: 500000, off: 16, img: "📷", cat: "Electronics", stock: 7, rating: 4.8, reviews: 189, seller: "CamVault.sol", flash: false, sellerId: null, sellerWallet: null, deliveryFee: 2500 },
];
