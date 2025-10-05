"use client";

import { useState } from "react";
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  LogOut, 
  Settings,
  Bell,
  Shield,
  Trash2,
  Save,
  AlertCircle,
  Moon,
  Sun,
  Monitor,
  Check,
  Building2,
  FileText,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import VerifiedBadge from "@/components/verification/VerifiedBadge";
import VerificationPrompt from "@/components/verification/VerificationPrompt";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

interface Props {
  user: User;
  profile: {
    full_name?: string;
    avatar_url?: string;
    institution?: string;
    bio?: string;
    is_verified?: boolean;
    reputation_score?: number;
    preferences?: {
      email_notifications?: boolean;
      push_notifications?: boolean;
      save_search_history?: boolean;
      theme?: string;
    };
  } | null;
  followerCount?: number;
  followingCount?: number;
}

export function ProfileInterface({ user, profile, followerCount = 0, followingCount = 0 }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(!profile?.is_verified);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Profile settings
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [institution, setInstitution] = useState(profile?.institution || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  
  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(profile?.preferences?.email_notifications ?? true);
  const [pushNotifications, setPushNotifications] = useState(profile?.preferences?.push_notifications ?? false);
  const [searchHistory, setSearchHistory] = useState(profile?.preferences?.save_search_history ?? true);
  const [theme, setTheme] = useState(profile?.preferences?.theme || "system");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error("Full name cannot be empty");
      return;
    }
    
    setIsUpdating(true);

    try {
      const supabase = createBrowserClient();

      const { error } = await supabase
        .from("profiles")
        .update({ 
          full_name: fullName.trim(),
          institution: institution.trim() || null,
          bio: bio.trim() || null
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("Update error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePreferences = async () => {
    setIsUpdating(true);

    try {
      const supabase = createBrowserClient();

      const { error } = await supabase
        .from("profiles")
        .update({
          preferences: {
            email_notifications: emailNotifications,
            push_notifications: pushNotifications,
            save_search_history: searchHistory,
            theme: theme,
          }
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Preferences updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("Update error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update preferences";
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    } finally {
      setIsSigningOut(false);
      setShowSignOutConfirm(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      const supabase = createBrowserClient();

      // Delete profile (cascades to conversations, messages, etc.)
      const { error } = await supabase.from("profiles").delete().eq("id", user.id);

      if (error) throw error;

      toast.success("Account deleted successfully");
      
      // Sign out and redirect
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Delete error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete account";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your account, preferences, and privacy settings
          </p>
        </div>

        {/* Verification Prompt for unverified users */}
        {showVerificationPrompt && (
          <div className="mb-6">
            <VerificationPrompt onDismiss={() => setShowVerificationPrompt(false)} />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900">
              {/* Avatar and Profile Info Header */}
              <div className="mb-6 pb-6 border-b dark:border-slate-700">
                <div className="flex items-start gap-6">
                  {/* Avatar with hover controls */}
                  <AvatarUpload
                    userId={user.id}
                    currentAvatarUrl={avatarUrl}
                    currentName={fullName || user.email || 'U'}
                    onUploadSuccess={(url) => {
                      setAvatarUrl(url);
                      router.refresh();
                    }}
                  />

                  {/* Profile Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {fullName || 'User'}
                      </h2>
                      {profile?.is_verified && <VerifiedBadge size="md" />}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {user.email}
                    </p>
                    {institution && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-3">
                        <Building2 className="h-4 w-4" />
                        {institution}
                      </p>
                    )}
                    {/* Followers/Following Stats */}
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-slate-500" />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {followerCount}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          Followers
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="h-4 w-4 text-slate-500" />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {followingCount}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          Following
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName" className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <UserIcon className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    disabled={isUpdating}
                    className="h-11"
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <Label htmlFor="email" className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="h-11 bg-slate-50 dark:bg-slate-800/50"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Email address cannot be changed
                  </p>
                </div>

                {/* Account Created */}
                <div>
                  <Label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </Label>
                  <Input
                    type="text"
                    value={new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    disabled
                    className="h-11 bg-slate-50 dark:bg-slate-800/50"
                  />
                </div>

                {/* Institution */}
                <div>
                  <Label htmlFor="institution" className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4" />
                    Institution
                  </Label>
                  <Input
                    id="institution"
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g., MIT, NASA, University of Tokyo"
                    disabled={isUpdating}
                    className="h-11"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Your university or research organization
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <Label htmlFor="bio" className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief description of your research interests..."
                    disabled={isUpdating}
                    rows={4}
                    maxLength={500}
                    className="resize-none"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {bio.length}/500 characters
                  </p>
                </div>

                {/* Update Button */}
                <Button 
                  type="submit" 
                  disabled={isUpdating} 
                  className="w-full bg-nasa-blue hover:bg-nasa-blue/90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            {/* Notifications */}
            <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-nasa-blue" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Notifications
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4 dark:border-slate-700">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      Email Notifications
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Receive email updates about your activity
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4 dark:border-slate-700">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      Push Notifications
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Get notified about new research and updates
                    </p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-nasa-blue" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Privacy
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4 dark:border-slate-700">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      Save Search History
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Store your searches for better recommendations
                    </p>
                  </div>
                  <Switch
                    checked={searchHistory}
                    onCheckedChange={setSearchHistory}
                  />
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-nasa-blue" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Appearance
                </h3>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                      theme === "light"
                        ? "border-nasa-blue bg-nasa-blue/5"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                    }`}
                  >
                    <Sun className="h-5 w-5" />
                    <span className="text-sm font-medium">Light</span>
                    {theme === "light" && (
                      <div className="absolute right-2 top-2">
                        <Check className="h-4 w-4 text-nasa-blue" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                      theme === "dark"
                        ? "border-nasa-blue bg-nasa-blue/5"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                    }`}
                  >
                    <Moon className="h-5 w-5" />
                    <span className="text-sm font-medium">Dark</span>
                    {theme === "dark" && (
                      <div className="absolute right-2 top-2">
                        <Check className="h-4 w-4 text-nasa-blue" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                      theme === "system"
                        ? "border-nasa-blue bg-nasa-blue/5"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                    }`}
                  >
                    <Monitor className="h-5 w-5" />
                    <span className="text-sm font-medium">System</span>
                    {theme === "system" && (
                      <div className="absolute right-2 top-2">
                        <Check className="h-4 w-4 text-nasa-blue" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Save Preferences Button */}
            <Button 
              onClick={handleUpdatePreferences}
              disabled={isUpdating} 
              className="w-full bg-nasa-blue hover:bg-nasa-blue/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {isUpdating ? "Saving..." : "Save Preferences"}
            </Button>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Sign Out */}
            <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Sign out of your account on this device. You can always sign back in.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowSignOutConfirm(true)}
                  className="ml-4"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-900/10">
              <div className="mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">
                  Danger Zone
                </h3>
              </div>

              <div className="rounded-lg border border-red-300 bg-white p-4 dark:border-red-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold text-red-900 dark:text-red-300">
                      Delete Account
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <div className="mt-3 flex items-start gap-2 rounded-md bg-red-100 p-3 dark:bg-red-950/30">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                      <div className="text-xs text-red-800 dark:text-red-300">
                        <p className="font-medium">This will delete:</p>
                        <ul className="mt-1 list-inside list-disc space-y-0.5">
                          <li>Your profile and account information</li>
                          <li>All conversations and messages</li>
                          <li>Search history and preferences</li>
                          <li>All other associated data</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="shrink-0"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
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
        isLoading={isSigningOut}
      />

      {/* Delete Account Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteAccount}
        title="Delete Account Permanently"
        description="Are you absolutely sure? This will permanently delete your account, all conversations, search history, and all associated data. This action cannot be undone."
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
