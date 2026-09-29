import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { isConfigured } from "./lib/supabase";
import { fetchSelfOrderData, submitSelfOrder } from "./lib/api";
import { formatRupiah, getTokenFromLocation } from "./lib/format";
import { useCart } from "./lib/useCart";
import MenuCard from "./components/MenuCard";
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
    <div className="mx-auto min-h-screen max-w-lg pb-28">
      <header className="bg-primary px-5 pb-5 pt-6 text-white">
        <p className="text-xs uppercase tracking-widest text-white/70">Selamat datang di</p>
        <h1 className="text-xl font-bold">{data.outlet.name}</h1>
        <span className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          Meja {tableNumber}
        </span>
      </header>

      <div className="sticky top-0 z-30 bg-cream/95 px-4 pb-2 pt-3 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari makanan atau minuman"
            className="input !pl-10"
          />
        </div>
        {!query && (
          <div ref={tabsRef} className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setTab(c.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === c.id ? "bg-primary text-white" : "bg-white text-gray-600 shadow-soft"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <main className="space-y-3 px-4 pt-2">
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

      {cart.count > 0 && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg px-4">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4 text-white shadow-lg active:scale-[.99]"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className="relative">
                <ShoppingBag className="h-5 w-5" />
              </span>
              {cart.count} item
            </span>
            <span className="text-sm font-bold">Lihat pesanan · {formatRupiah(cart.total)}</span>
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
