'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [dob, setDob] = useState('');

  const supabase = createClient();

  const fetchStudents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
    if (!profile?.school_id) return;
    setSchoolId(profile.school_id);

    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('roll_number', { ascending: true });

    setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const formatDobPassword = (dateStr: string) => {
    // Convert YYYY-MM-DD to DDMMYYYY
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

      // Create student via API route to preserve admin session
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
          date_of_birth: dob
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add student');

      setShowModal(false);
      setName(''); setRollNumber(''); setDob('');
      fetchStudents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
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

      // Skip header row
      const header = lines[0].toLowerCase();
      const hasHeader = header.includes('name') || header.includes('roll');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      let imported = 0;
      let errors: string[] = [];

      for (const line of dataLines) {
        const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));
        if (cols.length < 3) continue;

        const [studentName, studentRoll, studentDob] = cols;
        if (!studentName || !studentRoll || !studentDob) continue;

        // Parse DOB - support DD/MM/YYYY or YYYY-MM-DD
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
              date_of_birth: formattedDob
            })
          });

          const data = await res.json();
          if (res.ok) {
            imported++;
          } else {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Students</h2>
          <p className="text-gray-500 mt-1">Manage your school&apos;s students</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            Import CSV
          </button>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-gray-900 font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Student
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-sm mb-6">{success}</div>
      )}

      {/* Students Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
        <p className="text-gray-500 text-sm">
          <strong className="text-gray-700">Student Login:</strong> Roll number is the user ID, Date of Birth (DDMMYYYY) is the password. Students use the desktop app to take exams.
        </p>
      </div>

      {/* Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-gray-900 font-semibold text-lg">No students yet</h3>
            <p className="text-gray-500 mt-1">Add students individually or import via CSV</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Roll No.</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">DOB</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Added</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-mono">{s.roll_number}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{s.full_name}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Student</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="Aarav Patel" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Roll Number</label>
                <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="2024001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
              </div>
              <p className="text-gray-400 text-xs">Password will be DOB in DDMMYYYY format</p>
              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-gray-900 font-medium rounded-xl disabled:opacity-50">
                  {formLoading ? 'Adding...' : 'Add Student'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowImportModal(false)}>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Students via CSV</h3>
            <div className="bg-white border border-gray-300 rounded-xl p-4 mb-4">
              <p className="text-gray-700 text-sm font-medium mb-2">CSV Format:</p>
              <code className="text-xs text-indigo-400 bg-gray-50 px-3 py-2 rounded-lg block">
                name, roll_number, dob<br />
                Aarav Patel, 2024001, 15/06/2005<br />
                Priya Singh, 2024002, 22/03/2005
              </code>
            </div>
            <form onSubmit={handleCsvImport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select CSV File</label>
                <input type="file" ref={fileInputRef} accept=".csv,.txt" required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:text-indigo-400 file:text-sm file:font-medium" />
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-gray-900 font-medium rounded-xl disabled:opacity-50">
                  {formLoading ? 'Importing...' : 'Import'}
                </button>
                <button type="button" onClick={() => setShowImportModal(false)}
                  className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
