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
    const testName = exam.title || 'Exam Results';
    const schoolName = exam.schools?.name || 'Results Report';
    const totalStudents = results.length;
    const totalExamMarks = exam.total_marks || 'N/A';
    
    let filterText = '';
    if (courseFilter || batchFilter) {
      filterText = `Filters: ${courseFilter || 'All Courses'} | ${batchFilter || 'All Batches'}`;
    }

    // Header
    doc.setFontSize(18);
    doc.setTextColor(26, 46, 46);
    doc.text(schoolName, 40, 40);
    
    doc.setFontSize(11);
    doc.setTextColor(85, 85, 85);
    doc.text(`Test Name: ${testName}`, 40, 60);
    doc.text(`Total Students Appeared: ${totalStudents}`, 40, 75);
    doc.text(`Total Marks: ${totalExamMarks}`, 40, 90);
    if (filterText) doc.text(filterText, 40, 105);

    // Marking scheme summary
    let yPos = filterText ? 120 : 105;
    const ms = exam.marking_scheme;
    if (ms) {
      const msqPartialEnabled = ms.msq_partial_enabled ?? false;
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      const schemeText = `Marking: MCQ +${ms.mcq_correct}/${ms.mcq_wrong} | NAT +${ms.nat_correct}/${ms.nat_wrong}` +
        (ms.msq_enabled ? ` | MSQ +${ms.msq_correct}/${ms.msq_wrong}` + (msqPartialEnabled ? ` (partial +${ms.msq_partial}/correct opt)` : ' (no partial)') : '');
      doc.text(schemeText, 40, yPos);
      yPos += 13;
      doc.text('Subject columns: Marks (C=Correct, P=Partial, W=Wrong)', 40, yPos);
      yPos += 8;
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
      startY: yPos + 5,
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [0, 128, 128], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 249, 249] },
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
