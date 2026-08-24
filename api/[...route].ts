import { handle } from 'hono/vercel'
// Root and server resolve separate hono copies; runtime-compatible, so bridge the types here.
import app from '../server/src/app.js'

export default handle(app as unknown as Parameters<typeof handle>[0])
