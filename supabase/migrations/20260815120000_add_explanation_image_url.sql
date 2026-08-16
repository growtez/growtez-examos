-- Migration: add_explanation_image_to_questions
-- Description: Adds a dedicated image URL column for question explanations to allow for cropped image previews and management.

ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS explanation_image_url TEXT;
