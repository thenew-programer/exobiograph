'use client';

import { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import VerificationModal from './VerificationModal';

interface VerificationPromptProps {
  onDismiss?: () => void;
}

export default function VerificationPrompt({ onDismiss }: VerificationPromptProps) {
  const [showModal, setShowModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <>
      <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Get Verified as a Scientist
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Verify your scientific credentials to receive a verified badge on your profile and gain more credibility in the community. 
                This helps other researchers trust your contributions and insights.
              </p>
              
              <div className="flex items-center gap-3">
                <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  Get Verified
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-gray-600 dark:text-gray-400">
                  Maybe Later
                </Button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardContent>
      </Card>

      <VerificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          setIsDismissed(true);
        }}
      />
    </>
  );
}
