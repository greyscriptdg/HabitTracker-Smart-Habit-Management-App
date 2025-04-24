import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import {
  habits,
  type Habit,
  type InsertHabit,
  habitCompletions,
  type HabitCompletion,
  type InsertHabitCompletion,
  type HabitStat,
  users,
  type User,
  type InsertUser
} from "@shared/schema";

// Storage interface
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Habit methods
  getHabit(id: number): Promise<Habit | undefined>;
  getHabits(): Promise<Habit[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: number, habit: Partial<InsertHabit>): Promise<Habit | undefined>;
  deleteHabit(id: number): Promise<boolean>;
  
  // Habit completion methods
  getHabitCompletion(habitId: number, date: string): Promise<HabitCompletion | undefined>;
  getHabitCompletions(habitId: number, startDate?: string, endDate?: string): Promise<HabitCompletion[]>;
  getAllCompletions(startDate?: string, endDate?: string): Promise<HabitCompletion[]>;
  createOrUpdateHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion>;
  
  // Stats methods
  getHabitStats(habitId: number): Promise<HabitStat>;
  getAllHabitStats(): Promise<HabitStat[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Habit methods
  async getHabit(id: number): Promise<Habit | undefined> {
    const [habit] = await db.select().from(habits).where(eq(habits.id, id));
    return habit || undefined;
  }

  async getHabits(): Promise<Habit[]> {
    const allHabits = await db.select().from(habits);
    return allHabits;
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await db
      .insert(habits)
      .values(habit)
      .returning();
    return newHabit;
  }

  async updateHabit(id: number, habitUpdate: Partial<InsertHabit>): Promise<Habit | undefined> {
    const [updatedHabit] = await db
      .update(habits)
      .set(habitUpdate)
      .where(eq(habits.id, id))
      .returning();
    return updatedHabit || undefined;
  }

  async deleteHabit(id: number): Promise<boolean> {
    const result = await db
      .delete(habits)
      .where(eq(habits.id, id))
      .returning({ id: habits.id });
    
    return result.length > 0;
  }

  // Habit completion methods
  async getHabitCompletion(habitId: number, date: string): Promise<HabitCompletion | undefined> {
    const [completion] = await db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.habitId, habitId),
          eq(habitCompletions.date, date)
        )
      );
    return completion || undefined;
  }

  async getHabitCompletions(habitId: number, startDate?: string, endDate?: string): Promise<HabitCompletion[]> {
    let baseQuery = db.select().from(habitCompletions);
    
    let conditions = [eq(habitCompletions.habitId, habitId)];
    
    if (startDate) {
      conditions.push(gte(habitCompletions.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(habitCompletions.date, endDate));
    }
    
    const completions = await baseQuery.where(and(...conditions)).orderBy(habitCompletions.date);
    return completions;
  }

  async getAllCompletions(startDate?: string, endDate?: string): Promise<HabitCompletion[]> {
    let baseQuery = db.select().from(habitCompletions);
    let conditions = [];
    
    if (startDate) {
      conditions.push(gte(habitCompletions.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(habitCompletions.date, endDate));
    }
    
    const completions = conditions.length > 0
      ? await baseQuery.where(and(...conditions)).orderBy(habitCompletions.date)
      : await baseQuery.orderBy(habitCompletions.date);
      
    return completions;
  }

  async createOrUpdateHabitCompletion(insertCompletion: InsertHabitCompletion): Promise<HabitCompletion> {
    // Check if a completion already exists for this habit on this date
    const existing = await this.getHabitCompletion(
      insertCompletion.habitId,
      insertCompletion.date
    );

    if (existing) {
      // Update existing completion
      const [updated] = await db
        .update(habitCompletions)
        .set({
          completed: insertCompletion.completed,
          notes: insertCompletion.notes
        })
        .where(
          and(
            eq(habitCompletions.habitId, insertCompletion.habitId),
            eq(habitCompletions.date, insertCompletion.date)
          )
        )
        .returning();
      return updated;
    } else {
      // Create new completion
      const [created] = await db
        .insert(habitCompletions)
        .values(insertCompletion)
        .returning();
      return created;
    }
  }

  // Stats methods
  async getHabitStats(habitId: number): Promise<HabitStat> {
    // Make sure habit exists
    const habit = await this.getHabit(habitId);
    if (!habit) {
      throw new Error(`Habit with id ${habitId} not found`);
    }

    // Get all completions for this habit
    const completions = await this.getHabitCompletions(habitId);
    
    // Calculate total days and completion rate
    const totalDays = completions.length;
    const completedCount = completions.filter(c => c.completed).length;
    const completionRate = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
    
    // Calculate current streak
    let currentStreak = 0;
    
    // Sort completions by date in descending order
    const sortedCompletions = [...completions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    for (const completion of sortedCompletions) {
      if (completion.completed) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Sort by date in ascending order
    const ascCompletions = [...completions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (const completion of ascCompletions) {
      if (completion.completed) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }
    
    return {
      id: habitId,
      habitId,
      currentStreak,
      longestStreak,
      completionRate,
      totalCompletions: completedCount,
      totalDays
    };
  }

  async getAllHabitStats(): Promise<HabitStat[]> {
    const habits = await this.getHabits();
    const statsPromises = habits.map(habit => this.getHabitStats(habit.id));
    const stats = await Promise.all(statsPromises);
    return stats;
  }
  
  // Helper method to seed initial data for the habit tracker demo
  async seedInitialData(): Promise<void> {
    // Check if we already have data
    const existingHabits = await this.getHabits();
    if (existingHabits.length > 0) {
      return; // Skip seeding if data exists
    }
    
    // Sample habits for development
    const sampleHabits: InsertHabit[] = [
      {
        name: "Daily Meditation",
        description: "10 minutes",
        icon: "meditation",
        color: "green",
        weekdays: "MTWTFSS",
        reminderTime: null,
        userId: null
      },
      {
        name: "Read 30 Minutes",
        description: "Fiction book",
        icon: "book",
        color: "orange",
        weekdays: "MTWTFSS",
        reminderTime: null,
        userId: null
      },
      {
        name: "Exercise",
        description: "30 minutes workout",
        icon: "exercise",
        color: "blue",
        weekdays: "MTWTFSS",
        reminderTime: null,
        userId: null
      },
      {
        name: "Learn a Language",
        description: "15 minutes of Spanish",
        icon: "language",
        color: "yellow",
        weekdays: "MTWTFSS",
        reminderTime: null,
        userId: null
      },
    ];
    
    // Create habits
    const createdHabits = await Promise.all(sampleHabits.map(habit => this.createHabit(habit)));
    
    // Create sample completions for the last 30 days
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // For each habit, create completions
      for (const habit of createdHabits) {
        // Create more completed habits than incomplete for a positive trend
        const completed = Math.random() > 0.3;
        await this.createOrUpdateHabitCompletion({
          habitId: habit.id,
          date: dateStr,
          completed,
          notes: null
        });
      }
    }
  }
}

// Initialize database storage with seed data
export const storage = new DatabaseStorage();