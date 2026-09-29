import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ShoppingBag, Armchair, X } from "lucide-react";
import { isConfigured } from "./lib/supabase";
import { fetchSelfOrderData, submitSelfOrder } from "./lib/api";
import { formatRupiah, getTokenFromLocation } from "./lib/format";
import { useCart } from "./lib/useCart";
import MenuCard from "./components/MenuCard";
import Logo from "./components/Logo";
import CartSheet from "./components/CartSheet";
import OrderSuccess from "./components/OrderSuccess";
import { FullLoading, FullMessage } from "./components/States";

const PACKAGE_TAB = "__packages__";
const lastOrderKey = (token) => `so-last-order:${token}`;

export default function App() {
  const token = useMemo(getTokenFromLocation, []);

  if (!isConfigured) {
    return (
      <FullMessage title="Aplikasi belum dikonfigurasi">
        Isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> di environment variables.
      </FullMessage>
    );
  }
  if (!token) {
    return (
      <FullMessage title="Scan QR Code di meja Anda">
        Buka kamera ponsel dan arahkan ke QR Code yang ada di meja untuk mulai memesan.
      </FullMessage>
    );
  }
  return <SelfOrder token={token} />;
}

function SelfOrder({ token }) {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState(null);
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [placed, setPlaced] = useState(() => {
    try {
      const raw = JSON.parse(sessionStorage.getItem(lastOrderKey(token)));
      return raw || null;
    } catch {
      return null;
    }
  });
  const cart = useCart(token);
  const tabsRef = useRef(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetchSelfOrderData(token);
      setData(res);
    } catch (e) {
      setLoadError(e.message || "Gagal memuat menu");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Normalisasi menu & paket ke satu bentuk item
  const { categories, items, menuMap } = useMemo(() => {
    if (!data || data.error) return { categories: [], items: [], menuMap: new Map() };
    const menus = (data.menus || []).map((m) => ({
      type: "MENU", id: m.id, name: m.name, price: Number(m.price), photo: m.photo_url, categoryId: m.category_id,
    }));
    const pkgs = (data.packages || []).map((p) => ({
      type: "PACKAGE", id: p.id, name: p.name, price: Number(p.price), photo: p.photo_url, categoryId: PACKAGE_TAB,
      desc: (p.items || []).map((i) => `${i.qty}x ${i.name}`).join(", "),
    }));
    const usedCats = new Set(menus.map((m) => m.categoryId));
    const cats = (data.categories || []).filter((c) => usedCats.has(c.id));
    if (pkgs.length) cats.push({ id: PACKAGE_TAB, name: "Paket" });
    const all = [...menus, ...pkgs];
    return { categories: cats, items: all, menuMap: new Map(all.map((i) => [`${i.type}:${i.id}`, i])) };
  }, [data]);

  // Sinkronkan keranjang tersimpan dengan menu terbaru (harga berubah / menu habis)
  const reconciled = useRef(false);
  useEffect(() => {
    if (menuMap.size && !reconciled.current) {
      reconciled.current = true;
      cart.reconcile(menuMap);
    }
  }, [menuMap, cart]);

  useEffect(() => {
    if (categories.length && !tab) setTab(categories[0].id);
  }, [categories, tab]);

  const query = search.trim().toLowerCase();
  const visible = useMemo(() => {
    if (query) return items.filter((i) => i.name.toLowerCase().includes(query));
    return items.filter((i) => i.categoryId === tab);
  }, [items, tab, query]);

  async function handleSubmit({ name, phone }) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await submitSelfOrder({
        token,
        name,
        phone,
        items: cart.list.map((i) => ({ item_type: i.type, id: i.id, qty: i.qty, notes: i.notes || "" })),
      });
      cart.clear();
      setCartOpen(false);
      try {
        sessionStorage.setItem(lastOrderKey(token), JSON.stringify(res));
      } catch {
        /* abaikan */
      }
      setPlaced(res);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setSubmitError(e.message || "Gagal mengirim pesanan. Periksa koneksi Anda.");
      if (/tidak tersedia/i.test(e.message || "")) load();
    } finally {
      setSubmitting(false);
    }
  }

  function newOrder() {
    try {
      sessionStorage.removeItem(lastOrderKey(token));
    } catch {
      /* abaikan */
    }
    setPlaced(null);
  }

  if (loadError) {
    return (
      <FullMessage
        icon="wifi"
        title="Gagal memuat menu"
        action={<button onClick={load} className="btn-primary mt-5">Coba lagi</button>}
      >
        {loadError}
      </FullMessage>
    );
  }
  if (!data) return <FullLoading />;
  if (data.error === "TABLE_NOT_FOUND") {
    return (
      <FullMessage title="QR Code tidak valid">
        Meja tidak ditemukan atau QR Code sudah tidak berlaku. Silakan hubungi pelayan.
      </FullMessage>
    );
  }

  if (placed) return <OrderSuccess order={placed} onNewOrder={newOrder} />;

  const tableNumber = data.table.table_number;

  return (
    <div className="mx-auto min-h-screen max-w-lg overflow-x-clip pb-28">
      {/* ============ HERO / HEADER ============ */}
      <header className="pt-safe relative overflow-hidden bg-primary-dark text-white">
        {/* Gradasi dan pola dipisah jadi lapisan sendiri: keduanya memakai background-image,
            kalau digabung di satu elemen yang satu akan menimpa yang lain. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-dark via-primary to-primary" />
        <div className="bg-fern pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-20 top-24 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative flex flex-col items-center px-5 pb-12 pt-8 text-center animate-fade-up">
          <div className="rounded-full bg-white p-1 shadow-xl ring-4 ring-white/25">
            <Logo size={104} eager />
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[.25em] text-white/70">Selamat datang di</p>
          <h1 className="font-display mt-1 text-[28px] leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.25)]">{data.outlet.name}</h1>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold backdrop-blur ring-1 ring-white/20">
            <Armchair className="h-3.5 w-3.5" />
            Meja {tableNumber}
          </span>
        </div>
      </header>

      {/* ============ SEARCH + KATEGORI (menempel di atas saat scroll) ============ */}
      <div className="sticky top-0 z-30 -mt-6 rounded-t-[28px] bg-cream/95 px-4 pb-2 pt-4 shadow-[0_-8px_20px_-12px_rgba(0,0,0,.25)] backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari makanan atau minuman"
            className="input !rounded-full !pl-10 !pr-10 shadow-soft"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {!query && (
          <div ref={tabsRef} className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setTab(c.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === c.id
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "bg-white text-gray-600 shadow-soft ring-1 ring-black/[.04]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <main className="space-y-3.5 px-4 pt-3">
        {visible.map((item) => (
          <MenuCard
            key={`${item.type}:${item.id}`}
            item={item}
            qty={cart.qtyOf(item.type, item.id)}
            onChange={(q) => cart.setQty(item, q)}
          />
        ))}
        {visible.length === 0 && (
          <p className="py-16 text-center text-sm text-gray-400">
            {items.length === 0 ? "Menu belum tersedia." : "Menu tidak ditemukan."}
          </p>
        )}
      </main>

      <footer className="mt-10 flex flex-col items-center gap-2 px-6 text-center">
        <Logo size={44} className="opacity-70" />
        <p className="text-[11px] uppercase tracking-[.2em] text-gray-400">One step closer to nature</p>
      </footer>

      {cart.count > 0 && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg px-4">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full animate-fade-up items-center justify-between rounded-full bg-gradient-to-r from-primary-dark to-primary py-3 pl-3 pr-5 text-white shadow-xl shadow-primary/40 active:scale-[.99]"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-primary-dark">
                  {cart.count}
                </span>
              </span>
              Lihat pesanan
            </span>
            <span className="text-sm font-bold">{formatRupiah(cart.total)}</span>
          </button>
        </div>
      )}

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        tableNumber={tableNumber}
        submitting={submitting}
        error={submitError}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
