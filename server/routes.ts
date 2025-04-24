import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHabitSchema, insertHabitCompletionSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Habits CRUD
  app.get("/api/habits", async (_req: Request, res: Response) => {
    try {
      const habits = await storage.getHabits();
      return res.json(habits);
    } catch (error) {
      console.error("Error fetching habits:", error);
      return res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  app.get("/api/habits/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const habit = await storage.getHabit(id);
      
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      
      return res.json(habit);
    } catch (error) {
      console.error("Error fetching habit:", error);
      return res.status(500).json({ message: "Failed to fetch habit" });
    }
  });

  app.post("/api/habits", async (req: Request, res: Response) => {
    try {
      const parsedData = insertHabitSchema.parse(req.body);
      const habit = await storage.createHabit(parsedData);
      return res.status(201).json(habit);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating habit:", error);
      return res.status(500).json({ message: "Failed to create habit" });
    }
  });

  app.patch("/api/habits/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const parsedData = insertHabitSchema.partial().parse(req.body);
      
      const habit = await storage.updateHabit(id, parsedData);
      
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      
      return res.json(habit);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating habit:", error);
      return res.status(500).json({ message: "Failed to update habit" });
    }
  });

  app.delete("/api/habits/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHabit(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Habit not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting habit:", error);
      return res.status(500).json({ message: "Failed to delete habit" });
    }
  });

  // Habit Completions
  app.get("/api/completions", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const completions = await storage.getAllCompletions(
        startDate as string | undefined,
        endDate as string | undefined
      );
      return res.json(completions);
    } catch (error) {
      console.error("Error fetching completions:", error);
      return res.status(500).json({ message: "Failed to fetch completions" });
    }
  });

  app.get("/api/habits/:habitId/completions", async (req: Request, res: Response) => {
    try {
      const habitId = parseInt(req.params.habitId);
      const { startDate, endDate } = req.query;
      
      const completions = await storage.getHabitCompletions(
        habitId,
        startDate as string | undefined,
        endDate as string | undefined
      );
      
      return res.json(completions);
    } catch (error) {
      console.error("Error fetching habit completions:", error);
      return res.status(500).json({ message: "Failed to fetch habit completions" });
    }
  });

  app.post("/api/completions", async (req: Request, res: Response) => {
    try {
      const parsedData = insertHabitCompletionSchema.parse(req.body);
      const completion = await storage.createOrUpdateHabitCompletion(parsedData);
      return res.status(201).json(completion);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating/updating completion:", error);
      return res.status(500).json({ message: "Failed to create/update completion" });
    }
  });

  // Stats
  app.get("/api/stats", async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getAllHabitStats();
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      return res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/habits/:habitId/stats", async (req: Request, res: Response) => {
    try {
      const habitId = parseInt(req.params.habitId);
      const stats = await storage.getHabitStats(habitId);
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching habit stats:", error);
      return res.status(500).json({ message: "Failed to fetch habit stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
