export async function onRequestGet({ env }) {
  try {
    if (!env.DB) {
      return Response.json({ ok: false, error: "Missing DB binding", registrations: [] });
    }

    const tournament = await env.DB.prepare(
      "SELECT * FROM tournaments WHERE status='OPEN' ORDER BY id DESC LIMIT 1"
    ).first();

    if (!tournament) {
      return Response.json({ ok: true, registrations: [] });
    }

    const data = await env.DB.prepare(`
      SELECT 
        r.id AS registration_id,
        r.payment_status,
        r.payment_amount,
        r.created_at,
        m.full_name,
        m.phone,
        m.gender,
        m.level_group
      FROM registrations r
      LEFT JOIN members m ON m.id = r.member_id
      WHERE r.tournament_id = ?
      ORDER BY r.id DESC
    `).bind(tournament.id).all();

    return Response.json({
      ok: true,
      tournament,
      registrations: data.results || []
    });

  } catch (err) {
    return Response.json({
      ok: false,
      error: String(err.message || err),
      registrations: []
    });
  }
}