import { Fragment, useEffect, useState, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import {
  getProducts,
  addProduct,
  deleteProduct,
  updateProduct,
} from "../api/productService";
import { useGoogleLogin } from "@react-oauth/google";


/* ─── Helpers ─────────────────────────────────────────────────── */

function StarRating({ rate = 0, count = 0 }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(rate));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {stars.map((filled, i) => (
          <span
            key={i}
            style={{ fontSize: "0.75rem" }}
            className={filled ? "star-filled" : "star-empty"}
          >
            ★
          </span>
        ))}
      </div>
      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
        {rate} ({count})
      </span>
    </div>
  );
}

function CategoryBadge({ category }) {
  const map = {
    electronics: "badge-blue",
    jewelery: "badge-cyan",
    "men's clothing": "badge-blue",
    "women's clothing": "badge-cyan",
  };
  const cls = map[category?.toLowerCase()] || "badge-blue";
  return (
    <span className={`badge ${cls}`} style={{ marginBottom: 8 }}>
      {category}
    </span>
  );
}

const CATEGORIES = ["All", "Electronics", "Jewelery", "Men's Clothing", "Women's Clothing"];

const STATS = [
  { value: "50K+", label: "Happy Customers" },
  { value: "12K+", label: "Products" },
  { value: "Free", label: "Shipping Worldwide" },
  { value: "24/7", label: "Customer Support" },
];

