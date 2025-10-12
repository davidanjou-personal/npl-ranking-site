import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Rankings from "./pages/Rankings";
import PlayerProfile from "./pages/PlayerProfile";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";
import Tournaments from "./pages/Tournaments";
import TournamentDetail from "./pages/TournamentDetail";
import Players from "./pages/Players";
import ClaimProfile from "./pages/player/ClaimProfile";
import PlayerProfileManage from "./pages/player/PlayerProfile";
import WidgetMensSingles from "./pages/widgets/WidgetMensSingles";
import WidgetWomensSingles from "./pages/widgets/WidgetWomensSingles";
import WidgetMensDoubles from "./pages/widgets/WidgetMensDoubles";
import WidgetWomensDoubles from "./pages/widgets/WidgetWomensDoubles";
import WidgetMixedDoubles from "./pages/widgets/WidgetMixedDoubles";
import WidgetAllCategoriesPage from "./pages/widgets/WidgetAllCategoriesPage";
import WidgetEmbedGuide from "./pages/widgets/WidgetEmbedGuide";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournaments/:id" element={<TournamentDetail />} />
          <Route path="/players" element={<Players />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/player/claim" element={<ClaimProfile />} />
          <Route path="/player/profile" element={<PlayerProfileManage />} />
          <Route path="/player/:id" element={<PlayerProfile />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          
          {/* Widget Routes */}
          <Route path="/widget/mens-singles" element={<WidgetMensSingles />} />
          <Route path="/widget/womens-singles" element={<WidgetWomensSingles />} />
          <Route path="/widget/mens-doubles" element={<WidgetMensDoubles />} />
          <Route path="/widget/womens-doubles" element={<WidgetWomensDoubles />} />
          <Route path="/widget/mixed-doubles" element={<WidgetMixedDoubles />} />
          <Route path="/widget/all-categories" element={<WidgetAllCategoriesPage />} />
          <Route path="/widget/embed-guide" element={<WidgetEmbedGuide />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
