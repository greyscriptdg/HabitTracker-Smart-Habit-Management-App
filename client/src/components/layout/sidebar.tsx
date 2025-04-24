import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, 
  Calendar as CalendarIcon, 
  BarChart2, 
  Settings as SettingsIcon, 
  Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AddHabitDialog from "@/components/habit/add-habit-dialog";
import { Habit } from "@shared/schema";

interface SidebarProps {
  currentPath: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);

  const { data: habits } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/calendar", icon: CalendarIcon, label: "Calendar" },
    { path: "/statistics", icon: BarChart2, label: "Statistics" },
    { path: "/settings", icon: SettingsIcon, label: "Settings" },
  ];

  const getColorForIndex = (index: number) => {
    const colors = ["bg-secondary", "bg-accent", "bg-primary", "bg-warning"];
    return colors[index % colors.length];
  };

  return (
    <>
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Habit Tracker
          </h1>
        </div>
        
        <nav className="flex-1 px-4 pb-6">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                href={item.path}
                className={`flex items-center px-4 py-3 rounded-lg font-medium ${
                  currentPath === item.path
                    ? "text-primary bg-indigo-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            ))}
          </div>
          
          {habits && habits.length > 0 && (
            <div className="mt-8">
              <h3 className="px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">My Habits</h3>
              <div className="mt-2 space-y-1">
                {habits.map((habit, index) => (
                  <Link 
                    key={habit.id}
                    href={`/habit/${habit.id}`}
                    className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium group"
                  >
                    <span className={`w-2 h-2 rounded-full ${getColorForIndex(index)} mr-3`}></span>
                    {habit.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            className="w-full border-primary text-primary hover:bg-primary hover:text-white"
            onClick={() => setIsAddHabitOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Habit
          </Button>
        </div>
      </aside>

      {/* Mobile Header - only visible on mobile */}
      <header className="bg-white shadow-sm md:hidden">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Habit Tracker
          </h1>
          <button type="button" className="text-gray-600 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      <AddHabitDialog open={isAddHabitOpen} onOpenChange={setIsAddHabitOpen} />
    </>
  );
}
