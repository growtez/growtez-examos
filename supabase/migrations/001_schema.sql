-- ============================================================
-- GROWTEZ EXAMOS — CONSOLIDATED SCHEMA SETUP
-- ============================================================

-- 1. Create schools table
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE, -- e.g., 'school1.localhost'
    license_key TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    max_students INTEGER DEFAULT 500,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create super_admins table
CREATE TABLE IF NOT EXISTS public.super_admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create school_admins table
CREATE TABLE IF NOT EXISTS public.school_admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create students table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    roll_number TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint: roll_number must be unique within a school
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_roll_school
  ON public.students (school_id, roll_number);

-- 6. Create exams table
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
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Exam Subjects — customizable per exam
CREATE TABLE IF NOT EXISTS public.exam_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  subject_name TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, subject_name)
);

-- 8. Exam Subject Teachers — which teacher manages which subject
CREATE TABLE IF NOT EXISTS public.exam_subject_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_subject_id UUID REFERENCES public.exam_subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_subject_id, teacher_id)
);

-- 9. Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    exam_subject_id UUID REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'nat')),
    options JSONB, -- MCQ options as JSON
    correct_option TEXT NOT NULL, -- answer code
    positive_marks INTEGER DEFAULT 4,
    negative_marks INTEGER DEFAULT -1,
    question_number INTEGER,
    marks INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Exam Students — assignment of students to exams
CREATE TABLE IF NOT EXISTS public.exam_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted')),
  started_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

-- 11. Create results table
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

-- ============================================================
-- 12. Enable Row Level Security (RLS)
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

-- Helper function to get current user's school_id
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

-- Helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.super_admins WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 13. Policies Setup
-- ============================================================

-- Policies for schools
DROP POLICY IF EXISTS "Super admins can do all on schools" ON public.schools;
CREATE POLICY "Super admins can do all on schools" ON public.schools
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "Users can view their own school" ON public.schools;
CREATE POLICY "Users can view their own school" ON public.schools
  FOR SELECT USING (id = public.get_current_user_school_id());

DROP POLICY IF EXISTS "Allow public select on schools" ON public.schools;
CREATE POLICY "Allow public select on schools" ON public.schools
  FOR SELECT USING (is_active = true);

-- Policies for super_admins
DROP POLICY IF EXISTS "Super admins can manage super_admins" ON public.super_admins;
CREATE POLICY "Super admins can manage super_admins" ON public.super_admins
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins themselves can read their profile" ON public.super_admins;
CREATE POLICY "Super admins themselves can read their profile" ON public.super_admins
  FOR SELECT USING (id = auth.uid());

-- Policies for school_admins
DROP POLICY IF EXISTS "Super admins can manage school_admins" ON public.school_admins;
CREATE POLICY "Super admins can manage school_admins" ON public.school_admins
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School admins can view school_admins in their school" ON public.school_admins;
CREATE POLICY "School admins can view school_admins in their school" ON public.school_admins
  FOR SELECT USING (school_id = public.get_current_user_school_id());

-- Policies for teachers
DROP POLICY IF EXISTS "Super admins can manage teachers" ON public.teachers;
CREATE POLICY "Super admins can manage teachers" ON public.teachers
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School admins can manage teachers in their school" ON public.teachers;
CREATE POLICY "School admins can manage teachers in their school" ON public.teachers
  FOR ALL USING (school_id = public.get_current_user_school_id());

DROP POLICY IF EXISTS "Teachers can view their own profile" ON public.teachers;
CREATE POLICY "Teachers can view their own profile" ON public.teachers
  FOR SELECT USING (id = auth.uid());

-- Policies for students
DROP POLICY IF EXISTS "Super admins can manage students" ON public.students;
CREATE POLICY "Super admins can manage students" ON public.students
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School admins/teachers can manage students in their school" ON public.students;
CREATE POLICY "School admins/teachers can manage students in their school" ON public.students
  FOR ALL USING (school_id = public.get_current_user_school_id());

DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
CREATE POLICY "Students can view their own profile" ON public.students
  FOR SELECT USING (id = auth.uid());

-- Policies for exams
DROP POLICY IF EXISTS "Super admins can do all on exams" ON public.exams;
CREATE POLICY "Super admins can do all on exams" ON public.exams
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School users can view exams in their school" ON public.exams;
CREATE POLICY "School users can view exams in their school" ON public.exams
  FOR SELECT USING (school_id = public.get_current_user_school_id());

DROP POLICY IF EXISTS "School admins/teachers can manage exams in their school" ON public.exams;
CREATE POLICY "School admins/teachers can manage exams in their school" ON public.exams
  FOR ALL USING (school_id = public.get_current_user_school_id() AND 
  (EXISTS (SELECT 1 FROM public.school_admins WHERE id = auth.uid()) OR EXISTS (SELECT 1 FROM public.teachers WHERE id = auth.uid())));

