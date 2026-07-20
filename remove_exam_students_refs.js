const fs = require('fs');

let lines = fs.readFileSync('supabase/migrations/001_schema.sql', 'utf8').split('\n');

const toRemoveRanges = [
    [160, 161], // ALTER TABLE public.exam_students DROP CONSTRAINT IF EXISTS exam_students_student_id_fkey;
    [237, 238], // ALTER TABLE public.exam_students ENABLE ROW LEVEL SECURITY;
    [346, 359], // Policies for exam_students
    [466, 497], // CREATE OR REPLACE FUNCTION public.assign_students
    [528, 532] // UPDATE public.exam_students (inside some function)
];

// Sort descending so splicing doesn't mess up earlier indices
toRemoveRanges.sort((a, b) => b[0] - a[0]);

for (const [start, end] of toRemoveRanges) {
    lines.splice(start, end - start + 1);
}

fs.writeFileSync('supabase/migrations/001_schema.sql', lines.join('\n'));
console.log('Removed exam_students refs successfully');
