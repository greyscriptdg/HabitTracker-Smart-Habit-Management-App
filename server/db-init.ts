import { storage } from './storage';

// This function is called when the server starts
export async function initializeDatabase() {
  try {
    console.log('Pushing database schema via drizzle-kit...');
    
    // First run db:push to create tables if they don't exist
    const { execSync } = await import('child_process');
    execSync('npm run db:push', { stdio: 'inherit' });
    
    console.log('Database schema pushed successfully.');
    
    // Seed initial data if needed
    console.log('Seeding initial data...');
    await storage.seedInitialData();
    console.log('Database initialized successfully.');
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}