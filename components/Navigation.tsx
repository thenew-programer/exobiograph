'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Rocket, Menu, X, Sparkles, Github } from "lucide-react";
import { useState, useEffect } from "react";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'border-b bg-white/95 backdrop-blur-lg shadow-sm supports-[backdrop-filter]:bg-white/80 dark:bg-slate-950/95' 
        : 'border-b border-transparent bg-white dark:bg-slate-950'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-nasa-blue to-blue-600 transition-transform group-hover:scale-105">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 dark:text-white">
                ExoBioGraph
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                NASA Biology Research
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/#features" 
              className="group relative text-sm font-medium text-slate-600 hover:text-nasa-blue dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
            >
              Features
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-nasa-blue transition-all group-hover:w-full" />
            </Link>
            <Link 
              href="/#about" 
              className="group relative text-sm font-medium text-slate-600 hover:text-nasa-blue dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
            >
              About
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-nasa-blue transition-all group-hover:w-full" />
            </Link>

          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button asChild variant="ghost" className="font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="group bg-gradient-to-r from-[#2a5298] to-[#3a62a8] hover:from-[#1e3a6f] hover:to-[#2a5298] text-white font-medium shadow-md hover:shadow-lg transition-all">
              <Link href="/signup" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Get Started
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-1 border-t animate-in slide-in-from-top-2 duration-200">
            <Link 
              href="/#features" 
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-nasa-blue dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/#about" 
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-nasa-blue dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <a 
              href="https://github.com/thenew-programer/exobiograph" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-nasa-blue dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <div className="pt-4 space-y-2 border-t mt-4">
              <Button asChild variant="outline" className="w-full font-medium">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="w-full bg-gradient-to-r from-[#2a5298] to-[#3a62a8] hover:from-[#1e3a6f] hover:to-[#2a5298] font-medium shadow-md">
                <Link href="/signup" className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
