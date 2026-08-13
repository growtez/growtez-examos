-- 1. Add the column back
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;

-- 2. Backfill existing data based on the exam's school_id
UPDATE public.students s
SET school_id = e.school_id
FROM public.exams e
WHERE s.exam_id = e.id AND s.school_id IS NULL;

-- 3. Make it NOT NULL for future (if possible)
ALTER TABLE public.students ALTER COLUMN school_id SET NOT NULL;

-- 4. Reload cache
NOTIFY pgrst, 'reload schema';
