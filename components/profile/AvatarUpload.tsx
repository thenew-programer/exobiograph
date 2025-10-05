'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Image from 'next/image';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string;
  currentName: string;
  onUploadSuccess: (url: string) => void;
}

export function AvatarUpload({ 
  userId, 
  currentAvatarUrl, 
  currentName,
  onUploadSuccess 
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        try {
          const oldPath = currentAvatarUrl.split('/avatars/')[1];
          if (oldPath) {
            await supabase.storage
              .from('avatars')
              .remove([`avatars/${oldPath}`]);
          }
        } catch (error) {
          console.error('Error deleting old avatar:', error);
          // Don't fail the upload if old avatar deletion fails
        }
      }

      setPreviewUrl(publicUrl);
      onUploadSuccess(publicUrl);
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentAvatarUrl) return;

    setIsUploading(true);

    try {
      // Remove from storage
      const oldPath = currentAvatarUrl.split('/avatars/')[1];
      if (oldPath) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([`avatars/${oldPath}`]);

        if (deleteError) throw deleteError;
      }

      // Update profile to remove avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (updateError) throw updateError;

      setPreviewUrl(null);
      onUploadSuccess('');
      toast.success('Profile picture removed');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative group">
      {/* Avatar Preview */}
      {previewUrl ? (
        <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg">
          <Image
            src={previewUrl}
            alt={currentName}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-nasa-blue to-blue-600 text-3xl font-bold text-white border-4 border-white dark:border-slate-800 shadow-lg">
          {currentName.charAt(0).toUpperCase() || 'U'}
        </div>
      )}

      {/* Action Buttons - Show on hover */}
      <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 w-8 rounded-full p-0 shadow-lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title={previewUrl ? "Change avatar" : "Upload avatar"}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>

        {previewUrl && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-8 w-8 rounded-full p-0 shadow-lg"
            onClick={handleRemoveAvatar}
            disabled={isUploading}
            title="Remove avatar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
