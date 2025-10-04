'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createBrowserClient } from '@/lib/supabase/client';
import { PostType, POST_TYPE_CONFIG, Tag } from '@/lib/community-types';
import { toast } from 'sonner';
import { Loader2, X, Search } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [postType, setPostType] = useState<PostType>('discussion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [linkedPaperId, setLinkedPaperId] = useState<string>('');
  const [linkedPaperTitle, setLinkedPaperTitle] = useState<string>('');
  const [linkedPaperDOI, setLinkedPaperDOI] = useState<string>('');
  const [searchPapers, setSearchPapers] = useState<Array<{ id: string; title: string; doi?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagSearchOpen, setTagSearchOpen] = useState(false);

  const supabase = createBrowserClient();

  // Load available tags
  const fetchTags = useCallback(async () => {
    const { data } = await supabase
      .from('community_tags')
      .select('*')
      .order('use_count', { ascending: false })
      .limit(50);

    if (data) setAvailableTags(data);
  }, [supabase]);

  useEffect(() => {
    if (isOpen) fetchTags();
  }, [isOpen, fetchTags]);

  // Search papers for linking
  const handleSearchPapers = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchPapers([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data } = await supabase
        .from('research_papers')
        .select('id, title, doi')
        .or(`title.ilike.%${query}%,doi.ilike.%${query}%`)
        .limit(10);

      setSearchPapers(data || []);
    } catch (error) {
      console.error('Error searching papers:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedTags.length === 0) {
      toast.error('Please select at least one tag');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create post
      const postData: {
        author_id: string;
        post_type: PostType;
        title: string;
        content: string;
        linked_paper_id?: string;
        linked_paper_title?: string;
        linked_paper_doi?: string;
      } = {
        author_id: user.id,
        post_type: postType,
        title: title.trim(),
        content: content.trim(),
      };

      if (linkedPaperId) {
        postData.linked_paper_id = linkedPaperId;
        postData.linked_paper_title = linkedPaperTitle;
        postData.linked_paper_doi = linkedPaperDOI;
      }

      const { data: post, error: postError } = await supabase
        .from('community_posts')
        .insert(postData)
        .select()
        .single();

      if (postError) throw postError;

      // Create tag associations
      const tagAssociations = selectedTags.map(tag => ({
        post_id: post.id,
        tag_id: tag.id,
      }));

      const { error: tagsError } = await supabase
        .from('post_tags')
        .insert(tagAssociations);

      if (tagsError) throw tagsError;

      toast.success('Post created successfully!');
      onPostCreated();
      resetForm();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPostType('discussion');
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setLinkedPaperId('');
    setLinkedPaperTitle('');
    setLinkedPaperDOI('');
    setSearchPapers([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleTag = (tag: Tag) => {
    if (selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    } else {
      toast.error('Maximum 5 tags allowed');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Post Type */}
          <div className="space-y-2">
            <Label htmlFor="post-type">Post Type</Label>
            <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
              <SelectTrigger id="post-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(POST_TYPE_CONFIG).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {postType === 'discussion' && 'Start a general discussion or conversation'}
              {postType === 'question' && 'Ask a specific question to the community'}
              {postType === 'insight' && 'Share your research findings or insights'}
              {postType === 'announcement' && 'Make an important announcement'}
              {postType === 'paper_share' && 'Share and discuss a research paper'}
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/200
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Write your post content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              maxLength={10000}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/10000
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags * (Select up to 5)</Label>
            <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedTags.length > 0 
                    ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
                    : "Select tags..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search tags..." />
                  <CommandEmpty>No tag found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {availableTags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        onSelect={() => toggleTag(tag)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{tag.name}</span>
                          {selectedTags.find(t => t.id === tag.id) && (
                            <Badge variant="secondary">✓</Badge>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="gap-1">
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Link Paper (optional, show for paper_share or any type) */}
          <div className="space-y-2">
            <Label htmlFor="paper-search">Link Research Paper (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="paper-search"
                placeholder="Search by title or DOI..."
                onChange={(e) => handleSearchPapers(e.target.value)}
              />
              {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            {searchPapers.length > 0 && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {searchPapers.map((paper) => (
                  <button
                    key={paper.id}
                    type="button"
                    onClick={() => {
                      setLinkedPaperId(paper.id);
                      setLinkedPaperTitle(paper.title);
                      setLinkedPaperDOI(paper.doi || '');
                      setSearchPapers([]);
                    }}
                    className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0"
                  >
                    <p className="font-medium text-sm">{paper.title}</p>
                    {paper.doi && (
                      <p className="text-xs text-muted-foreground">DOI: {paper.doi}</p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {linkedPaperTitle && (
              <div className="p-3 border rounded-lg bg-muted/50 flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{linkedPaperTitle}</p>
                  {linkedPaperDOI && (
                    <p className="text-xs text-muted-foreground">DOI: {linkedPaperDOI}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLinkedPaperId('');
                    setLinkedPaperTitle('');
                    setLinkedPaperDOI('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
