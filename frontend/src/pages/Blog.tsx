import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Clock, Newspaper } from "lucide-react";
import StaticPage from "@/components/StaticPage";
import { blogPosts } from "@/data/blogPosts";

const categoryColors: Record<string, string> = {
  "Behavioral Science": "bg-primary/10 text-primary",
  "How-To": "bg-success/10 text-success",
  "Product": "bg-accent/10 text-accent",
  "Playbook": "bg-streak/10 text-streak",
  "Company": "bg-secondary text-muted-foreground",
};

const Blog = () => (
  <StaticPage
    title="Habbiters Blog"
    subtitle="Science-backed guides on building habits that stick — from streak psychology to ready-to-run playbooks."
    icon={Newspaper}
    eyebrow="Blog"
  >
    <div className="container mx-auto max-w-6xl">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {blogPosts.map((post, i) => (
          <motion.div
            key={post.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i * 0.07, 0.3) }}
          >
            <Link
              to={`/blog/${post.slug}`}
              className="block h-full glass rounded-2xl p-6 hover:border-primary/40 hover:shadow-lg transition-all group flex flex-col"
            >
              <span className={`self-start text-[11px] font-semibold px-2.5 py-1 rounded-full mb-4 ${categoryColors[post.category] || "bg-secondary text-muted-foreground"}`}>
                {post.category}
              </span>
              <h2 className="font-display font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{post.excerpt}</p>
              <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {post.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
              </div>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-primary mt-4">
                Read article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </StaticPage>
);

export default Blog;
