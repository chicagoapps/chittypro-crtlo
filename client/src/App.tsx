import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import PropertyVerification from "@/pages/property-verification";
import RtloQA from "@/pages/rtlo-qa";
import DocumentGenerator from "@/pages/document-generator";
import AIAnalysis from "@/pages/ai-analysis";
import Subscribe from "@/pages/subscribe";
import LegalAid from "@/pages/legal-aid";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/properties" component={PropertyVerification} />
      <Route path="/rtlo-qa" component={RtloQA} />
      <Route path="/documents" component={DocumentGenerator} />
      <Route path="/ai-analysis" component={AIAnalysis} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/legal-aid" component={LegalAid} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  // Custom sidebar width for the application
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <TooltipProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-4 border-b bg-card">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="text-xl font-bold text-primary">ChittyPro</div>
            </header>
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
