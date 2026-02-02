-- Complete Exam System Schema
-- This migration adds all necessary tables for a fully dynamic exam system

-- =====================================================
-- EXAMS TABLE - Stores exam definitions created by admins
-- =====================================================
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  total_marks INTEGER NOT NULL DEFAULT 100,
  passing_marks INTEGER NOT NULL DEFAULT 40,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  instructions TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- QUESTIONS TABLE - Stores questions for each exam
-- =====================================================
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'short_answer', 'descriptive')),
  options JSONB, -- For MCQ: ["Option A", "Option B", "Option C", "Option D"]
  correct_answer INTEGER, -- For MCQ: index of correct option (0-based)
  correct_answer_text TEXT, -- For short answer questions
  marks INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- CANDIDATES TABLE - Stores candidate registration info
-- =====================================================
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  course TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exam_id)
);

-- =====================================================
-- EXAM_ATTEMPTS TABLE - Tracks each exam attempt
-- =====================================================
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  time_remaining_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'terminated')),
  score INTEGER,
  total_marks INTEGER,
  percentage DECIMAL(5,2),
  passed BOOLEAN,
  violations_count INTEGER NOT NULL DEFAULT 0,
  answers JSONB DEFAULT '{}', -- Stores answers: { "question_id": selected_option_index }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exam_id) -- One attempt per user per exam
);

-- =====================================================
-- EXAM_RESULTS TABLE - Final results after submission
-- =====================================================
CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attempt_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_exams_active ON public.exams(is_active);
CREATE INDEX IF NOT EXISTS idx_exams_dates ON public.exams(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON public.questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON public.questions(exam_id, order_index);
CREATE INDEX IF NOT EXISTS idx_candidates_user ON public.candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_exam ON public.candidates(exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON public.exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam ON public.exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON public.exam_attempts(status);
CREATE INDEX IF NOT EXISTS idx_results_user ON public.exam_results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_exam ON public.exam_results(exam_id);

-- =====================================================
-- UPDATE TIMESTAMP TRIGGERS
-- =====================================================
CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attempts_updated_at
  BEFORE UPDATE ON public.exam_attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- EXAMS RLS
CREATE POLICY "Anyone can view active exams"
  ON public.exams FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can create exams"
  ON public.exams FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update exams"
  ON public.exams FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete exams"
  ON public.exams FOR DELETE
  USING (public.is_admin());

-- QUESTIONS RLS
CREATE POLICY "Users can view questions for active exams"
  ON public.questions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.exams WHERE id = exam_id AND is_active = true)
    OR public.is_admin()
  );

CREATE POLICY "Admins can manage questions"
  ON public.questions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update questions"
  ON public.questions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE
  USING (public.is_admin());

-- CANDIDATES RLS
CREATE POLICY "Users can view their own registrations"
  ON public.candidates FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can register for exams"
  ON public.candidates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their registration"
  ON public.candidates FOR UPDATE
  USING (auth.uid() = user_id);

-- EXAM_ATTEMPTS RLS
CREATE POLICY "Users can view their own attempts, admins can view all"
  ON public.exam_attempts FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create their own attempts"
  ON public.exam_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts"
  ON public.exam_attempts FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- EXAM_RESULTS RLS
CREATE POLICY "Users can view their own results, admins can view all"
  ON public.exam_results FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "System can create results"
  ON public.exam_results FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- =====================================================
