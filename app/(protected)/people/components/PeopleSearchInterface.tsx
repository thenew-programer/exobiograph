"use client";

import { useState, useEffect } from 'react';
import { Search, UserSearch, Users, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

type UserProfile = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

type UserWithCounts = UserProfile & {
  followers_count: number;
  following_count: number;
};

type PeopleSearchInterfaceProps = {
  initialUsers: UserProfile[];
  currentUserId: string;
};

export function PeopleSearchInterface({ initialUsers, currentUserId }: PeopleSearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserWithCounts[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followingLoading, setFollowingLoading] = useState<Set<string>>(new Set());

  const supabase = createBrowserClient();

  // Fetch follower counts for users
  const fetchUserCounts = async (userProfiles: UserProfile[]): Promise<UserWithCounts[]> => {
    const usersWithCounts = await Promise.all(
      userProfiles.map(async (user) => {
        // Get follower count
        const { count: followersCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id);

        // Get following count
        const { count: followingCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id);

        return {
          ...user,
          followers_count: followersCount || 0,
          following_count: followingCount || 0,
        };
      })
    );
    return usersWithCounts;
  };

  // Initialize users with counts
  useEffect(() => {
    fetchUserCounts(initialUsers).then(setUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUsers]);

  // Fetch users being followed
  useEffect(() => {
    const fetchFollowing = async () => {
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);

      if (data) {
        setFollowingIds(new Set(data.map(f => f.following_id)));
      }
    };

    fetchFollowing();
  }, [currentUserId, supabase]);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        fetchUserCounts(initialUsers).then(setUsers);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, bio, avatar_url, created_at')
          .or(`full_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
          .limit(20);

        if (error) throw error;
        
        const usersWithCounts = await fetchUserCounts(data || []);
        setUsers(usersWithCounts);
      } catch (error) {
        console.error('Error searching users:', error);
        toast.error('Failed to search users');
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, initialUsers, supabase]);

  const handleFollow = async (userId: string) => {
    setFollowingLoading(prev => new Set(prev).add(userId));

    try {
      const isFollowing = followingIds.has(userId);

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);

        if (error) throw error;

        setFollowingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });

        // Update counts
        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { ...u, followers_count: Math.max(0, u.followers_count - 1) }
            : u
        ));

        toast.success('Unfollowed successfully');
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: userId
          });

        if (error) throw error;

        setFollowingIds(prev => new Set(prev).add(userId));

        // Update counts
        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { ...u, followers_count: u.followers_count + 1 }
            : u
        ));

        toast.success('Followed successfully');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowingLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getUserInitials = (name: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-nasa-blue to-blue-600 text-white shadow-lg">
            <UserSearch className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Find People
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Discover and connect with researchers
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by name or interests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-nasa-blue animate-spin" />
          )}
        </div>
      </div>

      {/* Results */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <Users className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No people found
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
            {searchQuery ? 'Try adjusting your search terms' : 'No users available at the moment'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-shadow"
            >
              <Link href={`/profile/${user.id}`} className="block mb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || 'User'} />
                    <AvatarFallback className="bg-nasa-blue/10 text-nasa-blue dark:bg-blue-500/20 dark:text-blue-400 text-lg">
                      {getUserInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {user.full_name || 'Anonymous User'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {user.bio || 'No bio yet'}
                    </p>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-4 mb-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{user.followers_count} followers</span>
                </div>
                <div>
                  {user.following_count} following
                </div>
              </div>

              {user.id !== currentUserId && (
                <Button
                  onClick={() => handleFollow(user.id)}
                  disabled={followingLoading.has(user.id)}
                  variant={followingIds.has(user.id) ? "outline" : "default"}
                  className={`w-full ${
                    followingIds.has(user.id)
                      ? 'hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300'
                      : 'bg-nasa-blue hover:bg-nasa-blue/90 text-white'
                  }`}
                  size="sm"
                >
                  {followingLoading.has(user.id) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : followingIds.has(user.id) ? (
                    <UserCheck className="h-4 w-4 mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {followingIds.has(user.id) ? 'Following' : 'Follow'}
                </Button>
              )}

              {user.id === currentUserId && (
                <Badge variant="secondary" className="w-full justify-center">
                  Your Profile
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
