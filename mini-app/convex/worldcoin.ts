import { action, internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'
import { ConvexError } from 'convex/values'
import { api, internal } from './_generated/api'

const iSuccessResult = v.object({
  proof: v.string(),
  merkle_root: v.string(),
  nullifier_hash: v.string(),
  verification_level: v.string(),
  version: v.optional(v.number()),
  status: v.string()
})

const iPaySuccessResult = v.object({
  status: v.literal('success'),
  transaction_id: v.string(),
  reference: v.string(),
  chain: v.optional(v.string()),
  from: v.optional(v.string()),
  timestamp: v.optional(v.string()),
  transaction_status: v.optional(v.string()),
  version: v.optional(v.number())
})

export const updateUserVerification = internalMutation({
  args: {
    userId: v.id('users'),
    verification_level: v.string()
  },
  handler: async (ctx, { userId, verification_level }) => {
    await ctx.db.patch(userId, {
      verification_level
    })
  }
})

export const getPaymentByReference = internalQuery({
  args: { reference: v.string() },
  handler: async (ctx, { reference }) => {
    // This assumes you have an index on 'reference' in your payments table.
    // Add `.index('by_reference', ['reference'])` to your payments table definition in schema.ts
    const payments = await ctx.db
      .query('payments')
      .withIndex('by_reference', q => q.eq('reference', reference))
      .collect()
    return payments[0] ?? null
  }
})

export const internal_createPayment = internalMutation({
  args: {
    userId: v.id('users'),
    reference: v.string()
  },
  handler: async (ctx, { userId, reference }) => {
    return await ctx.db.insert('payments', {
      userId,
      reference,
      status: 'initiated'
    })
  }
})

export const internal_updatePayment = internalMutation({
  args: {
    reference: v.string(),
    status: v.union(v.literal('success'), v.literal('failed')),
    transactionId: v.string()
  },
  handler: async (ctx, { reference, status, transactionId }) => {
    const payment = await ctx.db
      .query('payments')
      .withIndex('by_reference', q => q.eq('reference', reference))
      .unique()

    if (!payment) {
      throw new ConvexError('Payment not found.')
    }

    await ctx.db.patch(payment._id, { status, transactionId })
  }
})

export const initiatePayment = action({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const user = await ctx.runQuery(api.login.getCurrentUser, { sessionId })
    if (!user) {
      throw new ConvexError('User not authenticated.')
    }

    const reference = crypto.randomUUID().replace(/-/g, '')

    await ctx.runMutation(internal.worldcoin.internal_createPayment, {
      userId: user._id,
      reference: reference
    })

    return { reference }
  }
})

export const verifyPayment = action({
  args: {
    payload: iPaySuccessResult,
    sessionId: v.string()
  },
  handler: async (ctx, { payload, sessionId }) => {
    const user = await ctx.runQuery(api.login.getCurrentUser, { sessionId })
    if (!user) {
      throw new ConvexError('User not authenticated.')
    }

    const payment = await ctx.runQuery(
      internal.worldcoin.getPaymentByReference,
      {
        reference: payload.reference
      }
    )
    if (!payment) {
      throw new ConvexError('Payment reference not found or does not match.')
    }
    if (payment.userId !== user._id) {
      throw new ConvexError('User does not match the payment initiator.')
    }
    if (payment.status !== 'initiated') {
      throw new ConvexError(
        `Payment has already been processed with status: ${payment.status}`
      )
    }

    const app_id = process.env.WORLDCOIN_APP_ID
    const dev_portal_api_key = process.env.DEV_PORTAL_API_KEY

    if (!app_id || !dev_portal_api_key) {
      throw new ConvexError(
        'Missing WORLDCOIN_APP_ID or DEV_PORTAL_API_KEY in environment variables.'
      )
    }

    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${app_id}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${dev_portal_api_key}`
        }
      }
    )
    const transaction = await response.json()

    if (
      transaction.reference === payload.reference &&
      transaction.status !== 'failed'
    ) {
      await ctx.runMutation(internal.worldcoin.internal_updatePayment, {
        reference: payload.reference,
        status: 'success',
        transactionId: payload.transaction_id
      })
      return { success: true, status: transaction.status }
    } else {
      await ctx.runMutation(internal.worldcoin.internal_updatePayment, {
        reference: payload.reference,
        status: 'failed',
        transactionId: payload.transaction_id
      })
      return {
        success: false,
        status: transaction.status,
        detail: 'Payment verification failed on Worldcoin API.'
      }
    }
  }
})

export const verify = action({
  args: {
    payload: iSuccessResult,
    action: v.string(),
    signal: v.optional(v.string()),
    sessionId: v.string()
  },
  handler: async (ctx, { payload, action, signal, sessionId }) => {
    const user = await ctx.runQuery(api.login.getCurrentUser, { sessionId })
    if (!user) {
      throw new ConvexError('User not authenticated.')
    }

    const app_id = process.env.WORLDCOIN_APP_ID
    if (!app_id) {
      throw new ConvexError(
        'Missing WORLDCOIN_APP_ID in environment variables.'
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status, ...restOfPayload } = payload

    const verifyRes = await fetch(
      `https://developer.worldcoin.org/api/v2/verify/${app_id}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...restOfPayload,
          action,
          signal: signal ?? ''
        })
      }
    ).then(res => res.json())

    if (verifyRes.success) {
      await ctx.runMutation(internal.worldcoin.updateUserVerification, {
        userId: user._id,
        verification_level: payload.verification_level
      })
    }
    return verifyRes
  }
}) 