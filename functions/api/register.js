export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const fullName = (body.full_name || '').trim();
  const phone = (body.phone || '').trim();
  const gender = body.gender || 'male';
  const paymentStatus = body.marked_paid ? 'PLAYER_MARKED_PAID' : 'PENDING';
  if (!fullName || !phone) return Response.json({ error: 'Thiếu họ tên hoặc số điện thoại' }, { status: 400 });
  const tour = await env.DB.prepare(`SELECT id, fee FROM tournaments WHERE status='OPEN' ORDER BY id DESC LIMIT 1`).first();
  if (!tour) return Response.json({ error: 'Hiện chưa có giải đang mở đăng ký' }, { status: 400 });
  let member = await env.DB.prepare(`SELECT id FROM members WHERE phone=?`).bind(phone).first();
  if (!member) {
    const res = await env.DB.prepare(`INSERT INTO members(full_name, phone, gender) VALUES(?,?,?)`).bind(fullName, phone, gender).run();
    member = { id: res.meta.last_row_id };
  } else {
    await env.DB.prepare(`UPDATE members SET full_name=?, gender=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(fullName, gender, member.id).run();
  }
  const exists = await env.DB.prepare(`SELECT id FROM registrations WHERE tournament_id=? AND member_id=?`).bind(tour.id, member.id).first();
  if (exists) return Response.json({ error: 'SĐT này đã đăng ký giải hiện tại' }, { status: 409 });
  await env.DB.prepare(`INSERT INTO registrations(tournament_id, member_id, payment_amount, payment_status) VALUES(?,?,?,?)`).bind(tour.id, member.id, tour.fee, paymentStatus).run();
  return Response.json({ ok: true });
}
