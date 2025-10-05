import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Rocket, Github, Mail, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#2a5298] text-[#2a5298] px-3 py-1">
                <Rocket className="mr-2 h-4 w-4" />
                ExoBioGraph
              </Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              NASA Biology Knowledge Engine - Explore space biology research through AI-powered 
              conversations, intelligent search, and interactive knowledge graphs.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/thenew-programer/exobiograph"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="mailto:support@exobiograph.com"
                className="text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#features" className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors">
                  AI Chatbot
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors">
                  Knowledge Graph
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors">
                  Advanced Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://ntrs.nasa.gov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors inline-flex items-center gap-1"
                >
                  NASA Technical Reports
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.nasa.gov/biological-physical/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors inline-flex items-center gap-1"
                >
                  Space Biology Research
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.nasa.gov/missions/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors inline-flex items-center gap-1"
                >
                  NASA Missions
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <Link href="/#about" className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors">
                  API Reference
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#about" className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:contact@exobiograph.com"
                  className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <Link href="/#about" className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} ExoBioGraph. Built for NASA Space Apps Challenge 2025.
          </p>
          <div className="flex flex-wrap gap-6">
            <Link href="/#about" className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors">
              Privacy
            </Link>
            <Link href="/#about" className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors">
              Terms
            </Link>
            <Link href="/#about" className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors">
              Cookies
            </Link>
            <a 
              href="https://www.nasa.gov" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-slate-600 hover:text-[#2a5298] dark:text-slate-400 dark:hover:text-[#4a72b8] transition-colors inline-flex items-center gap-1"
            >
              NASA.gov
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Attribution */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-center text-slate-500 dark:text-slate-500">
            This project uses data from NASA&apos;s Technical Reports Server (NTRS) and is created 
            as part of the NASA Space Apps Challenge. Not officially affiliated with NASA.
          </p>
        </div>
      </div>
    </footer>
  );
}
