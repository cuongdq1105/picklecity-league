function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ ok: false, error: 'Chưa kết nối D1 database DB' }, 200);
    const body = await request.json();
    const id = Number(body.registration_id);
    const status = body.status === 'PENDING' ? 'PENDING' : 'BTC_CONFIRMED';
    if (!id) return json({ ok: false, error: 'Thiếu registration_id' }, 200);
    await env.DB.prepare('UPDATE registrations SET payment_status = ? WHERE id = ?').bind(status, id).run();
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) }, 200);
  }
}
