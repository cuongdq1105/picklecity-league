export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const id = Number(body.registration_id);
  const status = body.status === 'BTC_CONFIRMED' ? 'BTC_CONFIRMED' : 'PENDING';
  if (!id) return Response.json({ error: 'Thiếu registration_id' }, { status: 400 });
  await env.DB.prepare(`UPDATE registrations SET payment_status=? WHERE id=?`).bind(status, id).run();
  return Response.json({ ok: true });
}
