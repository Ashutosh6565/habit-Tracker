import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { HabitProvider } from "@/context/HabitContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AmbientBackground from "@/components/decor/AmbientBackground";
import StickerField from "@/components/decor/StickerField";
import { hideSplash, initNativeShell, isNativeApp } from "@/lib/native";
import { usePageMeta } from "@/lib/seo";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Tracker from "./pages/Tracker";
import Learning from "./pages/Learning";
import Templates from "./pages/Templates";
import Analytics from "./pages/Analytics";
import Gamification from "./pages/Gamification";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Admin from "./pages/Admin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Security from "./pages/Security";
import DeleteAccount from "./pages/DeleteAccount";
import NotFound from "./pages/NotFound";
import HabitCoach from "./components/HabitCoach";
import { MobileApp } from "./mobile/MobileApp";

const queryClient = new QueryClient();

const RouteMeta = () => {
  const { pathname } = useLocation();
  usePageMeta(pathname);
  return null;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <>
      <RouteMeta />
      <AmbientBackground />
      <StickerField variant="ambient" position="fixed" className="-z-10" />
      <ScrollToTop />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<ProtectedRoute permission="dashboard.view"><Dashboard /></ProtectedRoute>} />
            <Route path="/tracker" element={<ProtectedRoute permission="tracker.view" guestAccess><Tracker /></ProtectedRoute>} />
            <Route path="/learning" element={<ProtectedRoute permission="tracker.view" guestAccess><Learning /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute permission="templates.view" guestAccess><Templates /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute permission="analytics.view"><Analytics /></ProtectedRoute>} />
            <Route path="/gamification" element={<ProtectedRoute permission="gamification.view"><Gamification /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<ProtectedRoute permission="profile.view"><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute permission="admin.view"><Admin /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/security" element={<Security />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

const App = () => {
  useEffect(() => {
    initNativeShell();
    const timer = window.setTimeout(hideSplash, 350);
    return () => window.clearTimeout(timer);
  }, []);

  // The WebView in the Android build has no server to rewrite deep paths, so the
  // app uses hash routes. The website keeps clean URLs.
  const Router = isNativeApp ? HashRouter : BrowserRouter;
  // VITE_MOBILE_PREVIEW lets us open the native shell in a browser at phone size.
  const showMobileShell = isNativeApp || import.meta.env.VITE_MOBILE_PREVIEW === "true";

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
        <HabitProvider>
          <Toaster />
          <Sonner />
          <Router>
            {showMobileShell ? (
              <MobileApp />
            ) : (
              <>
                <HabitCoach />
                <AnimatedRoutes />
              </>
            )}
          </Router>
        </HabitProvider>
      </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
