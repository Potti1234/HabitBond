import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "../login";
import { ConvexError } from "convex/values";

export const createHabit = mutation({
    args: {
        sessionId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        emoji: v.string(),
        color: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.sessionId);

        if (!user) {
            throw new ConvexError("User not authenticated");
        }

        await ctx.db.insert("habits", {
            userId: user._id,
            name: args.name,
            description: args.description,
            emoji: args.emoji,
            color: args.color,
        });
    },
});

export const getHabits = query({
    args: { sessionId: v.string() },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.sessionId);
        if (!user) {
            return [];
        }

        const habits = await ctx.db
            .query("habits")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();

        if (habits.length === 0) {
            return [];
        }

        const allCompletions = await ctx.db
            .query("habitCompletions")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .collect();

        const completionsByHabit = new Map<string, string[]>();
        for (const completion of allCompletions) {
            if (!completionsByHabit.has(completion.habitId)) {
                completionsByHabit.set(completion.habitId, []);
            }
            completionsByHabit.get(completion.habitId)!.push(completion.date);
        }

        return habits.map(habit => ({
            ...habit,
            completions: completionsByHabit.get(habit._id) || [],
        }));
    },
});

export const toggleHabitCompletion = mutation({
    args: {
        sessionId: v.string(),
        habitId: v.id("habits"),
        date: v.string(), // YYYY-MM-DD
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.sessionId);
        if (!user) {
            throw new ConvexError("User not authenticated");
        }

        const habit = await ctx.db.get(args.habitId);
        if (!habit || habit.userId !== user._id) {
            throw new ConvexError("Habit not found or user does not have permission");
        }

        const existingCompletion = await ctx.db
            .query("habitCompletions")
            .withIndex("by_habit_and_date", q => q.eq("habitId", args.habitId).eq("date", args.date))
            .unique();

        if (existingCompletion) {
            if (existingCompletion.userId !== user._id) {
                throw new ConvexError("Permission denied to modify this completion.");
            }
            await ctx.db.delete(existingCompletion._id);
            return "unchecked";
        } else {
            await ctx.db.insert("habitCompletions", {
                habitId: args.habitId,
                userId: user._id,
                date: args.date,
            });
            return "checked";
        }
    },
});
