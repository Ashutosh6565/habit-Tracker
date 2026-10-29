import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-12">
        <div className="text-center">
          <h1 className="mb-3 text-5xl font-display font-bold text-foreground">404</h1>
          <p className="mb-6 text-xl text-muted-foreground">We couldn't find that page.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/" className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
              Return to Home
            </Link>
            <Link to="/contact" className="px-5 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-secondary">
              Contact support
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
