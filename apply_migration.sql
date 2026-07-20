DROP TABLE IF EXISTS public.exam_students CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    roll_number TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    course TEXT DEFAULT 'General',
    batch TEXT DEFAULT 'Main',
    session TEXT DEFAULT '2026-27',
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted')),
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    active_device_id TEXT,
    last_active_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_exam_roll 
  ON public.students (exam_id, roll_number);

ALTER TABLE public.students
  ADD CONSTRAINT students_exam_roll_key UNIQUE USING INDEX idx_students_exam_roll;

CREATE OR REPLACE FUNCTION public.get_student_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb->>'student_id')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.get_student_exam_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb->>'exam_id')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage students" ON public.students;
CREATE POLICY "Super admins can manage students" ON public.students FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School admins/teachers can manage students in their school" ON public.students;
CREATE POLICY "School admins/teachers can manage students in their school" ON public.students FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = public.students.exam_id 
    AND e.school_id = public.get_current_user_school_id()
  )
);

DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
CREATE POLICY "Students can view their own profile" ON public.students FOR SELECT USING (id = public.get_student_id());

DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;
CREATE POLICY "Students can update their own profile" ON public.students FOR UPDATE USING (id = public.get_student_id());

DROP POLICY IF EXISTS "Students can view their assigned exam" ON public.exams;
CREATE POLICY "Students can view their assigned exam" ON public.exams FOR SELECT USING (id = public.get_student_exam_id());

DROP POLICY IF EXISTS "Students can view questions for their exam" ON public.questions;
CREATE POLICY "Students can view questions for their exam" ON public.questions FOR SELECT USING (exam_id = public.get_student_exam_id());

DROP POLICY IF EXISTS "Students can view/insert their own results" ON public.results;
CREATE POLICY "Students can view/insert their own results" ON public.results FOR ALL USING (student_id = public.get_student_id());

CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS UUID AS $$
DECLARE
  v_school_id UUID;
BEGIN
  IF public.is_super_admin() THEN
    RETURN NULL;
  END IF;
  SELECT school_id INTO v_school_id FROM public.school_admins WHERE id = auth.uid();
  IF v_school_id IS NOT NULL THEN
    RETURN v_school_id;
  END IF;
  SELECT school_id INTO v_school_id FROM public.teachers WHERE id = auth.uid();
  IF v_school_id IS NOT NULL THEN
    RETURN v_school_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.heartbeat_student_session;
CREATE OR REPLACE FUNCTION public.heartbeat_student_session(p_student_id UUID, p_device_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.get_student_id() != p_student_id THEN
    RETURN FALSE;
  END IF;
  UPDATE public.students
  SET last_active_at = NOW()
  WHERE id = p_student_id AND active_device_id = p_device_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.clear_student_session;
CREATE OR REPLACE FUNCTION public.clear_student_session(p_student_id UUID, p_device_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.get_student_id() != p_student_id THEN
    RETURN FALSE;
  END IF;
  UPDATE public.students
  SET active_device_id = NULL, last_active_at = NULL
  WHERE id = p_student_id AND active_device_id = p_device_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.check_and_set_student_session;
CREATE OR REPLACE FUNCTION public.check_and_set_student_session(p_student_id UUID, p_device_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_device TEXT;
  v_last_active TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT active_device_id, last_active_at INTO v_current_device, v_last_active
  FROM public.students WHERE id = p_student_id;
  
  IF v_current_device IS NULL OR v_current_device = p_device_id OR (NOW() - v_last_active) > INTERVAL '1 minute' THEN
    UPDATE public.students
    SET active_device_id = p_device_id, last_active_at = NOW()
    WHERE id = p_student_id;
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
