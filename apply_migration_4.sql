DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;
CREATE POLICY "Students can view their own profile" ON public.students FOR SELECT USING (id = public.get_student_id());
CREATE POLICY "Students can update their own profile" ON public.students FOR UPDATE USING (id = public.get_student_id());
