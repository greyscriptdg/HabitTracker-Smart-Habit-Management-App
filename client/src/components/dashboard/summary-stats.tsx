import { useQuery } from "@tanstack/react-query";
import { Check, BarChart2, Bell, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Habit } from "@shared/schema";
import { motion } from "framer-motion";

interface SummaryStatsProps {
  completedToday: number;
  totalHabits: number;
  weeklyCompletion: number;
  longestStreak: number;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { 
    y: 20, 
    opacity: 0,
    scale: 0.9
  },
  visible: { 
    y: 0, 
    opacity: 1,
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 15 
    }
  },
  hover: {
    y: -5,
    scale: 1.03,
    boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
    transition: {
      type: "spring",
      stiffness: 500
    }
  }
};

const iconContainerVariants = {
  hidden: { scale: 0, rotate: -30 },
  visible: { 
    scale: 1, 
    rotate: 0,
    transition: { 
      type: "spring", 
      stiffness: 500, 
      delay: 0.2 
    }
  },
  hover: {
    rotate: [0, 15, -15, 10, -10, 0],
    transition: {
      duration: 0.6
    }
  }
};

const numberVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 300,
      delay: 0.3
    }
  }
};

export default function SummaryStats() {
  const { data: habits, isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });

  const { data: completions, isLoading: isLoadingCompletions } = useQuery<any[]>({
    queryKey: ['/api/completions'],
    queryFn: async () => {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/completions?startDate=${today}&endDate=${today}`);
      if (!res.ok) throw new Error('Failed to fetch completions');
      return res.json();
    }
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<any[]>({
    queryKey: ['/api/stats'],
  });

  const totalHabits = habits?.length || 0;
  const completedToday = completions?.filter(c => c.completed).length || 0;
  
  // Calculate weekly completion percentage - average of all habit completion rates
  const weeklyCompletion = stats && stats.length > 0
    ? Math.round(stats.reduce((sum, stat) => sum + stat.completionRate, 0) / stats.length)
    : 0;

  // Find the longest streak across all habits
  const longestStreak = stats && stats.length > 0
    ? Math.max(...stats.map(stat => stat.longestStreak))
    : 0;

  const isLoading = isLoadingHabits || isLoadingCompletions || isLoadingStats;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
            <div className="flex items-center">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="ml-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Completed Today",
      value: `${completedToday}/${totalHabits}`,
      icon: Check,
      bgColor: "bg-indigo-100",
      textColor: "text-primary"
    },
    {
      title: "Weekly Completion",
      value: `${weeklyCompletion}%`,
      icon: BarChart2,
      bgColor: "bg-green-100",
      textColor: "text-secondary"
    },
    {
      title: "Longest Streak",
      value: `${longestStreak} days`,
      icon: Bell,
      bgColor: "bg-orange-100",
      textColor: "text-accent"
    },
    {
      title: "Total Habits",
      value: `${totalHabits}`,
      icon: Clock,
      bgColor: "bg-blue-100",
      textColor: "text-primary"
    }
  ];

  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {statCards.map((card, index) => (
        <motion.div 
          key={index}
          className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 cursor-pointer"
          variants={cardVariants}
          whileHover="hover"
          style={{ perspective: "1000px" }}
        >
          <div className="flex items-center">
            <motion.div 
              className={`p-3 rounded-full ${card.bgColor} ${card.textColor}`}
              variants={iconContainerVariants}
            >
              <card.icon className="h-6 w-6" />
            </motion.div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
              <motion.p 
                className="text-2xl font-semibold text-gray-800"
                variants={numberVariants}
              >
                {card.value}
              </motion.p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
