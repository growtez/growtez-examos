ALTER TABLE public.exam_templates
ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;

-- Drop existing policies on exam_templates
DROP POLICY IF EXISTS "Allow authenticated users to read exam_templates" ON public.exam_templates;
DROP POLICY IF EXISTS "Allow all authenticated users to insert exam_templates" ON public.exam_templates;
DROP POLICY IF EXISTS "Allow all authenticated users to update exam_templates" ON public.exam_templates;
DROP POLICY IF EXISTS "Allow all authenticated users to delete exam_templates" ON public.exam_templates;

-- Recreate RLS policies for exam_templates
CREATE POLICY "Super admins can do all on exam_templates" 
ON public.exam_templates FOR ALL 
USING (public.is_super_admin());

CREATE POLICY "Users can read global templates or their school templates" 
ON public.exam_templates FOR SELECT 
USING (school_id IS NULL OR school_id = public.get_current_user_school_id());

CREATE POLICY "School admins can insert their own custom templates" 
ON public.exam_templates FOR INSERT 
WITH CHECK (school_id = public.get_current_user_school_id() OR public.is_super_admin());

CREATE POLICY "School admins can update their own custom templates" 
ON public.exam_templates FOR UPDATE 
USING (school_id = public.get_current_user_school_id() OR public.is_super_admin());

CREATE POLICY "School admins can delete their own custom templates" 
ON public.exam_templates FOR DELETE 
USING (school_id = public.get_current_user_school_id() OR public.is_super_admin());
