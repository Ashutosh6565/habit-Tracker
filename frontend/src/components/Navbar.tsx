import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Flame, Shield, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Tracker", path: "/tracker" },
  { label: "Learning", path: "/learning" },
  { label: "Templates", path: "/templates" },
  { label: "Analytics", path: "/analytics" },
  { label: "Gamification", path: "/gamification" },
  { label: "Pricing", path: "/pricing" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const routePermission: Record<string, string> = {
    "/dashboard": "dashboard.view",
    "/tracker": "tracker.view",
    "/learning": "tracker.view",
    "/templates": "templates.view",
    "/analytics": "analytics.view",
    "/gamification": "gamification.view",
    "/pricing": "pricing.view",
  };
  const guestLinks = new Set(["/", "/templates", "/pricing"]);
  const visibleNavLinks = navLinks.filter((link) => {
    if (!user && !guestLinks.has(link.path)) return false;
    const permission = routePermission[link.path];
    return !permission || user?.permissions?.[permission] !== false;
  });
  const canAccessAdmin = isAdmin || user?.permissions?.["admin.view"];

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    setAvatarUrl(user.avatarUrl || null);
  }, [user, location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass native-nav">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">Habbiters</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {visibleNavLinks.map((link) => (
              <Link key={link.path} to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}>{link.label}</Link>
            ))}
            {canAccessAdmin && (
              <Link to="/admin" className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                location.pathname === "/admin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}><Shield className="w-3.5 h-3.5" /> Admin</Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/profile" className="rounded-full overflow-hidden hover:ring-2 hover:ring-primary transition-all" title="Profile">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </Link>
                <span className="text-sm text-muted-foreground truncate max-w-[150px]">{user.email}</span>
                <button onClick={handleSignOut} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
                <Link to="/signup" className="px-4 py-2 text-sm font-medium rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">Get Started</Link>
              </>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-muted-foreground hover:text-foreground">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden glass border-t border-border">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {visibleNavLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.path ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}>{link.label}</Link>
              ))}
              {canAccessAdmin && (
                <Link to="/admin" onClick={() => setIsOpen(false)} className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Admin
                </Link>
              )}
              <div className="flex gap-2 pt-2 border-t border-border mt-2">
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2 text-sm font-medium text-center rounded-lg border border-border text-foreground">Profile</Link>
                    <button onClick={() => { handleSignOut(); setIsOpen(false); }} className="flex-1 px-4 py-2 text-sm font-medium text-center rounded-lg border border-border text-foreground">Log out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2 text-sm font-medium text-center rounded-lg border border-border text-foreground">Log in</Link>
                    <Link to="/signup" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2 text-sm font-medium text-center rounded-lg gradient-primary text-primary-foreground">Get Started</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
