import { httpRouter } from 'convex/server'
import { getNonce, completeSiwe } from './siweHttpActions'
import { httpAction } from './_generated/server'

const http = httpRouter()

http.route({
  path: '/getNonce',
  method: 'GET',
  handler: getNonce,
})

http.route({
  path: '/completesiwe',
  method: 'POST',
  handler: completeSiwe,
})

const handleOptions = httpAction(async (_, request) => {
  const headers = request.headers
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    return new Response(null, {
      headers: new Headers({
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL!,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      }),
    })
  } else {
    return new Response()
  }
})

http.route({
  path: '/getNonce',
  method: 'OPTIONS',
  handler: handleOptions,
})

http.route({
  path: '/completesiwe',
  method: 'OPTIONS',
  handler: handleOptions,
})

export default http 