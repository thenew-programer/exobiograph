"use client";

import { useState } from "react";
import {
  Calendar,
  Building2,
  Shield,
  Users,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowButton } from "@/components/profile/FollowButton";
import VerifiedBadge from "@/components/verification/VerifiedBadge";
import Link from "next/link";

interface Props {
  userId: string;
  profile: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    institution?: string;
    bio?: string;
    is_verified?: boolean;
    reputation_score?: number;
    created_at?: string;
  };
  followerCount: number;
  followingCount: number;
  initialIsFollowing: boolean;
}

export function PublicProfileInterface({
  userId,
  profile,
  followerCount: initialFollowerCount,
  followingCount,
  initialIsFollowing,
}: Props) {
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);

  const handleFollowChange = (isFollowing: boolean) => {
    setFollowerCount((prev) => (isFollowing ? prev + 1 : prev - 1));
  };

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Unknown";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <Link
          href="/community"
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-nasa-blue dark:text-slate-400 dark:hover:text-blue-400"
        >
          ← Back to Community
        </Link>

        {/* Profile Header */}
        <div className="rounded-xl border bg-white p-8 shadow-sm dark:bg-slate-900">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-800 shadow-lg">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="bg-gradient-to-br from-nasa-blue to-blue-600 text-3xl font-bold text-white">
                  {profile.full_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {profile.full_name || "Anonymous User"}
                </h1>
                {profile.is_verified && <VerifiedBadge />}
              </div>

              {profile.institution && (
                <div className="mb-3 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Building2 className="h-4 w-4" />
                  <span>{profile.institution}</span>
                </div>
              )}

              {/* Stats */}
              <div className="mb-4 flex flex-wrap gap-4 text-sm">
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
                  <UserPlus className="h-4 w-4 text-slate-500" />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {followingCount}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Following
                  </span>
                </div>
                {profile.reputation_score !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {profile.reputation_score}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      Reputation
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                <span>Member since {memberSince}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <FollowButton
                userId={userId}
                initialIsFollowing={initialIsFollowing}
                onFollowChange={handleFollowChange}
                size="default"
              />
              {/* Placeholder for future message button */}
              {/* <Button variant="outline" size="default" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Message
              </Button> */}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mt-6 border-t pt-6">
              <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                About
              </h2>
              <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">
                {profile.bio}
              </p>
            </div>
          )}
        </div>

        {/* Recent Activity Section - Placeholder */}
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Recent Activity
          </h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-700" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Activity feed coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
