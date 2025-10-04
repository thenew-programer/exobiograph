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
          border-r bg-white dark:bg-slate-900 
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-0 overflow-hidden' : 'w-80'}
        `}
      >
        <div className="flex h-full w-80 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Chats
            </h2>
            <div className="flex items-center gap-1">
              <Button
                onClick={handleNewConversation}
                disabled={isCreating}
                size="sm"
                variant="ghost"
                className="h-8"
              >
                <MessageSquarePlus className="h-4 w-4" />
              </Button>
              <Button
                onClick={onToggleCollapse}
                size="sm"
                variant="ghost"
                className="h-8"
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
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No conversations yet
                </p>
                <Button
                  onClick={handleNewConversation}
                  disabled={isCreating}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  <MessageSquarePlus className="mr-2 h-4 w-4" />
                  Start chatting
                </Button>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`
                      group relative flex items-start gap-3 rounded-md px-3 py-2.5
                      transition-all cursor-pointer
                      ${conversationId === conversation.id
                        ? 'bg-slate-100 dark:bg-slate-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }
                    `}
                    onClick={() => {
                      router.push(`/chat?id=${conversation.id}`);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {conversation.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatConversationDate(conversation.updated_at)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer - User Info */}
          <div className="border-t px-3 py-3">
            <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-nasa-blue to-blue-600 text-xs font-semibold text-white">
                {userId.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                  {conversations.length} chat{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
