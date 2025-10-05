export type VerificationMethod =
  | 'researchgate'
  | 'google_scholar'
  | 'orcid';

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'under_review';

export interface VerificationRequest {
  id: string;
  user_id: string;
  verification_method: VerificationMethod;
  status: VerificationStatus;
  
  // Evidence fields
  researchgate_url?: string;
  google_scholar_url?: string;
  orcid_id?: string;
  additional_info?: string;
  
  // Admin review
  reviewed_by?: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  rejection_reason?: string;
  
  created_at: string;
  updated_at: string;
}

export interface VerificationSubmission {
  verification_method: VerificationMethod;
  researchgate_url?: string;
  google_scholar_url?: string;
  orcid_id?: string;
  additional_info?: string;
}

export interface VerificationReview {
  request_id: string;
  action: 'approve' | 'reject';
  reviewer_notes?: string;
  rejection_reason?: string;
}
