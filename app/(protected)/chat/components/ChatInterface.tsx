"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Send, Sparkles, Bot, AlertCircle, MessageSquarePlus, ArrowDown, Copy, Check, Paperclip, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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

type ChatInterfaceProps = {
  userId: string;
  onTitleUpdate?: () => void;
};

export function ChatInterface({ userId, onTitleUpdate }: ChatInterfaceProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get("id");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle scroll to show/hide scroll button
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
      if (!scrollContainer) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && scrollTop > 200);
    };

    const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
    scrollContainer?.addEventListener('scroll', handleScroll);

    return () => {
      scrollContainer?.removeEventListener('scroll', handleScroll);
    };
  }, [conversationId]);

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
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Parse files if any
      let fileContent = "";
      if (hasFiles) {
        setIsParsingFiles(true);
        toast.info(`Parsing ${uploadedFiles.length} file(s)...`);
        fileContent = await parseFiles(uploadedFiles);
        setIsParsingFiles(false);
      }

      // Combine message and file content for AI
      const fullMessage = fileContent 
        ? `${userMessage}\n\n${fileContent}`
        : userMessage;

      // Create display message with file indicator
      const displayMessage = hasFiles
        ? `${userMessage}\n\n📎 Attached ${uploadedFiles.length} file(s)`
        : userMessage;
      
      // Clear files after parsing
      setUploadedFiles([]);
      
      // Save user message (display version)
      const savedUserMessage = await saveUserMessage(conversationId, displayMessage);
      if (!savedUserMessage) {
        toast.error("Failed to save message");
        setInput(userMessage); // Restore input
        setIsLoading(false);
        return;
      }

      // Optimistically add user message to UI
      setMessages((prev) => [...prev, savedUserMessage]);

      // Call API for AI response (send full message with file content)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: fullMessage,
          conversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to get response";
        toast.error(errorMessage);
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      // Save assistant message with entities and sources
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

      // Add assistant message to UI
      setMessages((prev) => [...prev, savedAssistantMessage]);

      // Update conversation title if this is the first message
      if (messages.length === 0) {
        const title = generateConversationTitle(userMessage);
        await updateConversationTitle(conversationId, title);
        onTitleUpdate?.();
      }

      // Focus back on textarea
      textareaRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage);
      setError(errorMessage);
      setInput(userMessage); // Restore input
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

  const copyMessageContent = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success("Message copied to clipboard");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      toast.error("Failed to copy message");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    
    // Validate files
    for (const file of files) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }
      
      // Check file type
      const validTypes = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/markdown',
        'text/csv'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|md|csv|pdf|doc|docx)$/i)) {
        toast.error(`${file.name} is not a supported file type`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast.success(`Added ${validFiles.length} file(s)`);
    }
    
    // Reset input
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
          // For PDF, we'll send to a parsing API
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
          // For text files, read directly
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
    try {
      const newConv = await createConversation(userId);
      if (!newConv) {
        toast.error("Failed to create conversation");
        return;
      }
      toast.success("New conversation created");
      router.push(`/chat?id=${newConv.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error("Failed to create conversation");
    }
  };

  const handleTemplateQuestion = async (question: string) => {
    try {
      // Create a new conversation
      const newConv = await createConversation(userId);
      if (!newConv) {
        toast.error("Failed to create conversation");
        return;
      }
      
      // Navigate to the new conversation
      router.push(`/chat?id=${newConv.id}`);
      
      // Set the input after navigation
      // Using setTimeout to ensure the component re-renders with the new conversationId
      setTimeout(() => {
        setInput(question);
        textareaRef.current?.focus();
      }, 100);
      
      toast.success("New conversation started");
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error("Failed to create conversation");
    }
  };

  const templateQuestions = [
    "What organisms have been studied in microgravity?",
    "Tell me about radiation effects on DNA",
    "Show me papers about Arabidopsis research",
    "What are common experimental endpoints?"
  ];

  if (!conversationId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-8">
        <div className="max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-nasa-blue to-blue-600 shadow-lg shadow-nasa-blue/25">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
            Welcome to ExoBioGraph
          </h3>
          <p className="mb-8 text-base leading-relaxed text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Your AI assistant for exploring NASA&apos;s space biology research.
            Ask questions about organisms, experimental conditions, biological
            effects, and scientific endpoints from real research data.
          </p>
          <Button
            onClick={handleNewChat}
            size="lg"
            className="mb-10 bg-nasa-blue hover:bg-nasa-blue/90 shadow-lg shadow-nasa-blue/25 hover:shadow-xl hover:shadow-nasa-blue/30 transition-all"
          >
            <MessageSquarePlus className="mr-2 h-5 w-5" />
            Start New Chat
          </Button>
          <div className="grid gap-3 sm:grid-cols-2">
            {templateQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleTemplateQuestion(question)}
                className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-nasa-blue hover:shadow-lg hover:shadow-slate-900/5 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-blue-500"
              >
                <p className="text-sm font-medium text-slate-900 group-hover:text-nasa-blue dark:text-white dark:group-hover:text-blue-400 transition-colors leading-relaxed">
                  {question}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900">
      {/* Messages Area - Scrollable */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-950/30">
        <div className="mx-auto max-w-3xl space-y-6 p-6 pb-8">
          {messages.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                <Bot className="h-7 w-7 text-slate-600 dark:text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                How can I help you explore space biology research today?
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`group flex gap-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nasa-blue to-blue-600 shadow-sm">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}
                <div className={`flex flex-col gap-2 max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`${
                      message.role === "user"
                        ? "rounded-2xl rounded-tr-md bg-gradient-to-br from-nasa-blue to-blue-600 px-5 py-3.5 text-white shadow-lg shadow-nasa-blue/20"
                        : "space-y-3 rounded-2xl rounded-tl-md bg-white px-5 py-4 shadow-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50"
                    }`}
                  >
                    <p className={`whitespace-pre-wrap leading-7 ${
                      message.role === "user" ? "text-[15px]" : "text-[15px] text-slate-900 dark:text-slate-100"
                    }`}>
                      {message.content}
                    </p>

                    {/* Entities */}
                    {message.entities && message.entities.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {message.entities.map((entity, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="rounded-lg border-slate-300 bg-slate-50 text-xs font-normal text-slate-700 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300"
                          >
                            {entity}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 dark:border-slate-600 dark:bg-slate-700/30">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span className="inline-block h-1 w-1 rounded-full bg-nasa-blue"></span>
                          Sources
                        </p>
                        <div className="space-y-1.5">
                          {message.sources.map((source, idx) => (
                            <p
                              key={idx}
                              className="text-xs leading-relaxed text-slate-600 dark:text-slate-400"
                            >
                              {idx + 1}. {source}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={() => copyMessageContent(message.content, message.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-all opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Copy message"
                  >
                    {copiedMessageId === message.id ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nasa-blue to-blue-600 shadow-sm">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-md bg-white px-5 py-4 shadow-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="h-2 w-2 animate-bounce rounded-full bg-nasa-blue dark:bg-blue-400" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-nasa-blue dark:bg-blue-400 [animation-delay:0.2s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-nasa-blue dark:bg-blue-400 [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-36 right-8 z-10 rounded-xl bg-gradient-to-br from-nasa-blue to-blue-600 p-3 shadow-lg shadow-nasa-blue/25 transition-all hover:shadow-xl hover:shadow-nasa-blue/30 hover:scale-105 active:scale-95"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-5 w-5 text-white" />
        </button>
      )}

      {/* Input Area - Fixed at bottom, no scroll */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-lg">
        <div className="mx-auto max-w-3xl">
          {/* Error Banner */}
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3.5 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300 border border-red-100 dark:border-red-900/30">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Error</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* File Upload Indicator */}
          {uploadedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <FileText className="h-4 w-4 text-nasa-blue dark:text-blue-400" />
                  <span className="text-slate-900 dark:text-slate-100 font-medium">
                    {file.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-1 rounded-md p-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex items-end gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.doc,.docx,.md,.csv,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="File upload"
            />
            
            {/* File upload button */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isParsingFiles}
              size="icon"
              variant="ghost"
              className="h-11 w-11 shrink-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Attach file"
            >
              <Paperclip className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </Button>
            
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Message ExoBioGraph..."
                className="max-h-[200px] min-h-[56px] w-full resize-none rounded-2xl border-0 bg-slate-50 px-5 py-4 pr-12 text-[15px] shadow-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-nasa-blue focus:bg-white dark:bg-slate-800 dark:ring-slate-700 dark:placeholder:text-slate-500 dark:focus:ring-blue-500 dark:focus:bg-slate-800/80 transition-all"
                disabled={isLoading}
                aria-label="Message input"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading || isParsingFiles}
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-nasa-blue to-blue-600 shadow-md shadow-nasa-blue/25 hover:shadow-lg hover:shadow-nasa-blue/30 hover:scale-105 disabled:bg-slate-200 disabled:shadow-none disabled:scale-100 dark:disabled:bg-slate-700 transition-all duration-200"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            ExoBioGraph can make mistakes. Check important info. Supports PDF, TXT, DOC, DOCX, MD, CSV files.
          </p>
        </div>
      </div>
    </div>
  );
}
