ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES exams(id) ON DELETE SET NULL;
ALTER TABLE payment_history DROP CONSTRAINT IF EXISTS payment_history_payment_type_check;
ALTER TABLE payment_history ADD CONSTRAINT payment_history_payment_type_check CHECK (payment_type IN ('subscription_charge', 'credit_purchase', 'exam_fee'));