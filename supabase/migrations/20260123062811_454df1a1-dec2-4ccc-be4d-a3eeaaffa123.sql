-- Create profiles table for user data (with admin role)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create exam_sessions table
CREATE TABLE public.exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id TEXT NOT NULL,
  exam_title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  violations_count INTEGER NOT NULL DEFAULT 0,
  submission_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (submission_status IN ('in_progress', 'submitted', 'terminated')),
  score INTEGER,
  total_questions INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create proctoring_photos table (stores URLs to storage, NOT base64)
CREATE TABLE public.proctoring_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('initial', 'periodic', 'suspicious')),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create face_detection_events table
CREATE TABLE public.face_detection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('no_face', 'face_returned', 'multiple_faces')),
  face_count INTEGER NOT NULL DEFAULT 0,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create security_activity_logs table
CREATE TABLE public.security_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('tab_switch', 'fullscreen_exit', 'right_click', 'copy_attempt', 'paste_attempt', 'screenshot_attempt', 'warning_shown')),
  details TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_exam_sessions_user_id ON public.exam_sessions(user_id);
CREATE INDEX idx_exam_sessions_start_time ON public.exam_sessions(start_time DESC);
CREATE INDEX idx_proctoring_photos_session ON public.proctoring_photos(exam_session_id);
CREATE INDEX idx_face_detection_session ON public.face_detection_events(exam_session_id);
CREATE INDEX idx_security_logs_session ON public.security_activity_logs(exam_session_id);

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper function to check if user owns a session
CREATE OR REPLACE FUNCTION public.owns_session(session_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.exam_sessions
    WHERE id = session_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctoring_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_detection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_activity_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- EXAM_SESSIONS RLS
CREATE POLICY "Users can view their own sessions, admins can view all"
  ON public.exam_sessions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create their own sessions"
  ON public.exam_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.exam_sessions FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- PROCTORING_PHOTOS RLS
CREATE POLICY "Users can view photos from their sessions, admins can view all"
  ON public.proctoring_photos FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.exam_sessions WHERE id = exam_session_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can add photos to their sessions"
  ON public.proctoring_photos FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.exam_sessions WHERE id = exam_session_id AND user_id = auth.uid())
  );

-- FACE_DETECTION_EVENTS RLS
CREATE POLICY "Users can view their face events, admins can view all"
  ON public.face_detection_events FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.exam_sessions WHERE id = exam_session_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can add face events to their sessions"
  ON public.face_detection_events FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.exam_sessions WHERE id = exam_session_id AND user_id = auth.uid())
  );

-- SECURITY_ACTIVITY_LOGS RLS
CREATE POLICY "Users can view their activity logs, admins can view all"
  ON public.security_activity_logs FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.exam_sessions WHERE id = exam_session_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can add activity logs to their sessions"
  ON public.security_activity_logs FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.exam_sessions WHERE id = exam_session_id AND user_id = auth.uid())
  );

-- Create storage bucket for proctor photos
INSERT INTO storage.buckets (id, name, public) VALUES ('proctor-photos', 'proctor-photos', false);

-- Storage policies for proctor photos
CREATE POLICY "Users can upload their own proctor photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'proctor-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own photos, admins can view all"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'proctor-photos' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      public.is_admin()
    )
  );