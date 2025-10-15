import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin, Youtube, Globe } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";

export function Footer() {
  const { currentOrg } = useOrganization();
  const isGPA = currentOrg?.slug === 'gpa';
  return (
    <footer className="border-t py-8 px-4 bg-card mt-12">
      <div className="container mx-auto">
        <div className="flex flex-col gap-6 items-center">
          {/* Social Media Links */}
          {!isGPA ? (
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/nplpickleball/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/nplpickleball"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/nplpickleball/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://www.youtube.com/@NPLPickleball"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          ) : (
            <div className="flex gap-4">
              <a
                href="https://theapp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="APP Website"
              >
                <Globe className="h-5 w-5" />
              </a>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            {!isGPA ? (
              <>
                <a
                  href="https://www.nplpickleball.com.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Visit NPL Website
                </a>
                <span className="text-muted-foreground">•</span>
                <Link
                  to="/how-it-works"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  How Rankings Work
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  About GPA
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link
                  to="/member-organizations"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Member Organizations
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link
                  to="/governance"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Governance
                </Link>
              </>
            )}
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground text-center">
            &copy; 2025 {isGPA ? 'Global Pickleball Alliance' : 'National Pickleball League'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
