const fs = require('fs');

let content = fs.readFileSync('supabase/migrations/001_schema.sql', 'utf8');

// 1. Remove old students table (Lines 53 to 77)
content = content.replace(/CREATE TABLE IF NOT EXISTS public\.students \([\s\S]*?USING INDEX idx_students_school_roll_course_batch_session;/g, '');

// 2. Remove exam_students table (Lines 131 to 140)
content = content.replace(/CREATE TABLE IF NOT EXISTS public\.exam_students \([\s\S]*?UNIQUE\(exam_id, student_id\)\r?\n\);/g, '');

// 3. Remove exam_students references in RLS and FK dropping
content = content.replace(/ALTER TABLE public\.exam_students DROP CONSTRAINT IF EXISTS exam_students_student_id_fkey;/g, '');
content = content.replace(/ALTER TABLE public\.exam_students ENABLE ROW LEVEL SECURITY;/g, '');
content = content.replace(/-- Policies for exam_students[\s\S]*?FOR UPDATE USING \(student_id = auth\.uid\(\)\);/g, '');

// 4. Remove assign_students function entirely
content = content.replace(/CREATE OR REPLACE FUNCTION public\.assign_students[\s\S]*?\$\$ LANGUAGE plpgsql SECURITY DEFINER;/g, '');

// 5. Inject the NEW students table after exams table
const newStudentsTable = `
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exam_id, roll_number)
);
`;

content = content.replace(/(CREATE TABLE IF NOT EXISTS public\.exams \([\s\S]*?\r?\n\);)/, '$1\n' + newStudentsTable);

// 6. Fix auto_submit_exam (it tries to update exam_students, but it should update students table)
content = content.replace(/UPDATE public\.exam_students\s*SET status = 'submitted',\s*submitted_at = NOW\(\)\s*WHERE exam_id = p_exam_id AND status = 'in_progress';/g, 
  "UPDATE public.students SET status = 'submitted', submitted_at = NOW() WHERE exam_id = p_exam_id AND status = 'in_progress';");

// 7. Fix get_student_id and get_student_exam_id in schema
content = content.replace(/CREATE OR REPLACE FUNCTION public\.get_student_id\(\)[\s\S]*?\$\$ LANGUAGE plpgsql STABLE;/g, 
`CREATE OR REPLACE FUNCTION public.get_student_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb->>'student_id')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;`);

content = content.replace(/CREATE OR REPLACE FUNCTION public\.get_student_exam_id\(\)[\s\S]*?\$\$ LANGUAGE plpgsql STABLE;/g, 
`CREATE OR REPLACE FUNCTION public.get_student_exam_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb->>'exam_id')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;`);

// 8. Fix RLS policies for students
content = content.replace(/-- Policies for students[\s\S]*?FOR UPDATE USING \(id = public\.get_student_id\(\)\);/g, 
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
CREATE POLICY "Students can update their own profile" ON public.students FOR UPDATE USING (id = public.get_student_id());
`);

fs.writeFileSync('supabase/migrations/001_schema.sql', content);
console.log('Schema fixed successfully');
