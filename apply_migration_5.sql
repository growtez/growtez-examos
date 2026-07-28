DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT constraint_name 
              FROM information_schema.table_constraints 
              WHERE table_name = 'students' AND constraint_type = 'UNIQUE') 
    LOOP
        EXECUTE 'ALTER TABLE public.students DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.students
ADD CONSTRAINT unique_exam_roll_dob UNIQUE (exam_id, roll_number, date_of_birth);
