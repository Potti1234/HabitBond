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
  }).index('by_reference', ['reference']),
  habits: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    emoji: v.string(),
    color: v.string(),
  }).index("by_userId", ["userId"]),
  habitCompletions: defineTable({
    habitId: v.id("habits"),
    userId: v.id("users"),
    date: v.string(), // "YYYY-MM-DD"
  })
    .index("by_user", ["userId"])
    .index("by_habit_and_date", ["habitId", "date"]),
  streakGoals: defineTable({
    habitId: v.id("habits"),
    userId: v.id("users"),
    days: v.number(),
    stakeAmount: v.number(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("failed")),
  })
    .index("by_habit", ["habitId"])
    .index("by_user", ["userId"]),
});
