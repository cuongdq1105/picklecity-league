export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (url.pathname === "/api/ping") {
    return Response.json({ ok: true, message: "API running" });
  }

  return next();
}