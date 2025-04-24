import { pgTable, text, serial, integer, boolean, date, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  habits: many(habits),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Habit table
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  weekdays: text("weekdays").notNull(), // Stored as 'MTWTFSS' string with active days capitalized
  reminderTime: text("reminder_time"), // Optional reminder time (HH:MM)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
});

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  completions: many(habitCompletions),
}));

export const insertHabitSchema = createInsertSchema(habits).pick({
  name: true,
  description: true,
  icon: true,
  color: true,
  weekdays: true,
  reminderTime: true,
  userId: true,
});

export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habits.$inferSelect;

// Habit completion table
export const habitCompletions = pgTable("habit_completions", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id")
    .notNull()
    .references(() => habits.id, { onDelete: 'cascade' }),
  date: date("date").notNull(),
  completed: boolean("completed").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const habitCompletionsRelations = relations(habitCompletions, ({ one }) => ({
  habit: one(habits, {
    fields: [habitCompletions.habitId],
    references: [habits.id],
  }),
}));

// Create a unique constraint - one completion per habit per day
export const habitCompletionsIndex = pgTable(
  "habit_completions_habit_date_idx",
  {
    habitId: integer("habit_id").notNull().references(() => habits.id),
    date: date("date").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.habitId, t.date] }),
  })
);

export const insertHabitCompletionSchema = createInsertSchema(habitCompletions).pick({
  habitId: true,
  date: true,
  completed: true,
  notes: true,
});

export type InsertHabitCompletion = z.infer<typeof insertHabitCompletionSchema>;
export type HabitCompletion = typeof habitCompletions.$inferSelect;

// Stats model - not stored in DB, used for type safety in the API responses
export const habitStatSchema = z.object({
  id: z.number(),
  habitId: z.number(),
  currentStreak: z.number(),
  longestStreak: z.number(),
  completionRate: z.number(),
  totalCompletions: z.number(),
  totalDays: z.number(),
});

export type HabitStat = z.infer<typeof habitStatSchema>;
