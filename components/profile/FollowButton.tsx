"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}

export function FollowButton({
  userId,
  initialIsFollowing,
  onFollowChange,
  variant = "default",
  size = "default",
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to follow user");
      }

      setIsFollowing(true);
      onFollowChange?.(true);
      toast.success("Successfully followed user");
    } catch (error) {
      console.error("Follow error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to follow user"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unfollow user");
      }

      setIsFollowing(false);
      onFollowChange?.(false);
      toast.success("Successfully unfollowed user");
    } catch (error) {
      console.error("Unfollow error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to unfollow user"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isFollowing) {
    return (
      <Button
        variant={variant === "default" ? "outline" : variant}
        size={size}
        onClick={handleUnfollow}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserMinus className="h-4 w-4" />
        )}
        {isLoading ? "Unfollowing..." : "Unfollow"}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleFollow}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {isLoading ? "Following..." : "Follow"}
    </Button>
  );
}
