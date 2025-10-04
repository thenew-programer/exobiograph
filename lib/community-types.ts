export type PostType = 'discussion' | 'question' | 'insight' | 'announcement' | 'paper_share';
export type ReactionType = 'like' | 'helpful' | 'insightful';
export type NotificationType = 'post_reply' | 'comment_reply' | 'mention' | 'like' | 'follow' | 'best_answer' | 'new_post_from_following';

export interface CommunityPost {
  id: string;
  author_id: string;
  post_type: PostType;
  title: string;
  content: string;
  linked_paper_id?: string;
  linked_paper_title?: string;
  linked_paper_doi?: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  save_count: number;
  is_pinned: boolean;
  is_archived: boolean;
  is_locked: boolean;
  accepted_answer_id?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  author?: {
    full_name: string;
    avatar_url?: string;
    institution?: string;
    is_verified: boolean;
    reputation_score: number;
  };
  tags?: Tag[];
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id?: string;
  content: string;
  depth: number;
  like_count: number;
  is_best_answer: boolean;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined data
  author?: {
    full_name: string;
    avatar_url?: string;
    is_verified: boolean;
  };
  replies?: CommunityComment[];
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  use_count: number;
  color?: string;
}

export interface CommunityReaction {
  id: string;
  user_id: string;
  post_id?: string;
  comment_id?: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface CommunityNotification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  post_id?: string;
  comment_id?: string;
  from_user_id?: string;
  is_read: boolean;
  created_at: string;
  
  // Joined data
  from_user?: {
    full_name: string;
    avatar_url?: string;
  };
}

export const POST_TYPE_CONFIG = {
  discussion: { label: 'Discussion', icon: '💬', color: 'bg-blue-500' },
  question: { label: 'Question', icon: '❓', color: 'bg-purple-500' },
  insight: { label: 'Insight', icon: '💡', color: 'bg-yellow-500' },
  announcement: { label: 'Announcement', icon: '📢', color: 'bg-red-500' },
  paper_share: { label: 'Paper Share', icon: '📄', color: 'bg-green-500' },
} as const;
