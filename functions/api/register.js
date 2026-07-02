function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
async function getOpenTournament(env) {
  const row = await env.DB.prepare(`
    SELECT t.*, e.name AS event_type_name, e.code AS event_type_code
    FROM tournaments t
    LEFT JOIN event_types e ON e.id = t.event_type_id
    WHERE t.status = 'OPEN'
    ORDER BY t.id DESC
    LIMIT 1
  `).first();
  return row || null;
}
export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ ok: false, error: 'Chưa kết nối D1 database DB' }, 200);
    const body = await request.json();
    const fullName = String(body.full_name || '').trim();
    const phone = String(body.phone || '').trim();
    const gender = body.gender === 'female' ? 'female' : 'male';
    if (!fullName || !phone) return json({ ok: false, error: 'Vui lòng nhập họ tên và số điện thoại.' }, 200);

    const tournament = await getOpenTournament(env);
    if (!tournament || !tournament.id) return json({ ok: false, error: 'Chưa có giải đang mở đăng ký.' }, 200);

    let member = await env.DB.prepare('SELECT id FROM members WHERE phone = ?').bind(phone).first();
    if (member) {
      await env.DB.prepare('UPDATE members SET full_name = ?, gender = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(fullName, gender, member.id).run();
    } else {
      const inserted = await env.DB.prepare('INSERT INTO members (full_name, phone, gender) VALUES (?, ?, ?)')
        .bind(fullName, phone, gender).run();
      member = { id: inserted.meta.last_row_id };
    }

    const info = await env.DB.prepare('PRAGMA table_info(registrations)').all();
    const cols = (info.results || []).map(c => c.name);
    const memberCol = cols.includes('member_id') ? 'member_id' : (cols.includes('player_id') ? 'player_id' : null);
    if (!memberCol) return json({ ok:false, error:'Bảng registrations chưa có member_id/player_id.' }, 200);

    const existing = await env.DB.prepare(`SELECT id FROM registrations WHERE tournament_id = ? AND ${memberCol} = ?`)
      .bind(tournament.id, member.id).first();
    const paymentStatus = body.marked_paid ? 'PLAYER_MARKED_PAID' : 'PENDING';

    if (existing) {
      await env.DB.prepare(`UPDATE registrations SET payment_status = ?, payment_amount = ?, note = ? WHERE id = ?`)
        .bind(paymentStatus, tournament.fee || 150000, body.note || '', existing.id).run();
      return json({ ok: true, registration_id: existing.id, updated: true });
    }

    const reg = await env.DB.prepare(`
      INSERT INTO registrations (tournament_id, ${memberCol}, payment_amount, payment_status, note)
      VALUES (?, ?, ?, ?, ?)
    `).bind(tournament.id, member.id, tournament.fee || 150000, paymentStatus, body.note || '').run();

    return json({ ok: true, registration_id: reg.meta.last_row_id });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) }, 200);
  }
}
