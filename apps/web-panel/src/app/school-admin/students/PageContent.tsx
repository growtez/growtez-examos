'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function StudentsListContent({ schoolIdProp }: { schoolIdProp?: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const uniqueCourses = Array.from(new Set(students.map(s => s.course).filter(Boolean)));
  const uniqueBatches = Array.from(new Set(students.map(s => s.batch).filter(Boolean)));
  const uniqueSessions = Array.from(new Set(students.map(s => s.session).filter(Boolean))).sort().reverse();

  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [schoolId, setSchoolId] = useState<string | null>(schoolIdProp || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();
  const defaultSession = `${currentYear}-${(currentYear + 1).toString().slice(2)}`;
  
  // Form fields
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [dob, setDob] = useState('');
  const [course, setCourse] = useState('General');
  const [batch, setBatch] = useState('Main');
  const [sessionVal, setSessionVal] = useState(defaultSession);
  
  // Edit & Delete
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchStudents = async () => {
    let activeSchoolId: string | undefined = schoolIdProp;
    if (!activeSchoolId) {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      if (!profile?.school_id) return;
      activeSchoolId = profile.school_id;
    }
    setSchoolId(activeSchoolId || null);

    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', activeSchoolId)
      .order('full_name', { ascending: true });

    setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const formatDobPassword = (dateStr: string) => {
    const parts = dateStr.split('-');
    return `${parts[2]}${parts[1]}${parts[0]}`;
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      if (!schoolId) throw new Error('No school found');

      const studentEmail = `${rollNumber}@${schoolId}.student.examos.local`;
      const studentPassword = formatDobPassword(dob);

      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: studentEmail,
          password: studentPassword,
          full_name: name,
          role: 'student',
          school_id: schoolId,
          roll_number: rollNumber,
          date_of_birth: dob,
          course,
          batch,
          session: sessionVal
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add student');

      setShowModal(false);
      setName(''); setRollNumber(''); setDob('');
      setCourse('General'); setBatch('Main'); setSessionVal(defaultSession);
      fetchStudents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      if (!editStudentId) throw new Error('No student selected');
      const { error: updateError } = await supabase.from('students').update({
        full_name: name,
        roll_number: rollNumber,
        date_of_birth: dob,
        course,
        batch,
        session: sessionVal
      }).eq('id', editStudentId);

      if (updateError) throw new Error(updateError.message);

      setEditStudentId(null);
      setName(''); setRollNumber(''); setDob('');
      setCourse('General'); setBatch('Main'); setSessionVal(defaultSession);
      fetchStudents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentId) return;
    try {
      const res = await fetch('/api/students/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: deleteStudentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete student');
      
      setDeleteStudentId(null);
      fetchStudents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      if (!schoolId) throw new Error('No school found');
      const file = fileInputRef.current?.files?.[0];
      if (!file) throw new Error('Please select a file');

      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      const header = lines[0].toLowerCase();
      const hasHeader = header.includes('name') || header.includes('roll');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      let imported = 0;
      let errors: string[] = [];

      for (const line of dataLines) {
        const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));
        if (cols.length < 3) continue;

        const [studentName, studentRoll, studentDob, sCourse, sBatch, sSession] = cols;
        let formattedDob = studentDob;
        if (studentDob.includes('/')) {
          const p = studentDob.split('/');
          formattedDob = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
        }

        const studentEmail = `${studentRoll}@${schoolId}.student.examos.local`;
        const studentPassword = formattedDob.includes('-')
          ? formatDobPassword(formattedDob)
          : studentDob.replace(/\//g, '');

        try {
          const res = await fetch('/api/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: studentEmail,
              password: studentPassword,
              full_name: studentName,
              role: 'student',
              school_id: schoolId,
              roll_number: studentRoll,
              date_of_birth: formattedDob,
              course: sCourse || 'General',
              batch: sBatch || 'Main',
              session: sSession || defaultSession
            })
          });

          if (res.ok) imported++;
          else {
            const data = await res.json();
            errors.push(`${studentRoll}: ${data.error || 'Failed'}`);
          }
        } catch {
          errors.push(`${studentRoll}: Failed`);
        }
      }

      setSuccess(`Successfully imported ${imported} students${errors.length ? `. ${errors.length} failed.` : '.'}`);
      setShowImportModal(false);
      fetchStudents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter ? s.course === courseFilter : true;
    const matchesBatch = batchFilter ? s.batch === batchFilter : true;
    return matchesSearch && matchesCourse && matchesBatch;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="border-l-4 border-[#008080] pl-4">
          <h2 className="text-2xl font-extrabold text-[#1a2e2e] uppercase tracking-wide">Students</h2>
          <p className="text-[#555555] mt-1 text-sm">Manage your school&apos;s students</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-[#b2d8d8] text-[#1a2e2e] font-bold hover:border-[#008080] hover:text-[#008080] transition-colors text-sm uppercase">
            Import CSV
          </button>
          <button onClick={() => {
            setEditStudentId(null);
            setName(''); setRollNumber(''); setDob('');
            setCourse('General'); setBatch('Main'); setSessionVal(defaultSession);
            setShowModal(true);
          }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#008080] text-white font-bold hover:bg-[#006666] transition-all border-b-2 border-[#004d4d] text-sm uppercase tracking-wider">
            Add Student
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-[#e0f2f2] border border-[#b2d8d8] p-4 text-[#008080] text-sm font-bold mb-6 uppercase">{success}</div>
      )}

      <div className="bg-white border-2 border-[#b2d8d8] p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <input 
          type="text" 
          placeholder="Search by name or roll no..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 bg-[#f5f9f9] border border-[#e0f2f2] text-[#1a2e2e] focus:outline-none focus:border-[#008080] text-sm font-bold w-full"
        />
        <select 
          value={courseFilter} 
          onChange={(e) => setCourseFilter(e.target.value)}
          className="px-4 py-2 bg-[#f5f9f9] border border-[#e0f2f2] text-[#1a2e2e] focus:outline-none focus:border-[#008080] text-sm font-bold w-full md:w-auto uppercase"
        >
          <option value="">All Courses</option>
          {uniqueCourses.map((c: any) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select 
          value={batchFilter} 
          onChange={(e) => setBatchFilter(e.target.value)}
          className="px-4 py-2 bg-[#f5f9f9] border border-[#e0f2f2] text-[#1a2e2e] focus:outline-none focus:border-[#008080] text-sm font-bold w-full md:w-auto uppercase"
        >
          <option value="">All Batches</option>
          {uniqueBatches.map((b: any) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="bg-white border-2 border-[#b2d8d8] overflow-hidden">
        {loading ? (
          <table className="w-full animate-pulse">
            <thead>
              <tr className="bg-[#008080]/10">
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-[#e0f2f2]">
                  <td className="px-6 py-4"><div className="h-4 bg-[#f5f9f9] rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-[#f5f9f9] rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-[#f5f9f9] rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-[#f5f9f9] rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-[#1a2e2e] font-bold text-lg uppercase">No students yet</h3>
            <p className="text-[#555555] mt-1 text-sm">Add students individually or import via CSV</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#f5f9f9] border-b border-[#e0f2f2]">
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Roll No.</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Course</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Batch</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Session</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">DOB</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#555555] font-medium">
                    No students match your search criteria.
                  </td>
                </tr>
              ) : filteredStudents.map((s) => (
                <tr key={s.id} className="border-b border-[#e0f2f2] hover:bg-[#f5f9f9]/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 bg-[#f5f9f9] border border-[#e0f2f2] text-[#008080] text-xs font-mono font-bold rounded-lg">{s.roll_number}</span>
                  </td>
                  <td className="px-6 py-4 text-[#1a2e2e] font-medium">{s.full_name}</td>
                  <td className="px-6 py-4 text-[#555555] text-sm">
                    <span className="bg-[#e0f2f2] text-[#008080] px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">{s.course}</span>
                  </td>
                  <td className="px-6 py-4 text-[#555555] text-sm">{s.batch}</td>
                  <td className="px-6 py-4 text-[#555555] text-sm">{s.session}</td>
                  <td className="px-6 py-4 text-[#555555] text-sm">{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-center flex justify-center gap-2">
                    <button onClick={() => {
                      setName(s.full_name || '');
                      setRollNumber(s.roll_number || '');
                      setDob(s.date_of_birth || '');
                      setCourse(s.course || 'General');
                      setBatch(s.batch || 'Main');
                      setSessionVal(s.session || defaultSession);
                      setEditStudentId(s.id);
                      setShowModal(true);
                    }} className="text-[#008080] hover:text-[#005555] text-xs font-bold px-2 py-1 rounded hover:bg-[#e0f2f2] transition-colors">Edit</button>
                    <button onClick={() => setDeleteStudentId(s.id)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded hover:bg-red-50 transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => { setShowModal(false); setEditStudentId(null); }}>
          <div className="bg-white border-2 border-[#008080] shadow-[4px_4px_0px_#004d4d] p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#008080] -mx-6 -mt-6 mb-5 px-6 py-3">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-widest">{editStudentId ? 'Edit Student' : 'Add Student'}</h3>
            </div>
            <form onSubmit={editStudentId ? handleEditStudent : handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:bg-white transition-all text-sm"
                  placeholder="Aarav Patel" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">Roll Number</label>
                <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required
                  className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:bg-white transition-all text-sm"
                  placeholder="2024001" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">Date of Birth</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required
                  className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:bg-white transition-all text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">Course</label>
                <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} required
                  className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:bg-white transition-all text-sm"
                  placeholder="e.g. JEE" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">Batch</label>
                <input type="text" value={batch} onChange={(e) => setBatch(e.target.value)} required
                  className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:bg-white transition-all text-sm"
                  placeholder="e.g. Main" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">Session</label>
                <input type="text" value={sessionVal} onChange={(e) => setSessionVal(e.target.value)} required
                  className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:bg-white transition-all text-sm"
                  placeholder="e.g. 2024-25" />
              </div>
              <p className="text-[#8aacac] text-xs">Password will be DOB in DDMMYYYY format</p>
              {error && <div className="border border-red-400 bg-red-50 p-3 text-red-600 text-sm">⚠ {error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-3 bg-[#008080] hover:bg-[#006666] text-white font-bold disabled:opacity-50 border-b-2 border-[#004d4d] uppercase tracking-wider text-sm">
                  {formLoading ? (editStudentId ? 'Saving...' : 'Adding...') : (editStudentId ? 'Save Changes' : 'Add Student')}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setEditStudentId(null); }}
                  className="px-4 py-3 bg-white border-2 border-[#b2d8d8] text-[#1a2e2e] font-bold hover:border-[#008080] transition-colors uppercase text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowImportModal(false)}>
          <div className="bg-white border-2 border-[#008080] shadow-[4px_4px_0px_#004d4d] p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#008080] -mx-6 -mt-6 mb-5 px-6 py-3">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-widest">Import Students via CSV</h3>
            </div>
            <div className="bg-[#f5f9f9] border border-[#b2d8d8] p-4 mb-4">
              <p className="text-[#1a2e2e] text-sm font-bold mb-2 uppercase tracking-wide">CSV Format:</p>
              <code className="text-xs text-[#008080] bg-white px-3 py-2 block border border-[#b2d8d8] font-mono">
                name, roll_number, dob<br />
                Aarav Patel, 2024001, 15/06/2005<br />
                Priya Singh, 2024002, 22/03/2005
              </code>
            </div>
            <form onSubmit={handleCsvImport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">Select CSV File</label>
                <input type="file" ref={fileInputRef} accept=".csv,.txt" required
                  className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] file:mr-4 file:py-1 file:px-3 file:border-0 file:bg-[#008080] file:text-white file:text-sm file:font-bold file:uppercase" />
              </div>
              {error && <div className="border border-red-400 bg-red-50 p-3 text-red-600 text-sm">⚠ {error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-3 bg-[#008080] hover:bg-[#006666] text-white font-bold disabled:opacity-50 border-b-2 border-[#004d4d] uppercase tracking-wider text-sm">
                  {formLoading ? 'Importing...' : 'Import'}
                </button>
                <button type="button" onClick={() => setShowImportModal(false)}
                  className="px-4 py-3 bg-white border-2 border-[#b2d8d8] text-[#1a2e2e] font-bold hover:border-[#008080] transition-colors uppercase text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteStudentId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setDeleteStudentId(null)}>
          <div className="bg-white border-2 border-red-500 shadow-[4px_4px_0px_#ef4444] p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <h3 className="text-lg font-extrabold text-[#1a2e2e] uppercase tracking-widest mb-2">Delete Student?</h3>
              <p className="text-sm text-[#555555]">This action cannot be undone. Are you sure you want to delete this student?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteStudentId(null)}
                className="flex-1 px-4 py-3 bg-white border-2 border-[#b2d8d8] text-[#1a2e2e] font-bold hover:border-[#008080] transition-colors uppercase text-sm">
                Cancel
              </button>
              <button onClick={handleDeleteStudent}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold border-b-2 border-red-700 uppercase tracking-wider text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentsPage() {
  return <StudentsListContent />;
}
