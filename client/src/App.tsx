import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AppUserProvider, useAppUser } from "./contexts/AppUserContext";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectsList from "./pages/ProjectsList";
import PortfolioDashboard from "./pages/PortfolioDashboard";
import CreateProject from "./pages/CreateProject";
import PinLogin from "./pages/PinLogin";

function ProtectedRouter() {
  const { currentUser } = useAppUser();
  const [location] = useLocation();

  // If not logged in, show PIN login
  if (!currentUser) {
    return <PinLogin />;
  }

  return (
    <Switch>
      <Route path="/">
        {currentUser.role === "portfolio_manager"
          ? <Redirect to="/portfolio" />
          : <Redirect to="/projects" />
        }
      </Route>
      <Route path="/portfolio" component={PortfolioDashboard} />
      <Route path="/projects" component={ProjectsList} />
      <Route path="/projects/new" component={CreateProject} />
      <Route path="/project/:id" component={ProjectDetail} />
      {/* Legacy redirect */}
      <Route path="/projects/:id">
        {(params) => <Redirect to={`/project/${params.id}`} />}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AppUserProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <ProtectedRouter />
            </TooltipProvider>
          </LanguageProvider>
        </AppUserProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
