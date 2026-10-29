import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, MapPin, Clock, ChevronDown, Gift, Mail } from "lucide-react";
import StaticPage from "@/components/StaticPage";
import { openings, perks, type JobOpening } from "@/data/careers";

const JobCard = ({ job, index }: { job: JobOpening; index: number }) => {
  const [open, setOpen] = useState(false);
  const applySubject = encodeURIComponent(`Application: ${job.title}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.06, 0.3) }}
      className="glass rounded-2xl overflow-hidden"
    >
      <button onClick={() => setOpen(!open)} className="w-full p-6 text-left flex items-start sm:items-center gap-4 hover:bg-secondary/40 transition-colors">
        <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shrink-0">
          <Briefcase className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground">{job.title}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
            <span>{job.department}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.type}</span>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-border space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed mt-4">{job.description}</p>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">What you'll do</h4>
                <ul className="space-y-1.5">
                  {job.responsibilities.map((r, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">What you'll bring</h4>
                <ul className="space-y-1.5">
                  {job.requirements.map((r, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href={`mailto:careers@habbiters.app?subject=${applySubject}`}
                className="inline-block px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Apply now
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Careers = () => (
  <StaticPage
    title="Careers at Habbiters"
    subtitle="Build products that help people become who they want to be. Small team, big impact, fully remote."
    icon={Briefcase}
    eyebrow="Careers"
  >
    <div className="container mx-auto max-w-6xl space-y-20">
      {/* Perks */}
      <section>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">Why you'll love it here</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl">We hire adults and treat them like adults. Perks that actually matter:</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {perks.map((perk, i) => (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.06, 0.3) }}
              className="glass rounded-2xl p-6"
            >
              <div className="w-10 h-10 rounded-xl gradient-xp flex items-center justify-center mb-4">
                <Gift className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1.5">{perk.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{perk.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Openings */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-display font-bold text-foreground">Open positions</h2>
          <span className="text-sm text-muted-foreground">{openings.length} open</span>
        </div>
        <p className="text-muted-foreground mb-8 max-w-2xl">Don't see your exact role? Email us anyway — we hire exceptional people before we need them.</p>
        <div className="space-y-3">
          {openings.map((job, i) => (
            <JobCard key={job.id} job={job} index={i} />
          ))}
        </div>
        <div className="mt-8 glass rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground">Open application</h3>
            <p className="text-sm text-muted-foreground">Tell us what you'd bring to the team — careers@habbiters.app</p>
          </div>
          <a href="mailto:careers@habbiters.app" className="px-5 py-2.5 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-secondary transition-colors shrink-0">
            Email us
          </a>
        </div>
      </section>
    </div>
  </StaticPage>
);

export default Careers;
