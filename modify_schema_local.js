const fs = require('fs');
let content = fs.readFileSync('supabase/migrations/001_schema.sql', 'utf8');

// Replace students table
content = content.replace(
/CREATE TABLE IF NOT EXISTS public\.students \([\s\S]*?\);/,
`CREATE TABLE IF NOT EXISTS public.students (
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
);`
);

// Remove exam_students
content = content.replace(/CREATE TABLE IF NOT EXISTS public\.exam_students \([\s\S]*?\);\n/g, '');

// Update constraints
content = content.replace(
/-- Drop the old unique constraint if it exists[\s\S]*?ADD CONSTRAINT students_school_roll_course_batch_session_key UNIQUE USING INDEX idx_students_school_roll_course_batch_session;/g,
`CREATE UNIQUE INDEX IF NOT EXISTS idx_students_exam_roll 
  ON public.students (exam_id, roll_number);

ALTER TABLE public.students
  ADD CONSTRAINT students_exam_roll_key UNIQUE USING INDEX idx_students_exam_roll;`
);

// Update get_current_user_school_id
content = content.replace(
/-- Check students\s*SELECT school_id INTO v_school_id FROM public\.students WHERE id = auth\.uid\(\);\s*RETURN v_school_id;/g,
`-- Students no longer have school_id
  RETURN NULL;`
);

// Add custom functions
content = content.replace(
/CREATE OR REPLACE FUNCTION public\.is_super_admin/,
`CREATE OR REPLACE FUNCTION public.get_student_id()
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

CREATE OR REPLACE FUNCTION public.is_super_admin`
);

// Update student policies
content = content.replace(
/-- Policies for students[\s\S]*?USING \(id = auth\.uid\(\)\);/g,
`-- Policies for students
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
CREATE POLICY "Students can update their own profile" ON public.students FOR UPDATE USING (id = public.get_student_id());`
);

// Update exam policies
content = content.replace(
/CREATE POLICY "School users can view exams in their school" ON public\.exams FOR SELECT USING \(school_id = public\.get_current_user_school_id\(\)\);/g,
`CREATE POLICY "School users can view exams in their school" ON public.exams FOR SELECT USING (school_id = public.get_current_user_school_id());
CREATE POLICY "Students can view their assigned exam" ON public.exams FOR SELECT USING (id = public.get_student_exam_id());`
);

// Update questions policies
content = content.replace(
/CREATE POLICY "School users can view questions in their school" ON public\.questions FOR SELECT USING \(school_id = public\.get_current_user_school_id\(\)\);/g,
`CREATE POLICY "School users can view questions in their school" ON public.questions FOR SELECT USING (school_id = public.get_current_user_school_id());
CREATE POLICY "Students can view questions for their exam" ON public.questions FOR SELECT USING (exam_id = public.get_student_exam_id());`
);

// Update results policies
content = content.replace(
/CREATE POLICY "School users can view results in their school" ON public\.results FOR SELECT USING \(EXISTS \(SELECT 1 FROM public\.exams e WHERE e\.id = public\.results\.exam_id AND e\.school_id = public\.get_current_user_school_id\(\)\)\);/g,
`CREATE POLICY "School users can view results in their school" ON public.results FOR SELECT USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = public.results.exam_id AND e.school_id = public.get_current_user_school_id()));
CREATE POLICY "Students can view/insert their own results" ON public.results FOR ALL USING (student_id = public.get_student_id());`
);

// Update RPCs
content = content.replace(/auth\.uid\(\) != p_student_id/g, 'public.get_student_id() != p_student_id');

fs.writeFileSync('supabase/migrations/001_schema.sql', content);
console.log('Done!');
