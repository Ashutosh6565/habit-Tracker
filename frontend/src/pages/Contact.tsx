import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Bug, Lightbulb, Newspaper, CreditCard, Loader2, Send, CheckCircle2 } from "lucide-react";
import StaticPage from "@/components/StaticPage";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { api, getApiErrorMessage } from "@/lib/api";

const topics = [
  { value: "general", label: "General question", icon: MessageSquare },
  { value: "billing", label: "Billing & premium", icon: CreditCard },
  { value: "bug", label: "Report a bug", icon: Bug },
  { value: "feature", label: "Feature request", icon: Lightbulb },
  { value: "press", label: "Press & partnerships", icon: Newspaper },
];

const contactEmail = "support@habbiters.app";

const Contact = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<"general" | "billing" | "bug" | "feature" | "press">("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName((current) => current || user.fullName || "");
    setEmail((current) => current || user.email || "");
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    if (message.trim().length < 10) {
      toast({ title: "Message is too short", description: "Please add a little more detail (at least 10 characters).", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const topicLabel = topics.find((t) => t.value === topic)?.label || topic;
      await api.contact.create({
        name: fullName.trim(),
        email: email.trim(),
        topic,
        subject: `[${topicLabel}] Message from ${fullName.trim()}`,
        message: message.trim(),
      });
      setSent(true);
      setMessage("");
      toast({
        title: "Message sent",
        description: "We received your message and will reply within 1–2 business days.",
      });
    } catch (error) {
      toast({ title: "Could not send message", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <StaticPage
      title="Contact Us"
      subtitle="Questions, bugs, ideas, or press — we read every message and reply within 1–2 business days."
      icon={Mail}
      eyebrow="Support"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 md:p-8 space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Your name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Your email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">What's this about?</label>
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTopic(t.value)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                      topic === t.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind…"
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : sent ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {sent ? "Message sent — send another" : "Send message"}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              Your message goes straight to our support inbox. We reply within 1–2 business days.
            </p>
          </motion.form>

          {/* Side cards */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">Email us directly</h3>
              <p className="text-sm text-muted-foreground mb-3">Fastest for anything account or billing related.</p>
              <a href={`mailto:${contactEmail}`} className="text-sm font-medium text-primary hover:underline">{contactEmail}</a>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="glass rounded-2xl p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">Before you write</h3>
              <ul className="space-y-3">
                {[
                  { q: "Forgot your password?", a: "Use the reset link on the login page — it takes 30 seconds." },
                  { q: "Want to cancel premium?", a: "Open Pricing and choose “Cancel subscription at period end”. It stays active until the period ends." },
                  { q: "Reporting a bug?", a: "Include your browser, device, and what you clicked. Screenshots help!" },
                ].map((item) => (
                  <li key={item.q} className="text-sm">
                    <p className="font-medium text-foreground">{item.q}</p>
                    <p className="text-muted-foreground leading-relaxed mt-0.5">{item.a}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Looking for jobs? <a href="/careers" className="text-primary font-medium hover:underline">See open positions →</a>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </StaticPage>
  );
};

export default Contact;
