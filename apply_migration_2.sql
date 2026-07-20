DROP POLICY IF EXISTS "Students can view exam subjects for their exam" ON public.exam_subjects;
CREATE POLICY "Students can view exam subjects for their exam" ON public.exam_subjects FOR SELECT USING (exam_id = public.get_student_exam_id());
