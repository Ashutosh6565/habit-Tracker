import { ReactNode, useEffect } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface StaticPageProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  eyebrow?: string;
  meta?: string;
  children: ReactNode;
}

const StaticPage = ({ title, subtitle, icon: Icon, eyebrow, meta, children }: StaticPageProps) => {
  useEffect(() => {
    document.title = `${title} — Habbiters`;
  }, [title]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-lg">
              <Icon className="w-7 h-7 text-primary-foreground" />
            </div>
            {eyebrow && (
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">{eyebrow}</p>
            )}
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-4">{title}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
            {meta && <p className="text-sm text-muted-foreground/70 mt-3">{meta}</p>}
          </motion.div>
        </div>
      </section>
      <main className="pb-20 px-4">{children}</main>
      <Footer />
    </div>
  );
};

export default StaticPage;
