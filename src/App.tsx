import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { LearningProvider } from "@/hooks/useLearningContext";
import AppLayout from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Start from "./pages/Start";
import Grammar from "./pages/Grammar";
import Quiz from "./pages/Quiz";
import Lueckentext from "./pages/Lueckentext";
import Chat from "./pages/Chat";
import Erfolge from "./pages/Erfolge";
import Vokabeln from "./pages/Vokabeln";
import Statistik from "./pages/Statistik";
import Einstellungen from "./pages/Einstellungen";
import Admin from "./pages/Admin";
import Training from "./pages/Training";
import Lektionen from "./pages/Lektionen";
import Lektion from "./pages/Lektion";
import Wortpuzzle from "./pages/Wortpuzzle";
import Profil from "./pages/Profil";
import Unterstuetzen from "./pages/Unterstuetzen";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Onboarding from "./pages/Onboarding";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const LegacyRedirect = ({ to }: { to: string }) => {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
};

const LegacyLessonRedirect = () => {
  const { lessonId } = useParams();
  const location = useLocation();
  return <Navigate to={`/training/lektionen/${lessonId}${location.search}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LearningProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/start" element={<Start />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/vokabeln" element={<Vokabeln />} />
              <Route path="/training" element={<Training />}>
                <Route path="lektionen" element={<Lektionen />} />
                <Route path="lektionen/:lessonId" element={<Lektion />} />
                <Route path="wortpuzzle" element={<Wortpuzzle />} />
                <Route path="quiz" element={<Quiz />} />
                <Route path="grammatik" element={<Grammar />} />
                <Route path="lueckentext" element={<Lueckentext />} />
              </Route>
              <Route path="/profil" element={<Profil />}>
                <Route path="erfolge" element={<Erfolge />} />
                <Route path="statistik" element={<Statistik />} />
                <Route path="unterstuetzen" element={<Unterstuetzen />} />
                <Route path="einstellungen" element={<Einstellungen />} />
              </Route>
              {/* Legacy redirects — keep old bookmarks/links working */}
              <Route path="/lernen" element={<LegacyRedirect to="/start" />} />
              <Route path="/uben" element={<LegacyRedirect to="/training" />} />
              <Route path="/uben/lektionen" element={<LegacyRedirect to="/training/lektionen" />} />
              <Route path="/uben/lektionen/:lessonId" element={<LegacyLessonRedirect />} />
              <Route path="/uben/wortpuzzle" element={<LegacyRedirect to="/training/wortpuzzle" />} />
              <Route path="/uben/quiz" element={<LegacyRedirect to="/training/quiz" />} />
              <Route path="/uben/grammatik" element={<LegacyRedirect to="/training/grammatik" />} />
              <Route path="/uben/lueckentext" element={<LegacyRedirect to="/training/lueckentext" />} />
              <Route path="/quiz" element={<LegacyRedirect to="/training/quiz" />} />
              <Route path="/grammatik" element={<LegacyRedirect to="/training/grammatik" />} />
              <Route path="/lueckentext" element={<LegacyRedirect to="/training/lueckentext" />} />
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
