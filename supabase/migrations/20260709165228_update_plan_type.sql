-- Drop the old constraint
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_plan_type_check;

-- Add the new constraint
ALTER TABLE plans ADD CONSTRAINT plans_plan_type_check CHECK (plan_type IN ('time_based', 'exam_based'));

-- Update existing data
UPDATE plans SET plan_type = 'exam_based' WHERE plan_type = 'credit_based';
