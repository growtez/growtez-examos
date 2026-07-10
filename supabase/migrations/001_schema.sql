-- ============================================================
-- GROWTEZ EXAMOS — CONSOLIDATED SCHEMA SETUP
-- ============================================================

-- ============================================================
-- 1. Create Tables (Final State with all columns from alterations)
-- ============================================================

-- Ensure new columns are added if tables already exist
ALTER TABLE IF EXISTS public.teachers ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE IF EXISTS public.questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE IF EXISTS public.questions ALTER COLUMN question_text DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,

    is_active BOOLEAN DEFAULT true,

    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.super_admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.school_admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    roll_number TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    course TEXT DEFAULT 'General',
    batch TEXT DEFAULT 'Main',
    session TEXT DEFAULT '2026-27',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop the old unique constraint if it exists, and create the consolidated one
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_school_id_roll_number_key;
DROP INDEX IF EXISTS idx_students_roll_school;

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_school_roll_course_batch_session 
  ON public.students (school_id, roll_number, course, batch, session);

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_school_roll_course_batch_session_key;
ALTER TABLE public.students
  ADD CONSTRAINT students_school_roll_course_batch_session_key UNIQUE USING INDEX idx_students_school_roll_course_batch_session;

CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed')),
    marking_scheme JSONB DEFAULT '{"mcq_correct": 4, "mcq_wrong": -1, "nat_correct": 4, "nat_wrong": 0}'::jsonb,
    total_marks INTEGER,
    created_by UUID, -- Foreign key dropped as per requirement (Snippet 3)
    is_trashed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  subject_name TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, subject_name)
);

CREATE TABLE IF NOT EXISTS public.exam_subject_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_subject_id UUID REFERENCES public.exam_subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_subject_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    exam_subject_id UUID REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
    question_text TEXT,
    image_url TEXT,
    question_type TEXT DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'nat')),
    options JSONB,
    correct_option TEXT NOT NULL,
    positive_marks INTEGER DEFAULT 4,
    negative_marks INTEGER DEFAULT -1,
    question_number INTEGER,
    marks INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL, -- Foreign key dropped as per requirement (Snippet 3)
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted')),
  started_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    answers JSONB NOT NULL,
    total_marks INTEGER,
    section_scores JSONB DEFAULT '{}'::jsonb,
    time_taken_seconds INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

-- Ensure specific foreign keys are dropped if they existed previously
ALTER TABLE public.exam_students DROP CONSTRAINT IF EXISTS exam_students_student_id_fkey;
ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_created_by_fkey;

-- Add exam_instructions JSONB column to public.exams
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS exam_instructions JSONB DEFAULT '[]'::jsonb;

-- ============================================================
-- 2. Helper Functions for RLS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS UUID AS $$
DECLARE
  v_school_id UUID;
