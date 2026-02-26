import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/NotFound';
import { Route, Switch, Redirect, Router } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProjectDetail from './pages/ProjectDetail';
import ProjectsList from './pages/ProjectsList';

function RouterContent() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/projects" />
      </Route>
      <Route path="/projects" component={ProjectsList} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router base="/mnabrpmo01">
              <RouterContent />
            </Router>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
