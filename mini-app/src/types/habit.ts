import { Id } from "../../convex/_generated/dataModel";

export type StreakGoal = {
    _id: Id<'streakGoals'>;
    habitId: Id<'habits'>;
    userId: Id<'users'>;
    days: number;
    stakeAmount: number;
    status: 'active' | 'completed' | 'failed';
};

export type Habit = {
    _id: Id<'habits'>;
    name: string;
    description?: string;
    emoji: string;
    color: string;
    completions: string[];
    streak: number;
    streakGoal?: StreakGoal;
}; 