BEGIN
  -- Check school_admins
  SELECT school_id INTO v_school_id FROM public.school_admins WHERE id = auth.uid();
  IF v_school_id IS NOT NULL THEN
    RETURN v_school_id;
  END IF;

  -- Check teachers
  SELECT school_id INTO v_school_id FROM public.teachers WHERE id = auth.uid();
  IF v_school_id IS NOT NULL THEN
    RETURN v_school_id;
  END IF;

  -- Check students
  SELECT school_id INTO v_school_id FROM public.students WHERE id = auth.uid();
  RETURN v_school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.super_admins WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_school_admin_or_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM public.school_admins WHERE id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.teachers WHERE id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_exam_school_access(p_exam_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_school_id UUID;
  v_user_school_id UUID;
BEGIN
  v_user_school_id := public.get_current_user_school_id();
  SELECT school_id INTO v_school_id FROM public.exams WHERE id = p_exam_id;
  RETURN v_school_id = v_user_school_id AND public.is_school_admin_or_teacher();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 3. Enable Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subject_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_students ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 4. Policies Setup
-- ============================================================

-- Policies for schools
DROP POLICY IF EXISTS "Super admins can do all on schools" ON public.schools;
CREATE POLICY "Super admins can do all on schools" ON public.schools FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "Users can view their own school" ON public.schools;
CREATE POLICY "Users can view their own school" ON public.schools FOR SELECT USING (id = public.get_current_user_school_id());

DROP POLICY IF EXISTS "Allow public select on schools" ON public.schools;
CREATE POLICY "Allow public select on schools" ON public.schools FOR SELECT USING (is_active = true);

-- Policies for super_admins
DROP POLICY IF EXISTS "Super admins can manage super_admins" ON public.super_admins;
CREATE POLICY "Super admins can manage super_admins" ON public.super_admins FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins themselves can read their profile" ON public.super_admins;
CREATE POLICY "Super admins themselves can read their profile" ON public.super_admins FOR SELECT USING (id = auth.uid());

-- Policies for school_admins
DROP POLICY IF EXISTS "Super admins can manage school_admins" ON public.school_admins;
CREATE POLICY "Super admins can manage school_admins" ON public.school_admins FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School admins can view school_admins in their school" ON public.school_admins;
CREATE POLICY "School admins can view school_admins in their school" ON public.school_admins FOR SELECT USING (school_id = public.get_current_user_school_id());

-- Policies for teachers
DROP POLICY IF EXISTS "Super admins can manage teachers" ON public.teachers;
CREATE POLICY "Super admins can manage teachers" ON public.teachers FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School admins can manage teachers in their school" ON public.teachers;
CREATE POLICY "School admins can manage teachers in their school" ON public.teachers FOR ALL USING (school_id = public.get_current_user_school_id());

DROP POLICY IF EXISTS "Teachers can view their own profile" ON public.teachers;
CREATE POLICY "Teachers can view their own profile" ON public.teachers FOR SELECT USING (id = auth.uid());

-- Policies for students
DROP POLICY IF EXISTS "Super admins can manage students" ON public.students;
CREATE POLICY "Super admins can manage students" ON public.students FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School admins/teachers can manage students in their school" ON public.students;
CREATE POLICY "School admins/teachers can manage students in their school" ON public.students FOR ALL USING (school_id = public.get_current_user_school_id());

DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
CREATE POLICY "Students can view their own profile" ON public.students FOR SELECT USING (id = auth.uid());

-- Policies for exams
DROP POLICY IF EXISTS "Super admins can do all on exams" ON public.exams;
CREATE POLICY "Super admins can do all on exams" ON public.exams FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School users can view exams in their school" ON public.exams;
CREATE POLICY "School users can view exams in their school" ON public.exams FOR SELECT USING (school_id = public.get_current_user_school_id());

DROP POLICY IF EXISTS "School admins/teachers can manage exams in their school" ON public.exams;
CREATE POLICY "School admins/teachers can manage exams in their school" ON public.exams FOR ALL USING (school_id = public.get_current_user_school_id() AND public.is_school_admin_or_teacher());

-- Policies for questions
DROP POLICY IF EXISTS "Super admins can do all on questions" ON public.questions;
CREATE POLICY "Super admins can do all on questions" ON public.questions FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School users can view questions in their school" ON public.questions;
CREATE POLICY "School users can view questions in their school" ON public.questions FOR SELECT USING (school_id = public.get_current_user_school_id());

DROP POLICY IF EXISTS "School admins/teachers can manage questions in their school" ON public.questions;
CREATE POLICY "School admins/teachers can manage questions in their school" ON public.questions FOR ALL USING (school_id = public.get_current_user_school_id() AND public.is_school_admin_or_teacher());

-- Policies for results
DROP POLICY IF EXISTS "Super admins can do all on results" ON public.results;
CREATE POLICY "Super admins can do all on results" ON public.results FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School admins/teachers can view results in their school" ON public.results;
CREATE POLICY "School admins/teachers can view results in their school" ON public.results FOR SELECT USING (school_id = public.get_current_user_school_id() AND public.is_school_admin_or_teacher());

DROP POLICY IF EXISTS "Students can view and insert their own results" ON public.results;
CREATE POLICY "Students can view and insert their own results" ON public.results FOR ALL USING (student_id = auth.uid());

-- Policies for exam_subjects
DROP POLICY IF EXISTS "Super admins can do all on exam_subjects" ON public.exam_subjects;
CREATE POLICY "Super admins can do all on exam_subjects" ON public.exam_subjects FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School users can view exam_subjects in their school" ON public.exam_subjects;
CREATE POLICY "School users can view exam_subjects in their school" ON public.exam_subjects FOR SELECT USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_subjects.exam_id AND e.school_id = public.get_current_user_school_id()));

DROP POLICY IF EXISTS "School admins can manage exam_subjects" ON public.exam_subjects;
CREATE POLICY "School admins can manage exam_subjects" ON public.exam_subjects FOR ALL USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_subjects.exam_id AND e.school_id = public.get_current_user_school_id()) AND EXISTS (SELECT 1 FROM public.school_admins u WHERE u.id = auth.uid()));

