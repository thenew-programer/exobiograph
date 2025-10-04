"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquarePlus, Trash2, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  type Conversation,
  createConversation,
  deleteConversation as deleteConv,
  formatConversationDate,
} from "@/lib/conversations";

type ConversationSidebarProps = {
  conversations: Conversation[];
  userId: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

export function ConversationSidebar({ 
  conversations: initialConversations, 
  userId,
  isCollapsed,
  onToggleCollapse
}: ConversationSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('id');
  
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [isCreating, setIsCreating] = useState(false);

  const handleNewConversation = async () => {
    setIsCreating(true);
    try {
      const newConv = await createConversation(userId);
      if (!newConv) {
        toast.error("Failed to create conversation");
        return;
      }

      setConversations([newConv, ...conversations]);
      toast.success("New conversation created");
      router.push(`/chat?id=${newConv.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error("Failed to create conversation");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const success = await deleteConv(id);
      if (!success) {
        toast.error("Failed to delete conversation");
        return;
      }

      setConversations(conversations.filter(c => c.id !== id));
      toast.success("Conversation deleted");
      
      if (conversationId === id) {
        router.push('/chat');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error("Failed to delete conversation");
    }
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-0 overflow-hidden' : 'w-80'}
        `}
      >
        <div className="flex h-full w-80 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Conversations
            </h2>
            <div className="flex items-center gap-1">
              <Button
                onClick={handleNewConversation}
                disabled={isCreating}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                aria-label="New conversation"
              >
                <MessageSquarePlus className="h-4 w-4" />
              </Button>
              <Button
                onClick={onToggleCollapse}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                  <MessageSquarePlus className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 font-medium">
                  No conversations yet
                </p>
                <Button
                  onClick={handleNewConversation}
                  disabled={isCreating}
                  variant="outline"
                  size="sm"
                  className="hover:bg-nasa-blue/10 hover:text-nasa-blue hover:border-nasa-blue dark:hover:bg-blue-500/10 dark:hover:text-blue-400 dark:hover:border-blue-500 transition-all"
                >
                  <MessageSquarePlus className="mr-2 h-4 w-4" />
                  Start chatting
                </Button>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`
                      group relative flex items-start gap-3 rounded-xl px-3 py-3
                      transition-all cursor-pointer
                      ${conversationId === conversation.id
                        ? 'bg-nasa-blue/10 dark:bg-blue-500/10 border border-nasa-blue/20 dark:border-blue-500/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                      }
                    `}
                    onClick={() => {
                      router.push(`/chat?id=${conversation.id}`);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`truncate text-sm font-medium ${
                        conversationId === conversation.id
                          ? 'text-nasa-blue dark:text-blue-400'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {conversation.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {formatConversationDate(conversation.updated_at)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer - User Info */}
          <div className="border-t border-slate-200 dark:border-slate-800 px-3 py-3">
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-nasa-blue to-blue-600 text-xs font-bold text-white shadow-sm">
                {userId.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Active session
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
