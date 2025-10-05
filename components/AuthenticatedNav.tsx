"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { 
  Search, 
  Network, 
  User, 
  LogOut,
  Menu,
  X,
  Bot,
  UserSearch,
  MessagesSquare
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type AuthenticatedNavProps = {
  userEmail?: string;
  avatarUrl?: string;
  userName?: string;
};

export function AuthenticatedNav({ userEmail, avatarUrl, userName }: AuthenticatedNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const supabase = createBrowserClient();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Failed to sign out");
    } finally {
      setIsLoggingOut(false);
      setShowSignOutConfirm(false);
    }
  };

  const openSignOutConfirm = () => {
    setShowSignOutConfirm(true);
  };

  const navLinks = [
    { href: '/search', label: 'Search', icon: Search },
    { href: '/chat', label: 'AI Chat', icon: Bot },
    { href: '/graph', label: 'Knowledge Graph', icon: Network },
    { href: '/community', label: 'Community', icon: MessagesSquare },
    { href: '/people', label: 'People', icon: UserSearch },
  ];

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'border-b bg-white/95 backdrop-blur-lg shadow-sm supports-[backdrop-filter]:bg-white/80 dark:bg-slate-900/95' 
        : 'border-b bg-white dark:bg-slate-900'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-center">
          {/* Desktop Navigation - Icons Only */}
          <div className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center justify-center rounded-lg p-2.5 transition-all ${
                    isActive
                      ? 'bg-nasa-blue/10 text-nasa-blue dark:bg-blue-500/20 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-nasa-blue dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400'
                  }`}
                  title={link.label}
                >
                  <Icon className={`h-4 w-4 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                </Link>
              );
            })}
          
            {/* Separator */}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="group rounded-full p-0 transition-all hover:shadow-md"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-offset-2 ring-transparent group-hover:ring-nasa-blue/20 transition-all">
                    <AvatarImage src={avatarUrl} alt={userName || userEmail} />
                    <AvatarFallback className="bg-gradient-to-br from-nasa-blue to-blue-600 text-sm font-bold text-white">
                      {getInitials(userName, userEmail)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">My Account</p>
                    <p className="text-xs leading-none text-slate-500 dark:text-slate-400">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sign Out Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={openSignOutConfirm}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden absolute right-4"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t py-4 md:hidden animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1 mb-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-nasa-blue/10 text-nasa-blue dark:bg-blue-500/20 dark:text-blue-400'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-nasa-blue dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
            
            <div className="border-t pt-4">
              <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarUrl} alt={userName || userEmail} />
                  <AvatarFallback className="bg-gradient-to-br from-nasa-blue to-blue-600 text-sm font-bold text-white">
                    {getInitials(userName, userEmail)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{userName || userEmail?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
                </div>
              </div>
              
              <Link
                href="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <User className="h-5 w-5" />
                Profile Settings
              </Link>
              
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  openSignOutConfirm();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sign Out Confirmation Dialog */}
      <ConfirmationDialog
        open={showSignOutConfirm}
        onOpenChange={setShowSignOutConfirm}
        onConfirm={handleSignOut}
        title="Sign Out"
        description="Are you sure you want to sign out? You'll need to log in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isLoggingOut}
      />
    </nav>
  );
}
