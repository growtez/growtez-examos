-- ============================================================
-- GROWTEZ EXAMOS — 002: PROFILE FEATURES
-- Tables for Instructions, Feedback, and Notifications
-- ============================================================

-- 1. Modify Existing Tables
ALTER TABLE IF EXISTS public.schools ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create New Tables
CREATE TABLE IF NOT EXISTS public.school_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    content_text TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id) -- One active instruction per school
);

CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general' CHECK (type IN ('feature_request', 'bug_report', 'general')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'general' CHECK (type IN ('fee_update', 'new_feature', 'general', 'alert')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-update timestamp trigger for instructions
DROP TRIGGER IF EXISTS update_school_instructions_modtime ON public.school_instructions;
CREATE TRIGGER update_school_instructions_modtime
    BEFORE UPDATE ON public.school_instructions
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ============================================================
-- 2. Enable Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.school_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Policies Setup
-- ============================================================

-- Policies for school_instructions
DROP POLICY IF EXISTS "Super admins manage instructions" ON public.school_instructions;
CREATE POLICY "Super admins manage instructions" ON public.school_instructions FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School users view their school instructions" ON public.school_instructions;
CREATE POLICY "School users view their school instructions" ON public.school_instructions FOR SELECT USING (school_id = public.get_current_user_school_id());

DROP POLICY IF EXISTS "School admins manage their school instructions" ON public.school_instructions;
CREATE POLICY "School admins manage their school instructions" ON public.school_instructions FOR ALL USING (
    school_id = public.get_current_user_school_id() AND EXISTS (SELECT 1 FROM public.school_admins WHERE id = auth.uid())
);

-- Policies for feedbacks
DROP POLICY IF EXISTS "Super admins manage feedbacks" ON public.feedbacks;
CREATE POLICY "Super admins manage feedbacks" ON public.feedbacks FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "School admins view their school feedbacks" ON public.feedbacks;
CREATE POLICY "School admins view their school feedbacks" ON public.feedbacks FOR SELECT USING (
    school_id = public.get_current_user_school_id() AND EXISTS (SELECT 1 FROM public.school_admins WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "School admins create feedbacks" ON public.feedbacks;
CREATE POLICY "School admins create feedbacks" ON public.feedbacks FOR INSERT WITH CHECK (
    school_id = public.get_current_user_school_id() AND EXISTS (SELECT 1 FROM public.school_admins WHERE id = auth.uid())
);

-- Policies for notifications
DROP POLICY IF EXISTS "Super admins manage notifications" ON public.notifications;
CREATE POLICY "Super admins manage notifications" ON public.notifications FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "Anyone can view active notifications" ON public.notifications;
CREATE POLICY "Anyone can view active notifications" ON public.notifications FOR SELECT USING (is_active = true);
