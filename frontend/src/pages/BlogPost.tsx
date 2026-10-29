import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Clock, Quote, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getBlogPost } from "@/data/blogPosts";
import { applyMeta } from "@/lib/seo";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  useEffect(() => {
    if (post) {
      applyMeta(`/blog/${post.slug}`, {
        title: `${post.title} — Habbiters Blog`,
        description: post.excerpt,
      });
    }
    window.scrollTo(0, 0);
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-40 pb-20 px-4 text-center">
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">Article not found</h1>
          <Link to="/blog" className="text-primary font-medium hover:underline">Back to the blog</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <article className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" /> All articles
            </Link>
            <span className="block w-fit text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-4">
              {post.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight mb-4">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground pb-8 border-b border-border">
              <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {post.author}</span>
              <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {post.date}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {post.readTime}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8"
          >
            {post.blocks.map((block, i) => {
              switch (block.type) {
                case "h2":
                  return (
                    <h2 key={i} className="text-2xl font-display font-bold text-foreground mt-10 mb-3">
                      {block.text}
                    </h2>
                  );
                case "quote":
                  return (
                    <blockquote key={i} className="my-8 glass rounded-2xl p-6 border-l-4 border-l-primary">
                      <Quote className="w-5 h-5 text-primary mb-2" />
                      <p className="text-lg font-display font-semibold text-foreground leading-snug">{block.text}</p>
                    </blockquote>
                  );
                case "list":
                  return (
                    <ul key={i} className="my-4 space-y-2.5">
                      {block.items.map((item, j) => (
                        <li key={j} className="text-muted-foreground leading-relaxed flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  );
                default:
                  return (
                    <p key={i} className="text-muted-foreground leading-relaxed my-4">
                      {block.text}
                    </p>
                  );
              }
            })}

            <div className="mt-12 glass rounded-2xl p-6 text-center">
              <p className="font-display font-bold text-foreground mb-2">Put this into practice</p>
              <p className="text-sm text-muted-foreground mb-4">Track this habit in Habbiters and earn XP for every day you show up.</p>
              <Link to="/signup" className="inline-block px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
                Start Free
              </Link>
            </div>
          </motion.div>
        </div>
      </article>
      <Footer />
    </div>
  );
};

export default BlogPost;
