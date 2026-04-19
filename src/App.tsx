import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Lernen from "./pages/Lernen";
import Karteikarten from "./pages/Karteikarten";
import Quiz from "./pages/Quiz";
import Lueckentext from "./pages/Lueckentext";
import Chat from "./pages/Chat";
import Erfolge from "./pages/Erfolge";
import Vokabeln from "./pages/Vokabeln";
import Statistik from "./pages/Statistik";
import Einstellungen from "./pages/Einstellungen";
import Admin from "./pages/Admin";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/lernen" element={<Lernen />} />
              <Route path="/karteikarten" element={<Karteikarten />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/lueckentext" element={<Lueckentext />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/erfolge" element={<Erfolge />} />
              <Route path="/vokabeln" element={<Vokabeln />} />
              <Route path="/statistik" element={<Statistik />} />
              <Route path="/einstellungen" element={<Einstellungen />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
