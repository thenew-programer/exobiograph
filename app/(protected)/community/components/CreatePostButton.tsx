'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreatePostModal } from './CreatePostModal';

interface CreatePostButtonProps {
  onPostCreated: () => void;
}

export function CreatePostButton({ onPostCreated }: CreatePostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePostCreated = () => {
    setIsOpen(false);
    onPostCreated();
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="lg">
        <Plus className="mr-2 h-5 w-5" />
        New Post
      </Button>

      <CreatePostModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </>
  );
}
