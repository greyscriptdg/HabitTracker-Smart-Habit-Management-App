import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Dashboard from "@/pages/dashboard";
import Calendar from "@/pages/calendar";
import Statistics from "@/pages/statistics";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";

function Router() {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar currentPath={location} />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Main Content Area with Routes */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/calendar" component={Calendar} />
            <Route path="/statistics" component={Statistics} />
            <Route path="/settings" component={Settings} />
            {/* Fallback to 404 */}
            <Route component={NotFound} />
          </Switch>
        </main>

        {/* Mobile Navigation */}
        <MobileNav currentPath={location} />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
