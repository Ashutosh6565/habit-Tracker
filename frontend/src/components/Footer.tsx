import { Flame } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-card border-t border-border py-12">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">Habbiters</span>
          </Link>
          <p className="text-sm text-muted-foreground">Build better habits. Level up your life.</p>
        </div>
        {[
          {
            title: "Product",
            links: [
              { label: "Features", path: "/" },
              { label: "Templates", path: "/templates" },
              { label: "Pricing", path: "/pricing" },
              { label: "Analytics", path: "/analytics" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About", path: "/about" },
              { label: "Blog", path: "/blog" },
              { label: "Careers", path: "/careers" },
              { label: "Contact", path: "/contact" },
            ],
          },
          {
            title: "Legal",
            links: [
              { label: "Privacy", path: "/privacy" },
              { label: "Terms", path: "/terms" },
              { label: "Security", path: "/security" },
            ],
          },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="font-display font-semibold text-foreground mb-3">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-10 pt-6 border-t border-border text-center text-sm text-muted-foreground">
        © 2026 Habbiters. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