-- Policies for exam_subject_teachers
DROP POLICY IF EXISTS "Super admins can do all on exam_subject_teachers" ON public.exam_subject_teachers;
CREATE POLICY "Super admins can do all on exam_subject_teachers" ON public.exam_subject_teachers FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School users can view exam_subject_teachers" ON public.exam_subject_teachers;
CREATE POLICY "School users can view exam_subject_teachers" ON public.exam_subject_teachers FOR SELECT USING (EXISTS (SELECT 1 FROM public.exam_subjects es JOIN public.exams e ON e.id = es.exam_id WHERE es.id = exam_subject_teachers.exam_subject_id AND e.school_id = public.get_current_user_school_id()));

DROP POLICY IF EXISTS "School admins can manage exam_subject_teachers" ON public.exam_subject_teachers;
CREATE POLICY "School admins can manage exam_subject_teachers" ON public.exam_subject_teachers FOR ALL USING (EXISTS (SELECT 1 FROM public.exam_subjects es JOIN public.exams e ON e.id = es.exam_id WHERE es.id = exam_subject_teachers.exam_subject_id AND e.school_id = public.get_current_user_school_id()) AND EXISTS (SELECT 1 FROM public.school_admins u WHERE u.id = auth.uid()));

-- Policies for exam_students
DROP POLICY IF EXISTS "Super admins can do all on exam_students" ON public.exam_students;
CREATE POLICY "Super admins can do all on exam_students" ON public.exam_students FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School admins/teachers can manage exam_students" ON public.exam_students;
CREATE POLICY "School admins/teachers can manage exam_students" ON public.exam_students FOR ALL USING (public.check_exam_school_access(exam_id));

DROP POLICY IF EXISTS "Students can view their own exam assignments" ON public.exam_students;
CREATE POLICY "Students can view their own exam assignments" ON public.exam_students FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can update their own exam status" ON public.exam_students;
CREATE POLICY "Students can update their own exam status" ON public.exam_students FOR UPDATE USING (student_id = auth.uid());


-- ============================================================
-- 5. Auth Trigger for Profile Creation
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_school_id UUID;
  v_full_name TEXT;
  v_roll_number TEXT;
  v_date_of_birth DATE;
  v_course TEXT;
  v_batch TEXT;
  v_session TEXT;
  v_department TEXT;
BEGIN
  -- Get metadata values
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'New User');
  v_roll_number := new.raw_user_meta_data->>'roll_number';
  v_course := COALESCE(new.raw_user_meta_data->>'course', 'General');
  v_batch := COALESCE(new.raw_user_meta_data->>'batch', 'Main');
  v_session := COALESCE(new.raw_user_meta_data->>'session', '2026-27');
  v_department := new.raw_user_meta_data->>'department';
  
  IF new.raw_user_meta_data->>'date_of_birth' IS NOT NULL THEN
    v_date_of_birth := (new.raw_user_meta_data->>'date_of_birth')::DATE;
  ELSE
    v_date_of_birth := NULL;
  END IF;

  IF new.raw_user_meta_data->>'school_id' IS NOT NULL THEN
    v_school_id := (new.raw_user_meta_data->>'school_id')::UUID;
  ELSE
    v_school_id := NULL;
  END IF;

  -- Only allow growtezexamos@gmail.com to be super_admin
  IF new.email = 'growtezexamos@gmail.com' THEN
    v_role := 'super_admin';
  END IF;

  -- Insert into respective profile table based on role
  IF v_role = 'super_admin' THEN
    INSERT INTO public.super_admins (id, full_name, email)
    VALUES (new.id, v_full_name, new.email);
  ELSIF v_role = 'school_admin' THEN
    INSERT INTO public.school_admins (id, school_id, full_name, email)
    VALUES (new.id, v_school_id, v_full_name, new.email);
  ELSIF v_role = 'teacher' THEN
    INSERT INTO public.teachers (id, school_id, full_name, email, department)
    VALUES (new.id, v_school_id, v_full_name, new.email, v_department);
  ELSE -- student
    INSERT INTO public.students (id, school_id, full_name, email, roll_number, date_of_birth, course, batch, session)
    VALUES (new.id, v_school_id, v_full_name, new.email, v_roll_number, v_date_of_birth, v_course, v_batch, v_session);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Manually confirm the email of the super admin if it exists
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'growtezexamos@gmail.com';

-- Grant access ONLY to the 'id' column on auth.users for foreign key verification
GRANT SELECT (id) ON auth.users TO authenticated;
GRANT SELECT (id) ON auth.users TO anon;


-- ============================================================
-- 6. RPC Functions
-- ============================================================

