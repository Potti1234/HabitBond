import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  users: defineTable({
    walletAddress: v.string(),
    verification_level: v.optional(v.string()),
    username: v.optional(v.string()),
    profile_picture_url: v.optional(v.string()),
  }).index('by_walletAddress', ['walletAddress']),
  sessions: defineTable({
    userId: v.id('users'),
    sessionId: v.string(),
    expiration: v.number(),
  })
    .index('by_sessionId', ['sessionId'])
    .index('by_expiration', ['expiration']),
  siweNonces: defineTable({
    nonce: v.string(),
    expiration: v.number(),
  }).index('nonce', ['nonce']),
  payments: defineTable({
    userId: v.id('users'),
    reference: v.string(),
    status: v.union(
      v.literal('initiated'),
      v.literal('success'),
      v.literal('failed')
    ),
    transactionId: v.optional(v.string())
  }).index('by_reference', ['reference'])
});
