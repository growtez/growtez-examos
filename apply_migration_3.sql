DROP POLICY IF EXISTS "Students can view and insert their own results" ON public.results;
DROP POLICY IF EXISTS "Students can view/insert their own results" ON public.results;
CREATE POLICY "Students can view and insert their own results" ON public.results FOR ALL USING (student_id = public.get_student_id());
