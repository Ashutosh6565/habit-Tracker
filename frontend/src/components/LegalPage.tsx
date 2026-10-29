import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import StaticPage from "@/components/StaticPage";

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

interface LegalPageProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  lastUpdated: string;
  sections: LegalSection[];
}

const LegalPage = ({ title, subtitle, icon, lastUpdated, sections }: LegalPageProps) => (
  <StaticPage title={title} subtitle={subtitle} icon={icon} eyebrow="Legal" meta={`Last updated: ${lastUpdated}`}>
    <div className="container mx-auto max-w-6xl">
      <div className="grid lg:grid-cols-[240px_1fr] gap-10">
        {/* Table of contents */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 glass rounded-2xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">On this page</p>
            <ul className="space-y-1.5">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block text-sm text-muted-foreground hover:text-primary transition-colors leading-snug">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, i) => (
            <motion.section
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.2) }}
              className="glass rounded-2xl p-6 md:p-8 scroll-mt-24"
            >
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-start gap-3">
                <span className="text-primary font-mono text-sm mt-1">{String(i + 1).padStart(2, "0")}</span>
                {section.heading}
              </h2>
              {section.paragraphs?.map((p, j) => (
                <p key={j} className="text-sm text-muted-foreground leading-relaxed mb-3 last:mb-0">{p}</p>
              ))}
              {section.bullets && (
                <ul className="mt-3 space-y-2">
                  {section.bullets.map((b, j) => (
                    <li key={j} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  </StaticPage>
);

export default LegalPage;
