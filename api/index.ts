// TEMPORARY bisect #2: Node.js-style handler signature
interface Res {
  status: (code: number) => { json: (body: unknown) => void }
}

export default function handler(_req: unknown, res: Res) {
  res.status(200).json({ ok: true, sig: 'node-style' })
}
