export type VerificationMethod =
  | 'edu_email'
  | 'researchgate'
  | 'google_scholar'
  | 'orcid'
  | 'linkedin'
  | 'manual_review';

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'under_review';

export interface VerificationRequest {
  id: string;
  user_id: string;
  verification_method: VerificationMethod;
  status: VerificationStatus;
  
  // Evidence fields
  edu_email?: string;
  researchgate_url?: string;
  google_scholar_url?: string;
  orcid_id?: string;
  linkedin_url?: string;
  additional_info?: string;
  supporting_documents?: string[];
  
  // Verification details
  verification_code?: string;
  code_expires_at?: string;
  verified_at?: string;
  
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
  edu_email?: string;
  researchgate_url?: string;
  google_scholar_url?: string;
  orcid_id?: string;
  linkedin_url?: string;
  additional_info?: string;
  supporting_documents?: File[];
}

export interface VerificationReview {
  request_id: string;
  action: 'approve' | 'reject';
  reviewer_notes?: string;
  rejection_reason?: string;
}
