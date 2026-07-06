-- Enable Row Level Security
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's school_id
CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS UUID AS $$
DECLARE
  v_school_id UUID;
BEGIN
  SELECT school_id INTO v_school_id FROM public.users WHERE id = auth.uid();
  RETURN v_school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for schools
CREATE POLICY "Super admins can do all on schools" ON public.schools
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can view their own school" ON public.schools
  FOR SELECT USING (id = public.get_current_user_school_id());

-- Policies for users
CREATE POLICY "Super admins can do all on users" ON public.users
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "School admins can manage users in their school" ON public.users
  FOR ALL USING (school_id = public.get_current_user_school_id());

-- Policies for exams
CREATE POLICY "Super admins can do all on exams" ON public.exams
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "School users can view exams in their school" ON public.exams
  FOR SELECT USING (school_id = public.get_current_user_school_id());

CREATE POLICY "School admins/teachers can manage exams in their school" ON public.exams
  FOR ALL USING (school_id = public.get_current_user_school_id() AND 
  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('school_admin', 'teacher'))));

-- Policies for questions
CREATE POLICY "Super admins can do all on questions" ON public.questions
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "School users can view questions in their school" ON public.questions
  FOR SELECT USING (school_id = public.get_current_user_school_id());

CREATE POLICY "School admins/teachers can manage questions in their school" ON public.questions
  FOR ALL USING (school_id = public.get_current_user_school_id() AND 
  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('school_admin', 'teacher'))));

-- Policies for results
CREATE POLICY "Super admins can do all on results" ON public.results
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "School admins/teachers can view results in their school" ON public.results
  FOR SELECT USING (school_id = public.get_current_user_school_id() AND 
  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('school_admin', 'teacher'))));

CREATE POLICY "Students can view and insert their own results" ON public.results
  FOR ALL USING (student_id = auth.uid());
