"use client";

import { useState } from "react";
import { ConversationSidebar } from "./ConversationSidebar";
import { ChatInterface } from "./ChatInterface";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import type { Conversation } from "@/lib/conversations";

type ChatPageClientProps = {
  conversations: Conversation[];
  userId: string;
  userProfile: {
    avatar_url?: string;
    full_name?: string;
  } | null;
};

export function ChatPageClient({ conversations, userId, userProfile }: ChatPageClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <ConversationSidebar 
        conversations={conversations}
        userId={userId}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900 relative">
        {/* Expand button when collapsed */}
        {isCollapsed && (
          <Button
            onClick={() => setIsCollapsed(false)}
            size="sm"
            variant="ghost"
            className="absolute left-4 top-4 z-10 h-9 w-9 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
        
        <ChatInterface 
          userId={userId} 
          userProfile={userProfile}
        />
      </div>
    </div>
  );
}