-- Policies for questions
DROP POLICY IF EXISTS "Super admins can do all on questions" ON public.questions;
CREATE POLICY "Super admins can do all on questions" ON public.questions
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School users can view questions in their school" ON public.questions;
CREATE POLICY "School users can view questions in their school" ON public.questions
  FOR SELECT USING (school_id = public.get_current_user_school_id());

DROP POLICY IF EXISTS "School admins/teachers can manage questions in their school" ON public.questions;
CREATE POLICY "School admins/teachers can manage questions in their school" ON public.questions
  FOR ALL USING (school_id = public.get_current_user_school_id() AND 
  (EXISTS (SELECT 1 FROM public.school_admins WHERE id = auth.uid()) OR EXISTS (SELECT 1 FROM public.teachers WHERE id = auth.uid())));

-- Policies for results
DROP POLICY IF EXISTS "Super admins can do all on results" ON public.results;
CREATE POLICY "Super admins can do all on results" ON public.results
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School admins/teachers can view results in their school" ON public.results;
CREATE POLICY "School admins/teachers can view results in their school" ON public.results
  FOR SELECT USING (school_id = public.get_current_user_school_id() AND 
  (EXISTS (SELECT 1 FROM public.school_admins WHERE id = auth.uid()) OR EXISTS (SELECT 1 FROM public.teachers WHERE id = auth.uid())));

DROP POLICY IF EXISTS "Students can view and insert their own results" ON public.results;
CREATE POLICY "Students can view and insert their own results" ON public.results
  FOR ALL USING (student_id = auth.uid());

-- Policies for exam_subjects
DROP POLICY IF EXISTS "Super admins can do all on exam_subjects" ON public.exam_subjects;
CREATE POLICY "Super admins can do all on exam_subjects" ON public.exam_subjects
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School users can view exam_subjects in their school" ON public.exam_subjects;
CREATE POLICY "School users can view exam_subjects in their school" ON public.exam_subjects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_subjects.exam_id
      AND e.school_id = public.get_current_user_school_id()
    )
  );

DROP POLICY IF EXISTS "School admins can manage exam_subjects" ON public.exam_subjects;
CREATE POLICY "School admins can manage exam_subjects" ON public.exam_subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_subjects.exam_id
      AND e.school_id = public.get_current_user_school_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.school_admins u
      WHERE u.id = auth.uid()
    )
  );

-- Policies for exam_subject_teachers
DROP POLICY IF EXISTS "Super admins can do all on exam_subject_teachers" ON public.exam_subject_teachers;
CREATE POLICY "Super admins can do all on exam_subject_teachers" ON public.exam_subject_teachers
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School users can view exam_subject_teachers" ON public.exam_subject_teachers;
CREATE POLICY "School users can view exam_subject_teachers" ON public.exam_subject_teachers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exam_subjects es
      JOIN public.exams e ON e.id = es.exam_id
      WHERE es.id = exam_subject_teachers.exam_subject_id
      AND e.school_id = public.get_current_user_school_id()
    )
  );

DROP POLICY IF EXISTS "School admins can manage exam_subject_teachers" ON public.exam_subject_teachers;
CREATE POLICY "School admins can manage exam_subject_teachers" ON public.exam_subject_teachers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.exam_subjects es
      JOIN public.exams e ON e.id = es.exam_id
      WHERE es.id = exam_subject_teachers.exam_subject_id
      AND e.school_id = public.get_current_user_school_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.school_admins u
      WHERE u.id = auth.uid()
    )
  );

-- Policies for exam_students
DROP POLICY IF EXISTS "Super admins can do all on exam_students" ON public.exam_students;
CREATE POLICY "Super admins can do all on exam_students" ON public.exam_students
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School admins/teachers can manage exam_students" ON public.exam_students;
CREATE POLICY "School admins/teachers can manage exam_students" ON public.exam_students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_students.exam_id
      AND e.school_id = public.get_current_user_school_id()
    )
    AND (
      EXISTS (SELECT 1 FROM public.school_admins WHERE id = auth.uid()) OR 
      EXISTS (SELECT 1 FROM public.teachers WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Students can view their own exam assignments" ON public.exam_students;
CREATE POLICY "Students can view their own exam assignments" ON public.exam_students
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can update their own exam status" ON public.exam_students;
CREATE POLICY "Students can update their own exam status" ON public.exam_students
  FOR UPDATE USING (student_id = auth.uid());

-- ============================================================
-- 14. Auth Triggers for profile creation
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_school_id UUID;
  v_full_name TEXT;
  v_roll_number TEXT;
  v_date_of_birth DATE;
BEGIN
  -- Get metadata values
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'New User');
  v_roll_number := new.raw_user_meta_data->>'roll_number';
  
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
    INSERT INTO public.teachers (id, school_id, full_name, email)
    VALUES (new.id, v_school_id, v_full_name, new.email);
  ELSE -- student
    INSERT INTO public.students (id, school_id, full_name, email, roll_number, date_of_birth)
    VALUES (new.id, v_school_id, v_full_name, new.email, v_roll_number, v_date_of_birth);
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
