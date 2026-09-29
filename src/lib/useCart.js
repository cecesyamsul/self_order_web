import { useCallback, useEffect, useMemo, useReducer } from "react";

const key = (type, id) => `${type}:${id}`;

function reducer(state, action) {
  switch (action.type) {
    case "set": {
      const { item, qty } = action;
      const k = key(item.type, item.id);
      const next = { ...state };
      if (qty <= 0) delete next[k];
      else next[k] = { ...(state[k] || {}), ...item, qty: Math.min(qty, 99) };
      return next;
    }
    case "notes": {
      if (!state[action.k]) return state;
      return { ...state, [action.k]: { ...state[action.k], notes: action.notes } };
    }
    case "replace":
      return action.state;
    case "clear":
      return {};
    default:
      return state;
  }
}

function load(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Keranjang yang tersimpan per meja (tidak hilang saat halaman di-refresh). */
export function useCart(token) {
  const storageKey = `so-cart:${token}`;
  const [items, dispatch] = useReducer(reducer, storageKey, load);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      /* storage penuh / mode privat: abaikan */
    }
  }, [items, storageKey]);

  const setQty = useCallback((item, qty) => dispatch({ type: "set", item, qty }), []);
  const setNotes = useCallback((k, notes) => dispatch({ type: "notes", k, notes }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  /** Sinkronkan dengan menu terbaru: buang item yang sudah tidak ada, perbarui harga. */
  const reconcile = useCallback(
    (menuMap) => {
      const current = load(storageKey);
      const next = {};
      for (const [k, it] of Object.entries(current)) {
        const fresh = menuMap.get(k);
        if (fresh) next[k] = { ...it, name: fresh.name, price: fresh.price, photo: fresh.photo };
      }
      dispatch({ type: "replace", state: next });
    },
    [storageKey]
  );

  const list = useMemo(() => Object.entries(items).map(([k, v]) => ({ k, ...v })), [items]);
  const count = list.reduce((s, i) => s + i.qty, 0);
  const total = list.reduce((s, i) => s + i.qty * i.price, 0);
  const qtyOf = (type, id) => items[key(type, id)]?.qty || 0;

  return { list, count, total, qtyOf, setQty, setNotes, clear, reconcile };
}
