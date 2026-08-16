const { Client } = require('pg');
const client = new Client('postgresql://postgres:postgres@localhost:54322/postgres');

const query = `
DROP FUNCTION IF EXISTS public.reset_student_exam(uuid);
DROP FUNCTION IF EXISTS public.reset_student_exam(uuid, uuid);

CREATE OR REPLACE FUNCTION public.reset_student_exam(p_exam_id UUID, p_student_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Reset the student status to 'assigned'
  UPDATE public.students
  SET status = 'assigned'
  WHERE id = p_student_id;

  -- 2. Delete the student's results
  DELETE FROM public.results
  WHERE student_id = p_student_id;

  -- 3. Delete the student's answers
  DELETE FROM public.answers
  WHERE student_id = p_student_id;

  -- 4. Delete the student's exam_sessions
  DELETE FROM public.exam_sessions
  WHERE student_id = p_student_id;
END;
$$;
`;

client.connect()
  .then(() => client.query(query))
  .then(() => {
    console.log("Function created successfully.");
    client.end();
  })
  .catch(e => {
    console.error("Error:", e);
    client.end();
  });
