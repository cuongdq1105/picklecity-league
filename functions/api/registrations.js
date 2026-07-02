export async function onRequestGet({ env }) {
  const rows = await env.DB.prepare(`SELECT r.id AS registration_id, r.payment_status, r.created_at, m.full_name, m.phone, m.gender, m.level_group, m.level_score FROM registrations r JOIN members m ON r.member_id=m.id JOIN tournaments t ON r.tournament_id=t.id WHERE t.status='OPEN' ORDER BY r.id DESC`).all();
  return Response.json({ registrations: rows.results || [] });
}
