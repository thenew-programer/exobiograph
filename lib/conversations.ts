import { createBrowserClient } from './supabase/client';

export type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    entities?: string[];
    sources?: string[];
  };
  entities?: string[]; // Computed from metadata for backwards compatibility
  sources?: string[]; // Computed from metadata for backwards compatibility
  created_at: string;
};

export type Conversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

/**
 * Generate a smart title from the first user message
 */
export function generateConversationTitle(message: string): string {
  // Remove extra whitespace
  const cleaned = message.trim().replace(/\s+/g, ' ');
  
  // Truncate to 50 characters, breaking at word boundary
  if (cleaned.length <= 50) {
    return cleaned;
  }
  
  const truncated = cleaned.substring(0, 50);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 30) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  initialTitle: string = 'New Conversation'
): Promise<Conversation | null> {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: initialTitle,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return data;
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<boolean> {
  const supabase = createBrowserClient();
  
  const { error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', conversationId);

  if (error) {
    console.error('Error updating conversation title:', error);
    return false;
  }

  return true;
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(
  conversationId: string
): Promise<boolean> {
  const supabase = createBrowserClient();
  
  // Messages will be deleted automatically due to CASCADE
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }

  return true;
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(
  userId: string
): Promise<Conversation[]> {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string
): Promise<Message[]> {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  // Transform messages to extract entities and sources from metadata
  return (data || []).map(msg => ({
    ...msg,
    entities: msg.metadata?.entities || [],
    sources: msg.metadata?.sources || [],
  }));
}

/**
 * Save a user message
 */
export async function saveUserMessage(
  conversationId: string,
  content: string
): Promise<Message | null> {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving user message:', error);
    return null;
  }

  return data;
}

/**
 * Save an assistant message
 */
export async function saveAssistantMessage(
  conversationId: string,
  content: string,
  entities?: string[],
  sources?: string[]
): Promise<Message | null> {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content,
      metadata: {
        entities: entities || [],
        sources: sources || [],
      },
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving assistant message:', error);
    return null;
  }

  return data;
}

/**
 * Format a date for display in the conversation list
 */
export function formatConversationDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}
