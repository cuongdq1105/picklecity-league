function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
export async function onRequestGet({ env }) {
  try {
    if (!env.DB) return json({ ok: false, error: 'DB binding missing' });
    const tables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    return json({ ok: true, tables: tables.results || [] });
  } catch (err) {
    return json({ ok: false, error: String(err && err.stack ? err.stack : err) });
  }
}
