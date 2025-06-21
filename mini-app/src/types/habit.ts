import { Id } from "../../convex/_generated/dataModel";

export type Habit = {
    _id: Id<'habits'>;
    name: string;
    description?: string;
    emoji: string;
    color: string;
    completions: string[];
}; 