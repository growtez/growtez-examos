const fs = require('fs');

const schemaPath = 'supabase/migrations/001_schema.sql';
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Drop exam_students
schema = schema.replace(/CREATE TABLE IF NOT EXISTS public\.exam_students \([\s\S]*?\);\n/g, '');

// 2. Replace students table
const studentsTableRegex = /CREATE TABLE IF NOT EXISTS public\.students \([\s\S]*?\);/g;
const newStudentsTable = `CREATE TABLE IF NOT EXISTS public.students (
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
);`;
schema = schema.replace(studentsTableRegex, newStudentsTable);

// 3. Replace students constraints
const studentsConstraintsRegex = /-- Drop the old unique constraint if it exists[\s\S]*?idx_students_school_roll_course_batch_session;/g;
const newStudentsConstraints = `-- Drop old constraints
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_school_roll_course_batch_session_key;
DROP INDEX IF EXISTS idx_students_school_roll_course_batch_session;

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_exam_roll 
  ON public.students (exam_id, roll_number);

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_exam_roll_key;
ALTER TABLE public.students
  ADD CONSTRAINT students_exam_roll_key UNIQUE USING INDEX idx_students_exam_roll;`;
schema = schema.replace(studentsConstraintsRegex, newStudentsConstraints);

// 4. Update get_current_user_school_id (remove student check)
const schoolIdFuncRegex = /-- Check students\s*SELECT school_id INTO v_school_id FROM public\.students WHERE id = auth\.uid\(\);\s*RETURN v_school_id;/g;
schema = schema.replace(schoolIdFuncRegex, '-- Students do not have a school_id anymore\n  RETURN NULL;');

// 5. Add custom JWT functions
const jwtFuncs = `
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
`;
schema = schema.replace(/CREATE OR REPLACE FUNCTION public\.is_super_admin/, jwtFuncs + '\nCREATE OR REPLACE FUNCTION public.is_super_admin');

// 6. Replace Student RLS Policies
const studentRlsRegex = /-- Policies for students[\s\S]*?USING \(id = auth\.uid\(\)\);/g;
const newStudentRls = `-- Policies for students
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
CREATE POLICY "Students can update their own profile" ON public.students FOR UPDATE USING (id = public.get_student_id());`;
schema = schema.replace(studentRlsRegex, newStudentRls);

// 7. Update Exam RLS to allow students
const examRlsRegex = /CREATE POLICY "School users can view exams in their school" ON public\.exams FOR SELECT USING \(school_id = public\.get_current_user_school_id\(\)\);/g;
const newExamRls = `CREATE POLICY "School users can view exams in their school" ON public.exams FOR SELECT USING (school_id = public.get_current_user_school_id());
CREATE POLICY "Students can view their assigned exam" ON public.exams FOR SELECT USING (id = public.get_student_exam_id());`;
schema = schema.replace(examRlsRegex, newExamRls);

// 8. Update Questions RLS to allow students
const questionsRlsRegex = /CREATE POLICY "School users can view questions in their school" ON public\.questions FOR SELECT USING \(school_id = public\.get_current_user_school_id\(\)\);/g;
const newQuestionsRls = `CREATE POLICY "School users can view questions in their school" ON public.questions FOR SELECT USING (school_id = public.get_current_user_school_id());
CREATE POLICY "Students can view questions for their exam" ON public.questions FOR SELECT USING (exam_id = public.get_student_exam_id());`;
schema = schema.replace(questionsRlsRegex, newQuestionsRls);

// 9. Update Results RLS to allow students
const resultsRlsRegex = /CREATE POLICY "School users can view results in their school" ON public\.results FOR SELECT USING \(EXISTS \(SELECT 1 FROM public\.exams e WHERE e\.id = public\.results\.exam_id AND e\.school_id = public\.get_current_user_school_id\(\)\)\);/g;
const newResultsRls = `CREATE POLICY "School users can view results in their school" ON public.results FOR SELECT USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = public.results.exam_id AND e.school_id = public.get_current_user_school_id()));
CREATE POLICY "Students can view/insert their own results" ON public.results FOR ALL USING (student_id = public.get_student_id());`;
schema = schema.replace(resultsRlsRegex, newResultsRls);

fs.writeFileSync(schemaPath, schema);
console.log('001_schema.sql updated successfully.');

// Write migration sql
const migrationSql = \`
DROP TABLE IF EXISTS public.exam_students CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;

\${newStudentsTable}
\${newStudentsConstraints}
\${jwtFuncs}

\${newStudentRls}

DROP POLICY IF EXISTS "Students can view their assigned exam" ON public.exams;
CREATE POLICY "Students can view their assigned exam" ON public.exams FOR SELECT USING (id = public.get_student_exam_id());

DROP POLICY IF EXISTS "Students can view questions for their exam" ON public.questions;
CREATE POLICY "Students can view questions for their exam" ON public.questions FOR SELECT USING (exam_id = public.get_student_exam_id());

DROP POLICY IF EXISTS "Students can view/insert their own results" ON public.results;
CREATE POLICY "Students can view/insert their own results" ON public.results FOR ALL USING (student_id = public.get_student_id());

-- Update get_current_user_school_id to remove student logic
CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS UUID AS $$\nDECLARE\n  v_school_id UUID;\nBEGIN
  IF public.is_super_admin() THEN\n    RETURN NULL;\n  END IF;
  SELECT school_id INTO v_school_id FROM public.school_admins WHERE id = auth.uid();
  IF v_school_id IS NOT NULL THEN\n    RETURN v_school_id;\n  END IF;
  SELECT school_id INTO v_school_id FROM public.teachers WHERE id = auth.uid();
  IF v_school_id IS NOT NULL THEN\n    RETURN v_school_id;\n  END IF;
  RETURN NULL;
END;\n$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update heartbeat RPC
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

-- update clear session
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

-- update check session
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
\`;

fs.writeFileSync('apply_migration.sql', migrationSql);
console.log('apply_migration.sql generated successfully.');
