-- Add explicit RLS policy so students can read their assigned exam directly.
-- The existing "School users can view exams" policy relies on get_current_user_school_id()
-- which checks the students table via auth.uid(). This extra policy ensures students
-- can always read their specific exam even if the school lookup fails for any reason.

DROP POLICY IF EXISTS "Students can view their assigned exam" ON public.exams;
CREATE POLICY "Students can view their assigned exam" ON public.exams
  FOR SELECT
  USING (
    id = public.get_student_exam_id()
  );