-- Bulletproof RPC function to assign students that bypasses RLS insert quirks
CREATE OR REPLACE FUNCTION public.assign_students(p_exam_id UUID, p_student_ids UUID[])
RETURNS VOID AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  -- Check if user is super admin
  IF public.is_super_admin() THEN
    v_has_access := TRUE;
  ELSE
    -- Check if user is school admin or teacher for the exam's school
    v_has_access := public.check_exam_school_access(p_exam_id);
  END IF;

  IF NOT v_has_access THEN
    RAISE EXCEPTION 'Access denied to this exam';
  END IF;

  -- Insert students
  INSERT INTO public.exam_students (exam_id, student_id, status)
  SELECT p_exam_id, unnest(p_student_ids), 'assigned'
  ON CONFLICT (exam_id, student_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Bulletproof RPC function for students to submit exams, bypassing complex RLS inserts
CREATE OR REPLACE FUNCTION public.submit_exam(
  p_exam_id UUID,
  p_school_id UUID,
  p_answers JSONB,
  p_total_marks INTEGER,
  p_section_scores JSONB,
  p_time_taken_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Insert result
  INSERT INTO public.results (
    exam_id,
    student_id,
    school_id,
    answers,
    total_marks,
    section_scores,
    time_taken_seconds
  ) VALUES (
    p_exam_id,
    auth.uid(),
    p_school_id,
    p_answers,
    p_total_marks,
    p_section_scores,
    p_time_taken_seconds
  )
  ON CONFLICT (exam_id, student_id) 
  DO UPDATE SET
    answers = EXCLUDED.answers,
    total_marks = EXCLUDED.total_marks,
    section_scores = EXCLUDED.section_scores,
    time_taken_seconds = EXCLUDED.time_taken_seconds,
    submitted_at = NOW();

  -- Update exam_students status
  UPDATE public.exam_students
  SET status = 'submitted', submitted_at = NOW()
  WHERE exam_id = p_exam_id AND student_id = auth.uid();
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- GROWTEZ EXAMOS — HYBRID BILLING SCHEMA
-- ============================================================

-- 1. Add Exam Credits to the existing Schools table
ALTER TABLE public.schools 


-- 2. Create the Plans Table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g., 'Monthly Pro', 'Quarterly Starter', '10 Exam Pack'
    plan_type TEXT NOT NULL CHECK (plan_type IN ('time_based', 'exam_based')),
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'none')), 
    price NUMERIC(10, 2) NOT NULL,
    credits_awarded INTEGER DEFAULT 0, -- Used only if plan_type is 'exam_based'
    razorpay_plan_id TEXT, -- Nullable (Credit packs use Payment Links, Subscriptions use Plan IDs)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create the Subscriptions Table (Tracks Time-Based Plans)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.plans(id) ON DELETE RESTRICT NOT NULL,
    razorpay_subscription_id TEXT UNIQUE,
    razorpay_customer_id TEXT,
    status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('active', 'past_due', 'suspended', 'cancelled', 'incomplete', 'expired')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id) -- A school can only have one active time-based subscription at a time
);

-- 4. Create an Order History Table (Tracks Credit Purchases & Past Invoices)
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
    razorpay_payment_id TEXT UNIQUE NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    payment_type TEXT CHECK (payment_type IN ('subscription_charge', 'credit_purchase')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Auto-update timestamp trigger for subscriptions
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_subscriptions_modtime ON public.subscriptions;
CREATE TRIGGER update_subscriptions_modtime
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ============================================================
-- 6. Enable Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Plans Policies
DROP POLICY IF EXISTS "Super admins manage plans" ON public.plans;
CREATE POLICY "Super admins manage plans" ON public.plans FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;
CREATE POLICY "Anyone can view active plans" ON public.plans FOR SELECT USING (is_active = true);

-- Subscriptions Policies
DROP POLICY IF EXISTS "Super admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "Super admins manage subscriptions" ON public.subscriptions FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School admins can view their subscription" ON public.subscriptions;
CREATE POLICY "School admins can view their subscription" ON public.subscriptions FOR SELECT USING (
    school_id = public.get_current_user_school_id() AND EXISTS (SELECT 1 FROM public.school_admins WHERE id = auth.uid())
);

-- Payment History Policies
DROP POLICY IF EXISTS "Super admins manage payment history" ON public.payment_history;
CREATE POLICY "Super admins manage payment history" ON public.payment_history FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School admins view their payment history" ON public.payment_history;
CREATE POLICY "School admins view their payment history" ON public.payment_history FOR SELECT USING (
    school_id = public.get_current_user_school_id() AND EXISTS (SELECT 1 FROM public.school_admins WHERE id = auth.uid())
);
