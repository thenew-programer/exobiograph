"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Send, Sparkles, ArrowDown, Paperclip, X, Bot, Plus, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  type Message,
  getConversationMessages,
  saveUserMessage,
  saveAssistantMessage,
  updateConversationTitle,
  generateConversationTitle,
  createConversation,
} from "@/lib/conversations";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ChatInterfaceProps = {
  userId: string;
  onTitleUpdate?: () => void;
  userProfile: {
    avatar_url?: string;
    full_name?: string;
  } | null;
};

export function ChatInterface({ userId, onTitleUpdate, userProfile }: ChatInterfaceProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get("id");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [welcomeInput, setWelcomeInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"question" | "summarize">("question");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user initials
  const getUserInitials = () => {
    if (!userProfile?.full_name) return "U";
    const names = userProfile.full_name.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Load messages
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  // Handle pending message from welcome screen
  useEffect(() => {
    const sendPendingMessage = async () => {
      const pendingMessage = sessionStorage.getItem('pendingMessage');
      if (pendingMessage && conversationId && messages.length > 0) {
        // Check if the last message is from the user (the one we just created)
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'user') {
          sessionStorage.removeItem('pendingMessage');
          
          // Send to AI
          try {
            setIsLoading(true);
            
            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: pendingMessage, conversationId }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              toast.error(errorData.error || "Failed to get response");
              setIsLoading(false);
              return;
            }

            const data = await response.json();
            const savedAssistantMessage = await saveAssistantMessage(
              conversationId,
              data.content,
              data.entities || [],
              data.sources || []
            );

            if (!savedAssistantMessage) {
              toast.error("Failed to save AI response");
              setIsLoading(false);
              return;
            }

            setMessages((prev) => [...prev, savedAssistantMessage]);

            // Update conversation title since this is the first message
            const title = generateConversationTitle(pendingMessage);
            await updateConversationTitle(conversationId, title);
            onTitleUpdate?.();
          } catch (error) {
            console.error("Error sending message:", error);
            toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
          } finally {
            setIsLoading(false);
          }
        }
      }
    };

    sendPendingMessage();
  }, [conversationId, messages, onTitleUpdate]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && scrollTop > 200);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const loadMessages = async (convId: string) => {
    try {
      const data = await getConversationMessages(convId);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading || !conversationId) return;

    const userMessage = input.trim();
    const hasFiles = uploadedFiles.length > 0;
    const isFirstMessage = messages.length === 0; // Check BEFORE adding messages
    setInput("");
    setIsLoading(true);

    try {
      let fileContent = "";
      if (hasFiles) {
        setIsParsingFiles(true);
        toast.info(`Parsing ${uploadedFiles.length} file(s)...`);
        fileContent = await parseFiles(uploadedFiles);
        setIsParsingFiles(false);
      }

      const fullMessage = fileContent ? `${userMessage}\n\n${fileContent}` : userMessage;
      const displayMessage = hasFiles ? `${userMessage}\n\n📎 Attached ${uploadedFiles.length} file(s)` : userMessage;
      
      setUploadedFiles([]);
      
      const savedUserMessage = await saveUserMessage(conversationId, displayMessage);
      if (!savedUserMessage) {
        toast.error("Failed to save message");
        setInput(userMessage);
        setIsLoading(false);
        return;
      }

      setMessages((prev) => [...prev, savedUserMessage]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: fullMessage, 
          conversationId,
          mode: mode, // "question" or "summarize"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to get response");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const savedAssistantMessage = await saveAssistantMessage(
        conversationId,
        data.content,
        data.entities || [],
        data.sources || []
      );

      if (!savedAssistantMessage) {
        toast.error("Failed to save AI response");
        setIsLoading(false);
        return;
      }

      setMessages((prev) => [...prev, savedAssistantMessage]);

      if (isFirstMessage) {
        const title = generateConversationTitle(userMessage);
        await updateConversationTitle(conversationId, title);
        onTitleUpdate?.();
      }

      textareaRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
      setInput(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const retryMessage = async () => {
    if (messages.length < 2) return;
    const lastUserMessage = messages[messages.length - 2];
    setMessages(prev => prev.slice(0, -1));
    setInput(lastUserMessage.content);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }
      
      const validTypes = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/markdown',
        'text/csv'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|md|csv|pdf|doc|docx)$/i)) {
        toast.error(`${file.name} is not supported`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast.success(`Added ${validFiles.length} file(s)`);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const parseFiles = async (files: File[]): Promise<string> => {
    const fileContents: string[] = [];
    
    for (const file of files) {
      try {
        if (file.type === 'application/pdf') {
          toast.info(`Parsing ${file.name}...`);
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('/api/parse-file', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) throw new Error('Failed to parse PDF');
          
          const data = await response.json();
          fileContents.push(`\n\n--- Content from ${file.name} ---\n${data.text}\n--- End of ${file.name} ---\n`);
        } else {
          const text = await file.text();
          fileContents.push(`\n\n--- Content from ${file.name} ---\n${text}\n--- End of ${file.name} ---\n`);
        }
      } catch (error) {
        console.error(`Failed to parse ${file.name}:`, error);
        toast.error(`Failed to parse ${file.name}`);
      }
    }
    
    return fileContents.join('\n');
  };

  const handleNewChat = async () => {
    const message = welcomeInput.trim();
    
    // Don't create conversation if there's no input
    if (!message && uploadedFiles.length === 0) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Create conversation
      const newConv = await createConversation(userId);
      if (!newConv) {
        toast.error("Failed to create conversation");
        setIsLoading(false);
        return;
      }

      // Parse uploaded files if any
      let fileContent = "";
      if (uploadedFiles.length > 0) {
        setIsParsingFiles(true);
        fileContent = await parseFiles(uploadedFiles);
        setIsParsingFiles(false);
      }

      // Prepare the message content
      const messageContent = fileContent 
        ? `${message}\n\n${fileContent}`
        : message;

      // Save the user message
      await saveUserMessage(newConv.id, messageContent);

      // Navigate to the new conversation
      // Set a flag to trigger AI response after navigation
      sessionStorage.setItem('pendingMessage', messageContent);
      router.push(`/chat?id=${newConv.id}`);
      
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error("Failed to create conversation");
      setIsLoading(false);
    }
  };

  // Welcome screen
  if (!conversationId) {
    return (
      <div className="flex flex-1 flex-col p-8 pt-60 bg-white dark:bg-slate-900">
        <div className="max-w-3xl w-full mx-auto text-center">
          <div className="mb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Bot className="h-8 w-8 text-nasa-blue dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Welcome to ExoBioGraph
              </h1>
            </div>
          </div>

          {/* Input area in center */}
          <div className="max-w-2xl mx-auto mt-6">
            {/* File badges above textarea */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uploadedFiles.map((file, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <Paperclip className="h-3 w-3 mr-1" />
                    {file.name}
                  </Badge>
                ))}
              </div>
            )}

            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={welcomeInput}
                onChange={(e) => setWelcomeInput(e.target.value)}
                placeholder={mode === "summarize" ? "Paste text to summarize..." : "Ask me anything about space biology research..."}
                className="min-h-[120px] w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4 pb-16 text-base focus:outline-none focus:ring-2 focus:ring-nasa-blue dark:focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (welcomeInput.trim() || uploadedFiles.length > 0) {
                      handleNewChat();
                    }
                  }
                }}
              />
              
              {/* Buttons inside textarea at bottom */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-10 w-10 p-0 text-slate-600 dark:text-slate-400"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>

                  <Select value={mode} onValueChange={(value: "question" | "summarize") => setMode(value)}>
                    <SelectTrigger className="h-10 w-[160px] border-slate-200 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="question">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>Ask Question</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="summarize">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Summarize Text</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleNewChat}
                  size="sm"
                  disabled={!welcomeInput.trim() && uploadedFiles.length === 0}
                  className="h-10 bg-nasa-blue hover:bg-nasa-blue/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              ExoBioGraph can make mistakes. Check important info.
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.doc,.docx,.md,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  // Chat screen
  return (
    <div className="flex flex-1 flex-col h-full bg-white dark:bg-slate-900">
      {/* Messages - Scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => {
            // Extract file attachment info from message content if present
            const fileMatch = message.content.match(/📎 Attached (\d+) file\(s\)/);
            const hasAttachedFiles = fileMatch && message.role === "user";
            const fileCount = hasAttachedFiles ? parseInt(fileMatch[1]) : 0;
            // Remove the attachment text from content
            const displayContent = hasAttachedFiles 
              ? message.content.replace(/\n\n📎 Attached \d+ file\(s\)/, '').trim()
              : message.content;

            return (
              <div key={message.id} className="space-y-4">
                {/* File badges above message for user messages */}
                {hasAttachedFiles && (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: fileCount }, (_, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        <Paperclip className="h-3 w-3 mr-1" />
                        File {i + 1}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Message */}
                <div className="flex items-start gap-4">
                  <div
                    className={`inline-block max-w-[80%] rounded-lg px-3 py-2 ${
                      message.role === "user"
                        ? "bg-blue-50 dark:bg-blue-950/20 text-slate-900 dark:text-slate-100"
                        : "bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.role === "user" ? (
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name} />
                          <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Sparkles className="h-5 w-5 text-slate-600 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                      )}
                      <p className="whitespace-pre-wrap leading-7 flex-1">{displayContent}</p>
                    </div>

                    {/* Entities */}
                    {message.entities && message.entities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 ml-7">
                        {message.entities.map((entity, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {entity}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 ml-7 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        <p className="font-semibold">Sources:</p>
                        {message.sources.map((source, idx) => (
                          <p key={idx}>{idx + 1}. {source}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Response Actions */}
                {message.role === "assistant" && (
                  <div className="flex items-center justify-end gap-4 text-sm">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <button
                      onClick={retryMessage}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    >
                      Copy
                    </button>
                    <button className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
                      Dislike
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="inline-block rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500 [animation-delay:0.2s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500 [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-28 right-8 rounded-full bg-nasa-blue hover:bg-nasa-blue/90 p-3 shadow-lg text-white"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}

      {/* Input - Fixed at bottom */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* File uploads */}
          {uploadedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs pr-1"
                >
                  <Paperclip className="h-3 w-3 mr-1" />
                  <span>{file.name}</span>
                  <button 
                    onClick={() => removeFile(index)}
                    className="ml-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={mode === "summarize" ? "Paste text to summarize..." : "Message ExoBioGraph..."}
              className="min-h-[56px] max-h-[200px] w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4 pb-16 focus:outline-none focus:ring-2 focus:ring-nasa-blue dark:focus:ring-blue-500 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
              disabled={isLoading}
            />
            
            {/* Buttons inside textarea at bottom */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 p-0 text-slate-600 dark:text-slate-400" 
                  disabled={isLoading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-5 w-5" />
                </Button>

                <Select value={mode} onValueChange={(value: "question" | "summarize") => setMode(value)}>
                  <SelectTrigger className="h-10 w-[160px] border-slate-200 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="question">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>Ask Question</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="summarize">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Summarize Text</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading}
                size="sm"
                className="h-10 bg-nasa-blue hover:bg-nasa-blue/90 text-white disabled:bg-slate-300 dark:disabled:bg-slate-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            ExoBioGraph can make mistakes. Check important info.
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.doc,.docx,.md,.csv"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
