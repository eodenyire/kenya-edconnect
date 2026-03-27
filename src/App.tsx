import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import DigiGuide from "./pages/DigiGuide";
import DigiLab from "./pages/DigiLab";
import DigiChat from "./pages/DigiChat";
import DigiBlog from "./pages/DigiBlog";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected app routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/digiguide" element={<DigiGuide />} />
              <Route path="/digilab" element={<DigiLab />} />
              <Route path="/digichat" element={<DigiChat />} />
              <Route path="/digiblog" element={<DigiBlog />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
