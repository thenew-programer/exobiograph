'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge as BadgeIcon, CheckCircle2, Globe, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { VerificationMethod } from '@/types/verification';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function VerificationModal({ isOpen, onClose, onSuccess }: VerificationModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod>('orcid');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [researchgateUrl, setResearchgateUrl] = useState('');
  const [googleScholarUrl, setGoogleScholarUrl] = useState('');
  const [orcidId, setOrcidId] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const verificationMethods = [
    {
      id: 'orcid' as const,
      label: 'ORCID',
      description: 'Verify with your ORCID identifier',
      icon: BadgeIcon,
      instant: false,
    },
    {
      id: 'google_scholar' as const,
      label: 'Google Scholar',
      description: 'Link your Google Scholar profile',
      icon: GraduationCap,
      instant: false,
    },
    {
      id: 'researchgate' as const,
      label: 'ResearchGate',
      description: 'Link your ResearchGate profile',
      icon: Globe,
      instant: false,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requestData: Record<string, unknown> = {
        verification_method: selectedMethod,
        additional_info: additionalInfo,
      };

      // Add method-specific data
      switch (selectedMethod) {
        case 'researchgate':
          if (!researchgateUrl) {
            toast.error('Please enter your ResearchGate profile URL');
            setIsSubmitting(false);
            return;
          }
          requestData.researchgate_url = researchgateUrl;
          break;
        case 'google_scholar':
          if (!googleScholarUrl) {
            toast.error('Please enter your Google Scholar profile URL');
            setIsSubmitting(false);
            return;
          }
          requestData.google_scholar_url = googleScholarUrl;
          break;
        case 'orcid':
          if (!orcidId) {
            toast.error('Please enter your ORCID ID');
            setIsSubmitting(false);
            return;
          }
          requestData.orcid_id = orcidId;
          break;
      }

      const response = await fetch('/api/verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Verification request failed:', result);
        const errorMessage = result.error || 'Failed to submit verification request';
        const hint = result.hint ? `\n${result.hint}` : '';
        throw new Error(errorMessage + hint);
      }

      toast.success('Verification request submitted for review!');
      onSuccess?.();
      onClose();

    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            Get Verified
          </DialogTitle>
          <DialogDescription>
            Verify your scientific credentials to receive a verified badge on your profile and posts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Method Selection */}
          <div className="space-y-3">
            <Label>Verification Method</Label>
            <div className="space-y-2">
              {verificationMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-start space-x-3 rounded-md border p-4 text-left transition-colors ${
                    selectedMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center ${
                    selectedMethod === method.id ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {selectedMethod === method.id && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <method.icon className="w-4 h-4" />
                      <span className="font-medium">{method.label}</span>
                      {method.instant && (
                        <Badge variant="secondary" className="text-xs">
                          Instant
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Method-specific fields */}
          {selectedMethod === 'researchgate' && (
            <div className="space-y-2">
              <Label htmlFor="researchgate">ResearchGate Profile URL</Label>
              <Input
                id="researchgate"
                type="url"
                value={researchgateUrl}
                onChange={(e) => setResearchgateUrl(e.target.value)}
                placeholder="https://www.researchgate.net/profile/..."
                required
              />
            </div>
          )}

          {selectedMethod === 'google_scholar' && (
            <div className="space-y-2">
              <Label htmlFor="google_scholar">Google Scholar Profile URL</Label>
              <Input
                id="google_scholar"
                type="url"
                value={googleScholarUrl}
                onChange={(e) => setGoogleScholarUrl(e.target.value)}
                placeholder="https://scholar.google.com/citations?user=..."
                required
              />
            </div>
          )}

          {selectedMethod === 'orcid' && (
            <div className="space-y-2">
              <Label htmlFor="orcid">ORCID ID</Label>
              <Input
                id="orcid"
                value={orcidId}
                onChange={(e) => setOrcidId(e.target.value)}
                placeholder="0000-0002-1825-0097"
                pattern="\d{4}-\d{4}-\d{4}-\d{3}[0-9X]"
                required
              />
              <p className="text-sm text-muted-foreground">
                Format: XXXX-XXXX-XXXX-XXXX
              </p>
            </div>
          )}

          {/* Additional Info */}
          <div className="space-y-2">
            <Label htmlFor="additional_info">Additional Information (Optional)</Label>
            <Textarea
              id="additional_info"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Add any additional information that might help verify your credentials..."
              rows={3}
            />
          </div>

          {/* Manual review notice */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Your request will be reviewed by our team. This typically takes 1-3 business days.
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
