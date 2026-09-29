import { supabase } from "./supabase";

async function rpc(name, params) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    const err = new Error(error.message || "Terjadi kesalahan");
    err.code = error.code;
    throw err;
  }
  return data;
}

/** Menu + info meja berdasarkan token QR. */
export function fetchSelfOrderData(token) {
  return rpc("get_self_order_data", { p_token: token });
}

/** Kirim pesanan. items: [{ item_type, id, qty, notes }] - harga dihitung ulang server. */
export function submitSelfOrder({ token, name, phone, items }) {
  return rpc("create_self_order", {
    p_token: token,
    p_customer_name: name,
    p_customer_phone: phone || null,
    p_items: items,
  });
}

export function fetchOrderStatus(orderId) {
  return rpc("get_self_order_status", { p_order_id: orderId });
}
