import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const examId = searchParams.get('examId');
  const courseFilter = searchParams.get('course');
  const batchFilter = searchParams.get('batch');

  if (!examId) {
    return new NextResponse('Missing examId', { status: 400 });
  }

  const supabase = createClient();

  // 1. Fetch exam
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('*, schools:school_id(name)')
    .eq('id', examId)
    .single();

  if (examError || !exam) {
    return new NextResponse('Exam not found', { status: 404 });
  }

  // 2. Fetch all students assigned to this exam
  const { data: studentsData } = await supabase
    .from('students')
    .select('id, full_name, roll_number, course, batch, status, started_at, last_active_at, submitted_at')
    .eq('exam_id', examId);

  // 3. Fetch results
  const { data: resultsRaw, error: resultsError } = await supabase
    .from('results')
    .select('*, students:student_id(full_name, roll_number, course, batch)')
    .eq('exam_id', examId)
    .order('total_marks', { ascending: false });

  if (resultsError || !resultsRaw) {
    return new NextResponse('Error fetching results', { status: 500 });
  }

  // 4. Fetch exam subjects for synthetic section_scores
  const { data: subjectsData } = await supabase
    .from('exam_subjects')
    .select('subject_name, total_marks')
    .eq('exam_id', examId)
    .order('sort_order', { ascending: true });
  const examSubjects = subjectsData || [];

  const buildZeroSectionScores = () =>
    examSubjects.map((subj: any) => ({
      subject_name: subj.subject_name,
      marks: 0,
      max_marks: subj.total_marks || 0,
      correct: 0,
      partial: 0,
      wrong: 0
    }));

  // 5. Merge: for each student, find their result or create a 0-mark row
  const resultMap = new Map((resultsRaw || []).map((r: any) => [r.student_id, r]));
  const allStudents = (studentsData || []);

  const allRows = allStudents.map((student: any) => {
    const result = resultMap.get(student.id);
    const hasLoggedIn = !!(
      result ||
      student.status === 'in_progress' ||
      student.status === 'submitted' ||
      student.started_at ||
      student.last_active_at ||
      student.submitted_at
    );

    if (result) {
      return { ...result };
    }
    if (hasLoggedIn) {
      return {
        id: `no-res-${student.id}`,
        student_id: student.id,
        exam_id: examId,
        total_marks: 0,
        submitted_at: null,
        section_scores: examSubjects.length > 0 ? buildZeroSectionScores() : null,
        students: {
          full_name: student.full_name,
          roll_number: student.roll_number,
          course: student.course,
          batch: student.batch
        },
        isAbsent: false
      };
    }
    // Never logged in → Not Attempted
    return {
      id: `absent-${student.id}`,
      student_id: student.id,
      exam_id: examId,
      total_marks: null,
      submitted_at: null,
      section_scores: null,
      students: {
        full_name: student.full_name,
        roll_number: student.roll_number,
        course: student.course,
        batch: student.batch
      },
      isAbsent: true
    };
  });

  // Sort: attempted first (by marks desc), then not-attempted
  allRows.sort((a: any, b: any) => {
    if (a.isAbsent && !b.isAbsent) return 1;
    if (!a.isAbsent && b.isAbsent) return -1;
    return (b.total_marks ?? -Infinity) - (a.total_marks ?? -Infinity);
  });

  let results = allRows;
  if (courseFilter) results = results.filter((r: any) => r.students?.course === courseFilter);
  if (batchFilter) results = results.filter((r: any) => r.students?.batch === batchFilter);

  // Generate PDF using jsPDF
  try {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const testName = exam.title || 'Exam Results';
    const schoolName = exam.schools?.name || 'Results Report';
    const totalStudents = results.length;
    const totalExamMarks = exam.total_marks || 'N/A';

    let filterText = '';
    if (courseFilter || batchFilter) {
      filterText = `${courseFilter || 'All Courses'}  ·  ${batchFilter || 'All Batches'}`;
    }

    // ── Header banner ──────────────────────────────────────────────────
    doc.setFillColor(15, 118, 110); // teal-700
    doc.rect(0, 0, pageWidth, 64, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text(schoolName, 36, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(204, 240, 238);
    doc.text('Exam Results Report', 36, 48);

    // ── Exam meta block ────────────────────────────────────────────────
    let yPos = 88;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);   // slate-900
    doc.text(testName, 36, yPos);
    yPos += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500

    const metaItems = [
      `Total Students: ${totalStudents}`,
      `Total Marks: ${totalExamMarks}`,
      ...(filterText ? [`Filters: ${filterText}`] : []),
    ];
    doc.text(metaItems.join('    |    '), 36, yPos);
    yPos += 14;

    // ── Marking scheme note ────────────────────────────────────────────
    const ms = exam.marking_scheme;
    if (ms) {
      const msqPartialEnabled = ms.msq_partial_enabled ?? false;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      const schemeText =
        `Marking Scheme — MCQ: +${ms.mcq_correct} / ${ms.mcq_wrong}` +
        `   NAT: +${ms.nat_correct} / ${ms.nat_wrong}` +
        (ms.msq_enabled
          ? `   MSQ: +${ms.msq_correct} / ${ms.msq_wrong}` +
            (msqPartialEnabled ? ` (partial +${ms.msq_partial}/opt)` : ' (no partial)')
          : '');
      doc.text(schemeText, 36, yPos);
      yPos += 12;
      doc.setFontSize(7.5);
      doc.text('Subject columns: Score (C = Correct, P = Partial, W = Wrong)', 36, yPos);
      yPos += 10;
    }

    // Collect all unique subjects from the results
    const subjectSet = new Set<string>();
    results.forEach((r: any) => {
      if (Array.isArray(r.section_scores)) {
        r.section_scores.forEach((s: any) => subjectSet.add(s.subject_name));
      }
    });
    // Also add from examSubjects in case some students have no section_scores
    examSubjects.forEach((s: any) => subjectSet.add(s.subject_name));
    const subjects = Array.from(subjectSet);

    const tableColumn = [
      "Sl No", "Roll No", "Student Name", "Total Score",
      ...subjects.map(s => s)
    ];
    const tableRows: any[] = [];

    results.forEach((res: any, index: number) => {
      const rowData: any[] = [
        index + 1,
        res.students?.roll_number || 'N/A',
        res.students?.full_name || 'Unknown',
        res.isAbsent ? 'Not Attempted' : `${res.total_marks ?? 0} / ${totalExamMarks}`
      ];

      // Subject-wise: show marks scored and correct count
      subjects.forEach(sub => {
        if (res.isAbsent) {
          rowData.push('Not Attempted');
        } else if (Array.isArray(res.section_scores)) {
          const score = res.section_scores.find((s: any) => s.subject_name === sub);
          if (score) {
            const parts = [`${score.correct ?? 0}C`];
            if (score.partial) parts.push(`${score.partial}P`);
            if (score.wrong) parts.push(`${score.wrong}W`);
            rowData.push(`${score.marks ?? 0} (${parts.join('/')})`);
          } else {
            rowData.push('0 (0C)');
          }
        } else {
          rowData.push('0 (0C)');
        }
      });

      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPos + 8,
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: { top: 6, right: 8, bottom: 6, left: 8 },
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [15, 118, 110],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: [240, 253, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 30 },
        1: { cellWidth: 55 },
        3: { halign: 'center' },
      },
      margin: { left: 36, right: 36 },
    });

    const arrayBuffer = doc.output('arraybuffer');
    const safeFilename = `${testName.replace(/[^a-zA-Z0-9]/g, '_')}_Results.pdf`;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}
