export async function onRequestGet({ env }) {
  const row = await env.DB.prepare(`SELECT t.*, e.name AS event_name FROM tournaments t JOIN event_types e ON t.event_type_id=e.id WHERE t.status='OPEN' ORDER BY t.id DESC LIMIT 1`).first();
  return Response.json({ tournament: row });
}
