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

export const updateHabit = mutation({
    args: {
        id: v.id("habits"),
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

        const habit = await ctx.db.get(args.id);

        if (!habit) {
            throw new ConvexError("Habit not found");
        }

        if (habit.userId !== user._id) {
            throw new ConvexError("User does not have permission to update this habit");
        }

        await ctx.db.patch(args.id, {
            name: args.name,
            description: args.description,
            emoji: args.emoji,
            color: args.color,
        });
    },
});

export const getHabit = query({
    args: {
        sessionId: v.string(),
        habitId: v.id("habits"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.sessionId);
        if (!user) {
            return null;
        }

        const habit = await ctx.db.get(args.habitId);

        if (!habit || habit.userId !== user._id) {
            return null;
        }

        const streakGoal = await ctx.db
            .query("streakGoals")
            .withIndex("by_habit", q => q.eq("habitId", args.habitId))
            .filter(q => q.eq(q.field("status"), "active"))
            .first();

        const completions = await ctx.db
            .query("habitCompletions")
            .withIndex("by_habit_and_date", (q) => q.eq("habitId", args.habitId))
            .collect();
        
        const calculateStreak = (completions: string[]): number => {
            const completionSet = new Set(completions);
            if (completionSet.size === 0) {
                return 0;
            }
        
            let checkDate = new Date();
            checkDate.setUTCHours(0, 0, 0, 0);
        
            const todayStr = checkDate.toISOString().slice(0, 10);
        
            let yesterday = new Date();
            yesterday.setUTCDate(checkDate.getUTCDate() - 1);
            yesterday.setUTCHours(0,0,0,0);
            const yesterdayStr = yesterday.toISOString().slice(0,10);
        
            if (!completionSet.has(todayStr) && !completionSet.has(yesterdayStr)) {
                return 0;
            }
        
            let currentStreak = 0;
        
            if (!completionSet.has(todayStr)) {
                checkDate.setUTCDate(checkDate.getUTCDate() - 1);
            }
        
            while (true) {
                const dateStr = checkDate.toISOString().slice(0, 10);
                if (completionSet.has(dateStr)) {
                    currentStreak++;
                    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
                } else {
                    break;
                }
            }
        
            return currentStreak;
        }

        const completionDates = completions.map(c => c.date);
        const streak = calculateStreak(completionDates);

        return { ...habit, streakGoal: streakGoal || undefined, completions: completionDates, streak: streak };
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

        const calculateStreak = (completions: string[]): number => {
            const completionSet = new Set(completions);
            if (completionSet.size === 0) {
                return 0;
            }
        
            let checkDate = new Date();
            checkDate.setUTCHours(0, 0, 0, 0);
        
            const todayStr = checkDate.toISOString().slice(0, 10);
        
            let yesterday = new Date();
            yesterday.setUTCDate(checkDate.getUTCDate() - 1);
            yesterday.setUTCHours(0,0,0,0);
            const yesterdayStr = yesterday.toISOString().slice(0,10);
        
            if (!completionSet.has(todayStr) && !completionSet.has(yesterdayStr)) {
                return 0;
            }
        
            let currentStreak = 0;
        
            if (!completionSet.has(todayStr)) {
                checkDate.setUTCDate(checkDate.getUTCDate() - 1);
            }
        
            while (true) {
                const dateStr = checkDate.toISOString().slice(0, 10);
                if (completionSet.has(dateStr)) {
                    currentStreak++;
                    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
                } else {
                    break;
                }
            }
        
            return currentStreak;
        }

        return habits.map(habit => {
            const completions = completionsByHabit.get(habit._id) || [];
            const streak = calculateStreak(completions);
            return {
                ...habit,
                completions,
                streak,
            }
        });
    },
});

export const createOrUpdateStreakGoal = mutation({
    args: {
        sessionId: v.string(),
        habitId: v.id("habits"),
        days: v.number(),
        stakeAmount: v.number(),
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

        const existingGoal = await ctx.db
            .query("streakGoals")
            .withIndex("by_habit", q => q.eq("habitId", args.habitId))
            .filter(q => q.eq(q.field("status"), "active"))
            .first();

        if (existingGoal) {
            await ctx.db.patch(existingGoal._id, {
                days: args.days,
                stakeAmount: args.stakeAmount,
            });
        } else {
            await ctx.db.insert("streakGoals", {
                habitId: args.habitId,
                userId: user._id,
                days: args.days,
                stakeAmount: args.stakeAmount,
                status: "active",
            });
        }
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