-- SEED DATA - Sample exams and questions
-- =====================================================
INSERT INTO public.exams (id, title, description, subject, duration_minutes, total_marks, passing_marks, instructions, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Mathematics Final Exam', 'Comprehensive mathematics examination covering algebra, calculus, and geometry.', 'Mathematics', 120, 100, 40, 'Read each question carefully. Show all your work. No calculators allowed.', true),
  ('22222222-2222-2222-2222-222222222222', 'Physics Mid-Term', 'Mid-term examination covering mechanics and thermodynamics.', 'Physics', 90, 80, 32, 'Answer all questions. Use proper units in your answers.', true),
  ('33333333-3333-3333-3333-333333333333', 'Computer Science Basics', 'Fundamental concepts of programming and data structures.', 'Computer Science', 60, 50, 20, 'Choose the best answer for each question.', true),
  ('44444444-4444-4444-4444-444444444444', 'Workday Certification Exam', 'Workday HCM and reporting fundamentals certification exam.', 'Workday', 30, 20, 12, 'This exam tests your knowledge of Workday concepts and reporting.', true)
ON CONFLICT DO NOTHING;

-- Sample questions for Workday exam
INSERT INTO public.questions (exam_id, question_text, question_type, options, correct_answer, marks, order_index)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 'What is a Report Data Source (RDS) in Workday reporting?', 'mcq', '["The visual layout of a report", "The tables and fields that supply the rows displayed in a report", "The security groups that can view a report", "The default sort order for a report"]', 1, 5, 1),
  ('44444444-4444-4444-4444-444444444444', 'How does a Primary Business Object (PBO) differ from a Related Business Object (RBO)?', 'mcq', '["A PBO is always numeric, while an RBO is text", "A PBO drives each row of the report; an RBO provides additional linked data", "A PBO can only be a Worker object, whereas an RBO can be any object", "A PBO is optional, but an RBO is required for every report"]', 1, 5, 2),
  ('44444444-4444-4444-4444-444444444444', 'Which component defines the column definitions that can be selected for a report?', 'mcq', '["Prompt Configuration", "Class Report Field (CRF)", "Security Domain", "Data Source Filter"]', 1, 5, 3),
  ('44444444-4444-4444-4444-444444444444', 'What does the term "Instance" refer to in the context of a Workday report?', 'mcq', '["A saved version of the report definition", "Each row returned by the report, representing one PBO record", "The user who runs the report", "The database server processing the request"]', 1, 5, 4)
ON CONFLICT DO NOTHING;

-- Sample questions for Mathematics exam
INSERT INTO public.questions (exam_id, question_text, question_type, options, correct_answer, marks, order_index)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'What is the derivative of x²?', 'mcq', '["x", "2x", "x²", "2"]', 1, 5, 1),
  ('11111111-1111-1111-1111-111111111111', 'What is the value of π (pi) to 2 decimal places?', 'mcq', '["3.12", "3.14", "3.16", "3.18"]', 1, 5, 2),
  ('11111111-1111-1111-1111-111111111111', 'Solve: 2x + 5 = 15', 'mcq', '["x = 5", "x = 10", "x = 7.5", "x = 4"]', 0, 5, 3),
  ('11111111-1111-1111-1111-111111111111', 'What is the area of a circle with radius 7?', 'mcq', '["44π", "49π", "14π", "21π"]', 1, 5, 4),
  ('11111111-1111-1111-1111-111111111111', 'What is the integral of 2x?', 'mcq', '["x²", "x² + C", "2x²", "x"]', 1, 5, 5)
ON CONFLICT DO NOTHING;

-- Sample questions for Physics exam
INSERT INTO public.questions (exam_id, question_text, question_type, options, correct_answer, marks, order_index)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'What is the SI unit of force?', 'mcq', '["Joule", "Newton", "Watt", "Pascal"]', 1, 4, 1),
  ('22222222-2222-2222-2222-222222222222', 'What is the acceleration due to gravity on Earth?', 'mcq', '["9.8 m/s²", "10.8 m/s²", "8.9 m/s²", "11 m/s²"]', 0, 4, 2),
  ('22222222-2222-2222-2222-222222222222', 'Which law states that every action has an equal and opposite reaction?', 'mcq', '["First Law", "Second Law", "Third Law", "Law of Gravitation"]', 2, 4, 3),
  ('22222222-2222-2222-2222-222222222222', 'What is the formula for kinetic energy?', 'mcq', '["mgh", "½mv²", "mv", "ma"]', 1, 4, 4)
ON CONFLICT DO NOTHING;

-- Sample questions for Computer Science exam
INSERT INTO public.questions (exam_id, question_text, question_type, options, correct_answer, marks, order_index)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'What does HTML stand for?', 'mcq', '["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"]', 0, 5, 1),
  ('33333333-3333-3333-3333-333333333333', 'Which data structure uses LIFO?', 'mcq', '["Queue", "Stack", "Array", "Linked List"]', 1, 5, 2),
  ('33333333-3333-3333-3333-333333333333', 'What is the time complexity of binary search?', 'mcq', '["O(n)", "O(log n)", "O(n²)", "O(1)"]', 1, 5, 3),
  ('33333333-3333-3333-3333-333333333333', 'Which programming paradigm does JavaScript primarily support?', 'mcq', '["Only Object-Oriented", "Only Functional", "Multi-paradigm", "Only Procedural"]', 2, 5, 4)
ON CONFLICT DO NOTHING;
