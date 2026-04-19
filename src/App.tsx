import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { LearningProvider } from "@/hooks/useLearningContext";
import AppLayout from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Lernen from "./pages/Lernen";
import Grammar from "./pages/Grammar";
import Quiz from "./pages/Quiz";
import Lueckentext from "./pages/Lueckentext";
import Chat from "./pages/Chat";
import Erfolge from "./pages/Erfolge";
import Vokabeln from "./pages/Vokabeln";
import Statistik from "./pages/Statistik";
import Einstellungen from "./pages/Einstellungen";
import Admin from "./pages/Admin";
import Uben from "./pages/Uben";
import Profil from "./pages/Profil";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient();

const LegacyRedirect = ({ to }: { to: string }) => {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LearningProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/lernen" element={<Lernen />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/vokabeln" element={<Vokabeln />} />
              <Route path="/uben" element={<Uben />}>
                <Route path="quiz" element={<Quiz />} />
                <Route path="grammatik" element={<Grammar />} />
                <Route path="lueckentext" element={<Lueckentext />} />
              </Route>
              <Route path="/profil" element={<Profil />}>
                <Route path="erfolge" element={<Erfolge />} />
                <Route path="statistik" element={<Statistik />} />
                <Route path="einstellungen" element={<Einstellungen />} />
              </Route>
              {/* Legacy redirects */}
              <Route path="/quiz" element={<LegacyRedirect to="/uben/quiz" />} />
              <Route path="/grammatik" element={<LegacyRedirect to="/uben/grammatik" />} />
              <Route path="/lueckentext" element={<LegacyRedirect to="/uben/lueckentext" />} />
              <Route path="/erfolge" element={<LegacyRedirect to="/profil/erfolge" />} />
              <Route path="/statistik" element={<LegacyRedirect to="/profil/statistik" />} />
              <Route path="/einstellungen" element={<LegacyRedirect to="/profil/einstellungen" />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </LearningProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
