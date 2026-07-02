export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export function fallbackTournament() {
  return {
    id: 1,
    name: 'PickleCity Weekly Open #02 - Đôi Nam Random',
    fee: 150000,
    max_players: 40,
    start_time: '2026-07-05 08:00:00',
    register_deadline: '2026-07-03 20:30:00',
    status: 'OPEN',
    first_prize: 2000000,
    second_prize: 1000000,
    third_prize: 500000,
    third_prize_count: 2,
    sponsor_note: 'PickleCity tài trợ cúp vô địch, huy chương và chi phí tổ chức giải.'
  };
}

export async function getOpenTournament(env) {
  if (!env.DB) return fallbackTournament();
  const row = await env.DB.prepare(`
    SELECT t.*, e.name AS event_type_name, e.code AS event_type_code
    FROM tournaments t
    LEFT JOIN event_types e ON e.id = t.event_type_id
    WHERE t.status = 'OPEN'
    ORDER BY t.id DESC
    LIMIT 1
  `).first();
  return row || fallbackTournament();
}
