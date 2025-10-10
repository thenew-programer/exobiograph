"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquarePlus, Trash2, PanelLeftClose, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync with initial conversations when they change
  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

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
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;

    setIsDeleting(true);
    try {
      const success = await deleteConv(conversationToDelete);
      if (!success) {
        toast.error("Failed to delete conversation");
        setIsDeleting(false);
        return;
      }

      setConversations(conversations.filter(c => c.id !== conversationToDelete));
      toast.success("Conversation deleted");
      
      if (conversationId === conversationToDelete) {
        router.push('/chat');
      }

      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error("Failed to delete conversation");
    } finally {
      setIsDeleting(false);
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
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Conversations
            </h2>
            <div className="flex items-center gap-1">
              <Button
                onClick={handleNewConversation}
                disabled={isCreating}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-nasa-blue dark:hover:text-blue-400 transition-colors"
                aria-label="New conversation"
              >
                {isCreating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-nasa-blue dark:border-slate-600 dark:border-t-blue-400" />
                ) : (
                  <MessageSquarePlus className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={onToggleCollapse}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px]">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-nasa-blue/10 to-blue-500/10 dark:from-blue-500/20 dark:to-blue-600/20">
                  <MessageSquarePlus className="h-8 w-8 text-nasa-blue dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  No conversations yet
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-[200px]">
                  Start a new conversation to begin chatting
                </p>
                <Button
                  onClick={handleNewConversation}
                  disabled={isCreating}
                  size="sm"
                  className="bg-nasa-blue hover:bg-nasa-blue/90 text-white"
                >
                  {isCreating ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <MessageSquarePlus className="mr-2 h-4 w-4" />
                      New Conversation
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`
                      group relative flex items-start gap-3 rounded-lg px-3 py-2.5
                      transition-all duration-150 cursor-pointer
                      ${conversationId === conversation.id
                        ? 'bg-nasa-blue/10 dark:bg-blue-500/10 shadow-sm'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/70'
                      }
                    `}
                    onClick={() => {
                      router.push(`/chat?id=${conversation.id}`);
                    }}
                  >
                    <div className="flex-1 min-w-0 overflow-hidden py-0.5">
                      <p className={`truncate text-sm font-medium leading-tight mb-1.5 ${
                        conversationId === conversation.id
                          ? 'text-nasa-blue dark:text-blue-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {conversation.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{formatConversationDate(conversation.updated_at)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.id);
                      }}
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </aside>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
