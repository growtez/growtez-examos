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

  // 2. Fetch results
  const { data: resultsData, error: resultsError } = await supabase
    .from('results')
    .select('*, students:student_id(full_name, roll_number, course, batch)')
    .eq('exam_id', examId)
    .order('total_marks', { ascending: false });

  if (resultsError || !resultsData) {
    return new NextResponse('Error fetching results', { status: 500 });
  }

  let results = resultsData;
  if (courseFilter) results = results.filter(r => r.students?.course === courseFilter);
  if (batchFilter) results = results.filter(r => r.students?.batch === batchFilter);

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
    results.forEach(r => {
      if (Array.isArray(r.section_scores)) {
        r.section_scores.forEach((s: any) => subjectSet.add(s.subject_name));
      }
    });
    const subjects = Array.from(subjectSet);

    const tableColumn = [
      "Sl No", "Roll No", "Student Name", "Total Score",
      ...subjects.map(s => s)
    ];
    const tableRows: any[] = [];

    results.forEach((res, index) => {
      const rowData: any[] = [
        index + 1,
        res.students?.roll_number || 'N/A',
        res.students?.full_name || 'Unknown',
        `${res.total_marks ?? 0} / ${totalExamMarks}`
      ];

      // Subject-wise: show marks scored and correct count
      subjects.forEach(sub => {
        if (Array.isArray(res.section_scores)) {
          const score = res.section_scores.find((s: any) => s.subject_name === sub);
          if (score) {
            const parts = [`${score.correct ?? 0}C`];
            if (score.partial) parts.push(`${score.partial}P`);
            if (score.wrong) parts.push(`${score.wrong}W`);
            rowData.push(`${score.marks ?? 0} (${parts.join('/')})`);
          } else {
            rowData.push('—');
          }
        } else {
          rowData.push('—');
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