/* ─── Animation Variants ─────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const cardVariant = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.065, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.2 } },
};

const modalVariant = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.93, transition: { duration: 0.2 } },
};

/* ─── Main Component ─────────────────────────────────────────── */

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", price: "" });
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [wishlist, setWishlist] = useState(new Set());
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState("");
  const productsRef = useRef(null);

  const handleLogout = () => setUser(null);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo`,
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        const profile = await res.json();
        setUser({
          picture: profile.picture,
          given_name: profile.given_name,
          name: profile.name,
          email: profile.email,
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    },
    onError: () => console.log("Google Login Failed"),
  });

  /* Fetch */
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
      setFiltered(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  /* Filter + Search */
  useEffect(() => {
    let list = [...products];
    if (activeCategory !== "All") {
      list = list.filter(
        (p) => p.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title?.toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [activeCategory, products, search]);

  /* CRUD */
  const PREMIUM_PRODUCTS = [
    {
      title: "Meta Quest 3 VR Headset",
      price: 499.99,
      description: "Experience the next generation of mixed reality with Meta Quest 3. Breakthrough Meta Reality technology seamlessly blends the physical and virtual worlds, giving you a fully immersive experience with richer colors and more natural movement.",
      image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=600&q=80",
      category: "electronics",
      rating: { rate: 4.8, count: 2341 },
    },
    {
      title: "Apple Watch Ultra 2",
      price: 799.99,
      description: "The most rugged and capable Apple Watch ever. Engineered for the extremes, with an extra-bright display, precision GPS, and the most advanced health sensors. A titanium case built for any adventure.",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80",
      category: "electronics",
      rating: { rate: 4.9, count: 1876 },
    },
    {
      title: "Sony WH-1000XM5 Headphones",
      price: 349.99,
      description: "Industry-leading noise canceling with two processors and eight microphones. Crystal-clear hands-free calling and up to 30-hour battery life. The perfect companion for work or travel.",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
      category: "electronics",
      rating: { rate: 4.7, count: 5892 },
    },
    {
      title: "DJI Mini 4 Pro Drone",
      price: 959.99,
      description: "Omnidirectional obstacle sensing, 4K/60fps HDR video, and a 34-minute flight time make this the ultimate compact drone. Real-time 1080p transmission up to 20 km.",
      image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80",
      category: "electronics",
      rating: { rate: 4.8, count: 1124 },
    },
    {
      title: "Sony Alpha 7 IV Camera",
      price: 2499.99,
      description: "A true step-change in the Alpha 7 series with a 33MP full-frame sensor, cutting-edge AI-based autofocus, and 4K 60p video. Perfect for both professional stills and cinema-quality footage.",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80",
      category: "electronics",
      rating: { rate: 4.9, count: 987 },
    },
    {
      title: "MacBook Pro 16\" M3 Max",
      price: 3499.99,
      description: "Supercharged by M3 Max, with a stunning Liquid Retina XDR display, up to 22 hours of battery life, and pro-level connectivity. The world's best laptop for serious creators.",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
      category: "electronics",
      rating: { rate: 4.9, count: 3210 },
    },
  ];

  const addProductIndexRef = useRef(0);

  const handleAddProduct = async () => {
    const template = PREMIUM_PRODUCTS[addProductIndexRef.current % PREMIUM_PRODUCTS.length];
    addProductIndexRef.current += 1;

    const newProduct = {
      ...template,
      id: Date.now(),
    };
    try {
      const result = await addProduct(newProduct);
      const merged = { ...newProduct, ...result, image: newProduct.image, rating: newProduct.rating };
      setProducts((prev) => [merged, ...prev]);
    } catch (err) {
      console.error("Error adding product:", err);
      setProducts((prev) => [newProduct, ...prev]);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (id <= 20) await deleteProduct(id);
    } catch { /* ignore error during delete */ }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (selectedProduct?.id === id) setSelectedProduct(null);
  };

  const handleUpdate = async () => {
    try {
      if (selectedProduct.id <= 20) {
        await updateProduct(selectedProduct.id, {
          ...selectedProduct,
          title: editForm.title,
          price: parseFloat(editForm.price),
        });
      }
      const updated = { ...selectedProduct, title: editForm.title, price: parseFloat(editForm.price) };
      setProducts((prev) => prev.map((p) => (p.id === selectedProduct.id ? updated : p)));
      setSelectedProduct(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating product:", err);
    }
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setIsEditing(false);
    setEditForm({ title: product.title, price: product.price });
  };

  const toggleWishlist = (id) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    setCartCount((c) => c + 1);
  };

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <Fragment>

      {/* ═══════════════════════ NAVBAR ═══════════════════════════ */}
      <motion.nav
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong main-nav"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "0 2rem",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 14px rgba(59,130,246,0.5)",
            }}
          >
            <span style={{ color: "white", fontWeight: 900, fontSize: "1rem" }}>H</span>
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: "1.25rem",
              letterSpacing: "-0.02em",
            }}
            className="gradient-text nav-logo-text"
          >
            Hunaif
          </span>
        </div>

        {/* Search */}
        <div
          className="glass nav-search"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 10,
            padding: "0 14px",
            flex: "1 1 auto",
            maxWidth: 420,
            height: 42,
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="search-input"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "0.875rem",
              fontFamily: "Inter, sans-serif",
              width: "100%",
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>

          {/* Cart */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            style={{
              position: "relative",
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.25)",
              borderRadius: 10,
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--accent-light)",
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 1.6 }}
                animate={{ scale: 1 }}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                  color: "white",
                  borderRadius: "999px",
                  width: 18,
                  height: 18,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cartCount}
              </motion.span>
            )}
          </motion.button>

          {/* Add Product */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAddProduct}
            className="btn-primary"
            style={{
              padding: "9px 18px",
              borderRadius: 10,
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="btn-primary-text">Add Product</span>
          </motion.button>

          {/* Auth */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img
                src={user.picture}
                alt="Profile"
                style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid var(--accent)", objectFit: "cover" }}
              />
              <span style={{ fontSize: "0.85rem", color: "var(--text-sub)", display: "none" }}>
                Hi, {user.given_name}
              </span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="btn-danger"
                style={{ padding: "8px 14px", borderRadius: 10, fontSize: "0.8rem" }}
              >
                Logout
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => googleLogin()}
              className="auth-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "9px 16px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "var(--text-primary)",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.11)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              }}
            >
              {/* Google G logo SVG */}
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="auth-btn-text">Sign in with Google</span>
            </motion.button>
          )}
        </div>
      </motion.nav>

      {/* ═══════════════════════ HERO ════════════════════════════ */}
      <section
        className="hero-section"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "100px 2rem 120px",
          textAlign: "center",
        }}
      >
        {/* Blobs */}
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />

        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            pointerEvents: "none",
          }}
        />

        <motion.div
          style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto" }}
          initial="hidden"
          animate="visible"
        >

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="hero-title"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              marginBottom: 24,
            }}
          >
            Shop the Future
            <br />
            <span className="gradient-text">Discover. Desire.</span>
            <br />
            <span style={{ color: "var(--text-primary)" }}>Own It.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="hero-subtitle"
            style={{
              fontSize: "1.1rem",
              color: "var(--text-sub)",
              maxWidth: 520,
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}
          >
            Curated collections of premium electronics, fashion, and accessories — delivered to your doorstep.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={scrollToProducts}
              className="btn-primary"
              style={{
                padding: "14px 36px",
                borderRadius: 12,
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Explore Collection
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-ghost"
              style={{ padding: "14px 32px", borderRadius: 12, fontSize: "0.95rem" }}
            >
              View Deals
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════ STATS ════════════════════════════ */}
      <section style={{ padding: "0 2rem 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div
          className="stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
          }}
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
            >
              <div
                style={{
                  fontSize: "1.9rem",
                  fontWeight: 800,
                  marginBottom: 4,
                }}
                className="gradient-text"
              >
                {s.value}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ PRODUCT SECTION ════════════════════ */}
      <section
        ref={productsRef}
        className="products-section"
        style={{ padding: "0 2rem 100px", maxWidth: 1300, margin: "0 auto" }}
      >
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
            <div>
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  marginBottom: 4,
                }}
              >
                {loading ? (
                  <span style={{ color: "var(--text-muted)" }}>Loading products<span style={{ animation: "shimmer 1s infinite" }}>...</span></span>
                ) : (
                  <>
                    {activeCategory === "All" ? "All Products" : activeCategory}
                    <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "1rem", marginLeft: 12 }}>
                      ({filtered.length} items)
                    </span>
                  </>
                )}
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.87rem" }}>
                Premium quality, handpicked for you
              </p>
            </div>
          </div>

          {/* Category Pills */}
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              paddingBottom: 4,
              scrollbarWidth: "none",
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-pill${activeCategory === cat ? " active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Divider */}
        <div className="divider" style={{ marginBottom: 36 }} />

        {/* Product Grid — Amazon Style */}
        <div
          className="products-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: 20,
          }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                custom={i}
                variants={cardVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                onClick={() => handleView(product)}
                className="amz-card"
                style={{ position: "relative", cursor: "pointer" }}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
              >
                {/* Wishlist */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                  className="amz-wishlist-btn"
                  style={{
                    position: "absolute", top: 10, right: 10, zIndex: 3,
                    background: wishlist.has(product.id) ? "rgba(239,68,68,0.18)" : "rgba(15,23,42,0.7)",
                    border: `1px solid ${wishlist.has(product.id) ? "#ef4444" : "rgba(255,255,255,0.15)"}`,
                    borderRadius: "50%", width: 32, height: 32,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: wishlist.has(product.id) ? "#ef4444" : "var(--text-muted)",
                    backdropFilter: "blur(6px)", cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24"
                    fill={wishlist.has(product.id) ? "currentColor" : "none"}
                    stroke="currentColor" strokeWidth={2}
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                </button>

                {/* ── Image zone (pure white bg like Amazon) */}
                <div className="amz-img-wrap">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="amz-img"
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.07)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  />
                </div>

                {/* ── Info zone */}
                <div className="amz-info">

                  {/* Title */}
                  <h3 className="amz-title">{product.title}</h3>

                  {/* Rating row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "6px 0 10px" }}>
                    {/* Star bar */}
                    <div style={{ display: "flex", gap: 1 }}>
                      {Array.from({ length: 5 }, (_, idx) => {
                        const rate = product.rating?.rate ?? 0;
                        const full = idx < Math.floor(rate);
                        const half = !full && idx < rate;
                        return (
                          <svg key={idx} width="13" height="13" viewBox="0 0 24 24">
                            {full
                              ? <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#3b82f6" stroke="none" />
                              : half
                                ? <>
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke="#3b82f6" strokeWidth={1.5} />
                                  <clipPath id={`h${idx}`}><rect x="0" y="0" width="12" height="24" /></clipPath>
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#3b82f6" clipPath={`url(#h${idx})`} />
                                </>
                                : <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth={1.5} />
                            }
                          </svg>
                        );
                      })}
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#60a5fa", fontWeight: 600 }}>
                      {product.rating?.rate ?? "—"}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      ({(product.rating?.count ?? 0).toLocaleString()})
                    </span>
                  </div>

                  {/* Price — Amazon split style */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 1, marginBottom: 12 }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f0f4ff", marginTop: 3 }}>$</span>
                    <span style={{ fontSize: "1.65rem", fontWeight: 900, color: "#f0f4ff", lineHeight: 1.1 }}>
                      {String(product.price).split(".")[0]}
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f0f4ff", marginTop: 3 }}>
                      {String(product.price).includes(".") ? `.${String(product.price).split(".")[1].padEnd(2, "0")}` : ".00"}
                    </span>
                  </div>

                  {/* Add to Cart — Web Design style */}
                  <motion.button
                    whileHover={{ filter: "brightness(1.08)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(e); }}
                    className="amz-cart-btn"
                  >
                    Add to Cart
                  </motion.button>

                  {/* ── Buy Now */}
                  <motion.button
                    whileHover={{ filter: "brightness(1.08)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(e); }}
                    className="amz-buy-btn"
                  >
                    Buy Now
                  </motion.button>

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                    className="amz-delete-btn"
                  >
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                    Remove item
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>No products found</p>
            <p style={{ fontSize: "0.87rem", marginTop: 4 }}>
              Try adjusting your filters or search term
            </p>
          </motion.div>
        )}
      </section>

      {/* ════════════════════ PRODUCT MODAL ══════════════════════ */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
            className="modal-container"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 5, 15, 0.80)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              padding: 20,
            }}
          >
            <motion.div
              variants={modalVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="glass-strong modal-content"
              style={{
                borderRadius: 24,
                maxWidth: 740,
                width: "100%",
                padding: "32px",
                position: "relative",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedProduct(null)}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="modal-grid-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>

                {/* Image */}
                <div
                  className="modal-img-wrap"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                    minHeight: 280,
                    border: "1px solid var(--border)",
                  }}
                >
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.title}
                    style={{ maxHeight: 280, maxWidth: "100%", objectFit: "contain" }}
                  />
                </div>

                {/* Details */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <CategoryBadge category={selectedProduct.category} />

                  {isEditing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="input-dark"
                        placeholder="Product title"
                      />
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="input-dark"
                        placeholder="Price"
                      />
                    </div>
                  ) : (
                    <h2
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        lineHeight: 1.4,
                        marginBottom: 14,
                      }}
                    >
                      {selectedProduct.title}
                    </h2>
                  )}

                  <StarRating
                    rate={selectedProduct.rating?.rate}
                    count={selectedProduct.rating?.count}
                  />

                  <p
                    style={{
                      color: "var(--text-sub)",
                      fontSize: "0.85rem",
                      lineHeight: 1.7,
                      margin: "14px 0 20px",
                      maxHeight: 120,
                      overflowY: "auto",
                      flexGrow: 1,
                    }}
                  >
                    {selectedProduct.description}
                  </p>

                  <div className="divider" style={{ marginBottom: 20 }} />

                  {isEditing ? (
                    <div style={{ display: "flex", gap: 10 }}>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={handleUpdate}
                        className="btn-primary"
                        style={{ flex: 1, padding: "12px 0", borderRadius: 12, fontSize: "0.9rem" }}
                      >
                        Save Changes
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setIsEditing(false)}
                        className="btn-ghost"
                        style={{ flex: 1, padding: "12px 0", borderRadius: 12, fontSize: "0.9rem" }}
                      >
                        Cancel
                      </motion.button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <span
                        style={{ fontSize: "2rem", fontWeight: 900 }}
                        className="gradient-text"
                      >
                        ${selectedProduct.price}
                      </span>

                      <div style={{ display: "flex", gap: 10 }}>
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setIsEditing(true)}
                          className="btn-ghost"
                          style={{ padding: "10px 18px", borderRadius: 10, fontSize: "0.85rem" }}
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={handleAddToCart}
                          className="btn-primary"
                          style={{
                            padding: "10px 20px",
                            borderRadius: 10,
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
                          </svg>
                          Add to Cart
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════ FOOTER ═════════════════════════ */}
      <footer
        className="glass"
        style={{
          borderTop: "1px solid var(--border)",
          marginTop: 20,
        }}
      >
        {/* Top */}
        <div
          className="footer-top"
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            padding: "60px 2rem 40px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 40,
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "white", fontWeight: 900, fontSize: "1rem" }}>H</span>
              </div>
              <span className="gradient-text" style={{ fontWeight: 800, fontSize: "1.1rem" }}>HUNAIF</span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.7, maxWidth: 220 }}>
              Your destination for premium products at competitive prices.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.9rem", marginBottom: 16 }}>
              Shop
            </h4>
            {["Electronics", "Jewelry", "Men's Fashion", "Women's Fashion", "New Arrivals"].map(link => (
              <div key={link} style={{ marginBottom: 10 }}>
                <a
                  href="#"
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-light)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  {link}
                </a>
              </div>
            ))}
          </div>

          {/* Support */}
          <div>
            <h4 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.9rem", marginBottom: 16 }}>
              Support
            </h4>
            {["FAQ", "Shipping Policy", "Returns", "Track Order", "Contact Us"].map(link => (
              <div key={link} style={{ marginBottom: 10 }}>
                <a
                  href="#"
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-light)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  {link}
                </a>
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <div>
            <h4 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.9rem", marginBottom: 16 }}>
              Stay Updated
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: 14, lineHeight: 1.6 }}>
              Subscribe to get exclusive deals and early access.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input-dark"
                placeholder="your@email.com"
                type="email"
                style={{ fontSize: "0.82rem" }}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="btn-primary"
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  fontSize: "0.8rem",
                  flexShrink: 0,
                }}
              >
                →
              </motion.button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="divider" />
        <div
          className="footer-bottom"
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            padding: "20px 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            © 2025 Hunaif Store. All rights reserved. Built by Hunaif.
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            {["Privacy Policy", "Terms of Service", "Cookies"].map(link => (
              <a
                key={link}
                href="#"
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.78rem",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-light)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </Fragment>
  );
}
