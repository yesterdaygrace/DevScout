// TEMPORARY bisect: minimal handler to isolate runtime vs app-bundle hang
export default async function () {
  return new Response(JSON.stringify({ ok: true, bisect: 'minimal' }), {
    headers: { 'content-type': 'application/json' },
  })
}
