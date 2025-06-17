import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import { MiniAppWalletAuthSuccessPayload } from '@worldcoin/minikit-js'
import { ConvexError } from 'convex/values'

export const getNonce = httpAction(async (ctx) => {
  const nonce = crypto.randomUUID().replace(/-/g, '')
  try {
    await ctx.runMutation(internal.login.storeNonce, {
      nonce,
      expiration: Date.now() + 5 * 60 * 1000, // 5 minutes
    })
  } catch (error) {
    console.error(`getNonce: failed to store nonce: ${nonce}`, error)
    return new Response('Failed to store nonce', {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': process.env.FRONTEND_URL! },
    })
  }

  return new Response(JSON.stringify({ nonce }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': process.env.FRONTEND_URL! },
    status: 200,
  })
})

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload
  nonce: string
}
export const completeSiwe = httpAction(async (ctx, request) => {
  try {
    const { payload, nonce } = (await request.json()) as IRequestPayload

    const storedNonce = await ctx.runQuery(internal.login.getNonce, { nonce })
    if (!storedNonce || storedNonce.nonce !== nonce) {
      return new Response(JSON.stringify({ status: 'error', isValid: false, message: 'Invalid nonce' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': process.env.FRONTEND_URL! },
        status: 400,
      })
    }

    await ctx.runMutation(internal.login.deleteNonce, { id: storedNonce._id })

    try {
      const isValid = await ctx.runAction(internal.siwe.verifySignature, {
        address: payload.address,
        message: payload.message,
        signature: payload.signature,
      })

      if (!isValid) {
        return new Response(
          JSON.stringify({ status: 'error', isValid: false, message: 'Signature verification failed' }),
          {
            headers: { 'Content-Type': 'application/json', 'Access-control-Allow-Origin': process.env.FRONTEND_URL! },
            status: 401,
          }
        )
      }
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error
      }
      console.error('completeSiwe: an unexpected error occurred:', error)
      return new Response(JSON.stringify({ status: 'error', isValid: false, message: (error as Error).message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': process.env.FRONTEND_URL! },
        status: 500,
      })
    }

    const user = await ctx.runMutation(internal.login.getOrCreateUser, { address: payload.address })

    if (!user) {
      return new Response(JSON.stringify({ status: 'error', isValid: false, message: 'Could not get or create user' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': process.env.FRONTEND_URL! },
        status: 500,
      })
    }

    const sessionId = crypto.randomUUID()
    await ctx.runMutation(internal.login.createSession, {
      userId: user._id,
      sessionId: sessionId,
      expiration: Date.now() + 24 * 60 * 60 * 1000, // 1 day
    })

    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set('Access-Control-Allow-Origin', process.env.FRONTEND_URL!)
    headers.set('Access-Control-Allow-Credentials', 'true')

    return new Response(JSON.stringify({ status: 'success', isValid: true, address: payload.address, sessionId: sessionId }), {
      headers,
      status: 200,
    })
  } catch (error: any) {
    console.error('completeSiwe: an unexpected error occurred:', error)
    return new Response(JSON.stringify({ status: 'error', isValid: false, message: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': process.env.FRONTEND_URL! },
      status: 500,
    })
  }
}) 