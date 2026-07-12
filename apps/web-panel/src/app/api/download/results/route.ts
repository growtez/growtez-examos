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

    // Collect all unique subjects from the results
    const subjectSet = new Set<string>();
    results.forEach(r => {
      if (Array.isArray(r.section_scores)) {
        r.section_scores.forEach((s: any) => subjectSet.add(s.subject_name));
      }
    });
    const subjects = Array.from(subjectSet);

    const tableColumn = ["Sl No", "Roll No", "Student Name", "Total Score", ...subjects.map(s => `${s} (Correct)`)];
    const tableRows: any[] = [];

    results.forEach((res, index) => {
      const rowData = [
        index + 1,
        res.students?.roll_number || 'N/A',
        res.students?.full_name || 'Unknown',
        `${res.total_marks ?? 0} / ${totalExamMarks}`
      ];

      // Subject wise correct answers
      subjects.forEach(sub => {
        let correctAnswers = 0;
        if (Array.isArray(res.section_scores)) {
            const score = res.section_scores.find((s: any) => s.subject_name === sub);
            if (score) correctAnswers = score.correct;
        }
        rowData.push(correctAnswers);
      });

      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: filterText ? 115 : 100,
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
