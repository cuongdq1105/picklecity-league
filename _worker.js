export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/ping") {
      return Response.json({ ok: true, message: "PTS API running" });
    }

    if (url.pathname === "/api/tournament") {
      const t = await env.DB.prepare(`
        SELECT t.*, e.name AS event_name
        FROM tournaments t
        LEFT JOIN event_types e ON e.id = t.event_type_id
        WHERE t.status='OPEN'
        ORDER BY t.id DESC
        LIMIT 1
      `).first();

      return Response.json({ tournament: t });
    }

    if (url.pathname === "/api/registrations") {
      const rows = await env.DB.prepare(`
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
        ORDER BY r.id DESC
      `).all();

      return Response.json({ registrations: rows.results || [] });
    }

    if (url.pathname === "/api/register" && request.method === "POST") {
      const body = await request.json();
      const fullName = body.full_name?.trim();
      const phone = body.phone?.trim();
      const gender = body.gender || "male";

      if (!fullName || !phone) {
        return Response.json({ error: "Thiếu họ tên hoặc số điện thoại" }, { status: 400 });
      }

      let member = await env.DB.prepare(
        "SELECT * FROM members WHERE phone = ?"
      ).bind(phone).first();

      if (!member) {
        await env.DB.prepare(`
          INSERT INTO members (full_name, phone, gender, level_group, level_score)
          VALUES (?, ?, ?, 'UNRANKED', 1000)
        `).bind(fullName, phone, gender).run();

        member = await env.DB.prepare(
          "SELECT * FROM members WHERE phone = ?"
        ).bind(phone).first();
      }

      const tournament = await env.DB.prepare(
        "SELECT * FROM tournaments WHERE status='OPEN' ORDER BY id DESC LIMIT 1"
      ).first();

      if (!tournament) {
        return Response.json({ error: "Hiện chưa có giải đang mở" }, { status: 400 });
      }

      await env.DB.prepare(`
        INSERT INTO registrations (tournament_id, member_id, payment_amount, payment_status)
        VALUES (?, ?, ?, 'PLAYER_MARKED_PAID')
      `).bind(tournament.id, member.id, tournament.fee || 150000).run();

      return Response.json({ ok: true });
    }

    if (url.pathname === "/api/confirm-payment" && request.method === "POST") {
      const body = await request.json();

      await env.DB.prepare(`
        UPDATE registrations
        SET payment_status = ?
        WHERE id = ?
      `).bind(body.status || "BTC_CONFIRMED", body.registration_id).run();

      return Response.json({ ok: true });
    }

    return env.ASSETS.fetch(request);
  }
};