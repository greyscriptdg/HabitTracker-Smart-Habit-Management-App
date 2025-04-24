import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SummaryStats from "@/components/dashboard/summary-stats";
import ProgressChart from "@/components/dashboard/progress-chart";
import TodaysHabits from "@/components/dashboard/todays-habits";
import WeeklyOverview from "@/components/dashboard/weekly-overview";
import AddHabitDialog from "@/components/habit/add-habit-dialog";

type ViewMode = "day" | "week" | "month";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  
  const currentDate = format(new Date(), "EEEE, MMMM d, yyyy");
  
  return (
    <div className="p-4 sm:p-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="mt-1 text-gray-500">{currentDate}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="bg-white rounded-md shadow-sm border border-gray-200 flex p-1">
            <Button 
              variant={viewMode === "day" ? "default" : "ghost"}
              className={`px-3 py-1.5 text-sm font-medium ${viewMode === "day" ? "bg-indigo-50 text-primary" : "text-gray-600 hover:bg-gray-50"}`}
              onClick={() => setViewMode("day")}
            >
              Day
            </Button>
            <Button 
              variant={viewMode === "week" ? "default" : "ghost"}
              className={`px-3 py-1.5 text-sm font-medium ${viewMode === "week" ? "bg-indigo-50 text-primary" : "text-gray-600 hover:bg-gray-50"}`}
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
            <Button 
              variant={viewMode === "month" ? "default" : "ghost"}
              className={`px-3 py-1.5 text-sm font-medium ${viewMode === "month" ? "bg-indigo-50 text-primary" : "text-gray-600 hover:bg-gray-50"}`}
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
          </div>
          <Button 
            size="icon"
            className="bg-primary text-white p-2 rounded-md shadow-sm hover:bg-indigo-700 transition-colors md:hidden"
            onClick={() => setIsAddHabitOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Summary Stats */}
      <SummaryStats />
      
      {/* Progress Chart - show different data based on view mode */}
      <ProgressChart />
      
      {/* Today's Habits */}
      <TodaysHabits />
      
      {/* Weekly Overview */}
      <WeeklyOverview />
      
      {/* Add Habit Dialog */}
      <AddHabitDialog open={isAddHabitOpen} onOpenChange={setIsAddHabitOpen} />
    </div>
  );
}
