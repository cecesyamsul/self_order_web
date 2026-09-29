const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export const formatRupiah = (v) => rupiah.format(Number(v) || 0);

/** Token dari URL: /t/<token> atau ?t=<token> */
export function getTokenFromLocation() {
  const m = window.location.pathname.match(/^\/t\/([A-Za-z0-9_-]+)\/?$/);
  if (m) return m[1];
  return new URLSearchParams(window.location.search).get("t");
}
