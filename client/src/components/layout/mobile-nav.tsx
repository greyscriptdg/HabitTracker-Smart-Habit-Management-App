import { Link } from "wouter";
import { Home, Calendar, BarChart2, Settings } from "lucide-react";

interface MobileNavProps {
  currentPath: string;
}

export default function MobileNav({ currentPath }: MobileNavProps) {
  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/calendar", icon: Calendar, label: "Calendar" },
    { path: "/statistics", icon: BarChart2, label: "Stats" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center py-3 ${
              currentPath === item.path ? "text-primary" : "text-gray-600"
            }`}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
