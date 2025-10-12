-- Create player_accounts table (links auth users to player profiles)
CREATE TABLE public.player_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(player_id)
);

-- Create player_claims table (pending ownership claims)
CREATE TABLE public.player_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  claim_message TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create player_profile_updates table (pending changes to protected fields)
CREATE TABLE public.player_profile_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_account_id UUID NOT NULL REFERENCES public.player_accounts(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL CHECK (field_name IN ('name', 'gender', 'player_code')),
  old_value TEXT NOT NULL,
  new_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create email_preferences table (GDPR consent tracking)
CREATE TABLE public.email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  account_notifications BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_profile_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for player_accounts
CREATE POLICY "Users can view their own player account"
  ON public.player_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all player accounts"
  ON public.player_accounts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert player accounts"
  ON public.player_accounts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update player accounts"
  ON public.player_accounts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete player accounts"
  ON public.player_accounts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for player_claims
CREATE POLICY "Users can view their own claims"
  ON public.player_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all claims"
  ON public.player_claims FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can create claims"
  ON public.player_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update claims"
  ON public.player_claims FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for player_profile_updates
CREATE POLICY "Users can view their own profile updates"
  ON public.player_profile_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.player_accounts
      WHERE player_accounts.id = player_profile_updates.player_account_id
      AND player_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all profile updates"
  ON public.player_profile_updates FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Players can create profile update requests"
  ON public.player_profile_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.player_accounts
      WHERE player_accounts.id = player_profile_updates.player_account_id
      AND player_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update profile update requests"
  ON public.player_profile_updates FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for email_preferences
CREATE POLICY "Users can view their own email preferences"
  ON public.email_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email preferences"
  ON public.email_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences"
  ON public.email_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Update trigger for email_preferences
CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_player_accounts_user_id ON public.player_accounts(user_id);
CREATE INDEX idx_player_accounts_player_id ON public.player_accounts(player_id);
CREATE INDEX idx_player_claims_user_id ON public.player_claims(user_id);
CREATE INDEX idx_player_claims_player_id ON public.player_claims(player_id);
CREATE INDEX idx_player_claims_status ON public.player_claims(status);
CREATE INDEX idx_player_profile_updates_status ON public.player_profile_updates(status);
CREATE INDEX idx_player_profile_updates_player_account_id ON public.player_profile_updates(player_account_id);

-- Update storage policies for player-avatars bucket to allow player uploads
CREATE POLICY "Players can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'player-avatars' AND
    (
      -- Admin can upload any
      has_role(auth.uid(), 'admin'::app_role) OR
      -- Player can upload to their own player_id folder
      (storage.foldername(name))[1]::uuid IN (
        SELECT player_id::text::uuid FROM public.player_accounts WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Players can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'player-avatars' AND
    (
      has_role(auth.uid(), 'admin'::app_role) OR
      (storage.foldername(name))[1]::uuid IN (
        SELECT player_id::text::uuid FROM public.player_accounts WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Players can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'player-avatars' AND
    (
      has_role(auth.uid(), 'admin'::app_role) OR
      (storage.foldername(name))[1]::uuid IN (
        SELECT player_id::text::uuid FROM public.player_accounts WHERE user_id = auth.uid()
      )
    )
  );