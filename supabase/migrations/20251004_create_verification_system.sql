-- Create verification methods enum
CREATE TYPE verification_method AS ENUM (
  'edu_email',
  'researchgate',
  'google_scholar',
  'orcid',
  'linkedin',
  'manual_review'
);

-- Create verification status enum
CREATE TYPE verification_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'under_review'
);

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verification_method verification_method NOT NULL,
  status verification_status DEFAULT 'pending' NOT NULL,
  
  -- Evidence fields
  edu_email TEXT,
  researchgate_url TEXT,
  google_scholar_url TEXT,
  orcid_id TEXT,
  linkedin_url TEXT,
  additional_info TEXT,
  supporting_documents TEXT[], -- Array of file URLs
  
  -- Verification details
  verification_code TEXT, -- For email verification
  code_expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  
  -- Admin review
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_verification_requests_method ON verification_requests(verification_method);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_verification_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER verification_requests_updated_at
  BEFORE UPDATE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_requests_updated_at();

-- Row Level Security Policies
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification requests
CREATE POLICY "Users can view own verification requests"
  ON verification_requests
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE id = user_id));

-- Users can create their own verification requests
CREATE POLICY "Users can create own verification requests"
  ON verification_requests
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE id = user_id));

-- Users can update their own pending requests
CREATE POLICY "Users can update own pending requests"
  ON verification_requests
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE id = user_id)
    AND status = 'pending'
  );

-- Admins can view all verification requests
CREATE POLICY "Admins can view all verification requests"
  ON verification_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (email LIKE '%@admin.exobiograph.com' OR is_verified = true)
    )
  );

-- Admins can update verification requests
CREATE POLICY "Admins can update verification requests"
  ON verification_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (email LIKE '%@admin.exobiograph.com' OR is_verified = true)
    )
  );

-- Create function to auto-approve verified requests
CREATE OR REPLACE FUNCTION approve_verification_request(request_id UUID)
RETURNS void AS $$
BEGIN
  -- Update verification request
  UPDATE verification_requests
  SET 
    status = 'approved',
    verified_at = NOW(),
    reviewed_at = NOW()
  WHERE id = request_id;
  
  -- Update user profile
  UPDATE profiles
  SET is_verified = true
  WHERE id = (SELECT user_id FROM verification_requests WHERE id = request_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reject verification request
CREATE OR REPLACE FUNCTION reject_verification_request(
  request_id UUID,
  reason TEXT,
  reviewer_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE verification_requests
  SET 
    status = 'rejected',
    rejection_reason = reason,
    reviewed_by = reviewer_id,
    reviewed_at = NOW()
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_verification_request TO authenticated;
GRANT EXECUTE ON FUNCTION reject_verification_request TO authenticated;

-- Add comment
COMMENT ON TABLE verification_requests IS 'Stores user verification requests for scientist credentials';
