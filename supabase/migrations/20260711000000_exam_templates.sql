CREATE TABLE IF NOT EXISTS public.exam_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    marking_scheme JSONB DEFAULT '{"mcq_correct": 4, "mcq_wrong": -1, "nat_correct": 4, "nat_wrong": 0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_template_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.exam_templates(id) ON DELETE CASCADE NOT NULL,
    subject_name TEXT NOT NULL,
    question_count INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, subject_name)
);

-- Enable RLS
ALTER TABLE public.exam_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_template_subjects ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow authenticated users to read exam_templates" 
ON public.exam_templates FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to read exam_template_subjects" 
ON public.exam_template_subjects FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow all authenticated users to insert exam_templates"
ON public.exam_templates FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update exam_templates"
ON public.exam_templates FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to delete exam_templates"
ON public.exam_templates FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to insert exam_template_subjects"
ON public.exam_template_subjects FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update exam_template_subjects"
ON public.exam_template_subjects FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to delete exam_template_subjects"
ON public.exam_template_subjects FOR DELETE
TO authenticated
USING (true);
