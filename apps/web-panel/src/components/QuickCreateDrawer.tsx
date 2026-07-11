'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, UserPlus, School, Eye, EyeOff, FileText } from 'lucide-react';
import type { ExamPrefill } from '@/app/super-admin/DrawerContext';

interface QuickCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeForm: 'school' | 'user' | 'exam' | 'template';
  setActiveForm: (form: 'school' | 'user' | 'exam' | 'template') => void;
  onRefresh?: () => void;
  examPrefill?: ExamPrefill;
}

export default function QuickCreateDrawer({ isOpen, onClose, activeForm, setActiveForm, onRefresh, examPrefill }: QuickCreateDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User Form State
  const [userFormData, setUserFormData] = useState({ email: '', password: '', role: 'student', schoolId: '' });
  const [schools, setSchools] = useState<any[]>([]);
  
  // School Form State
  const [schoolFormData, setSchoolFormData] = useState({ 
    name: '', 
    domain: '', 
    contact_email: '', 
    contact_phone: '', 
    admin_name: '',
    admin_email: '',
    admin_password: 'Password@123' 
  });
  const [showPassword, setShowPassword] = useState(true);

  // Exam Form State
  const [examFormData, setExamFormData] = useState<{
    title: string;
    description: string;
    durationMinutes: number | '';
    schoolId: string;
    mcqCorrect: number | '';
    mcqWrong: number | '';
    natCorrect: number | '';
    natWrong: number | '';
  }>({
    title: '',
    description: '',
    durationMinutes: '',
    schoolId: '',
    mcqCorrect: '',
    mcqWrong: '',
    natCorrect: '',
    natWrong: '',
  });
  const [examSubjects, setExamSubjects] = useState<Array<{ name: string; questionCount: number | '' }>>([{ name: '', questionCount: '' }]);

  const addExamSubject = () => setExamSubjects(s => [...s, { name: '', questionCount: '' }]);
  const removeExamSubject = (i: number) => setExamSubjects(s => s.filter((_, idx) => idx !== i));
  const updateExamSubject = (i: number, field: string, value: any) => {
    setExamSubjects(s => { const u = [...s]; (u[i] as any)[field] = value; return u; });
  };

  const roleOptions = [
    { value: 'school_admin', label: 'School Admin' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'student', label: 'Student' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchSchools();
      setError(null);
    }
  }, [isOpen]);

  // Apply prefill data when exam drawer opens with a template or reset if custom
  useEffect(() => {
    if (activeForm === 'exam' && isOpen) {
      if (examPrefill && Object.keys(examPrefill).length > 0) {
        setExamFormData(prev => ({
          ...prev,
          title: examPrefill.title ?? prev.title,
          description: examPrefill.description ?? prev.description,
          durationMinutes: examPrefill.durationMinutes ?? prev.durationMinutes,
          mcqCorrect: examPrefill.mcqCorrect ?? prev.mcqCorrect,
          mcqWrong: examPrefill.mcqWrong ?? prev.mcqWrong,
          natCorrect: examPrefill.natCorrect ?? prev.natCorrect,
          natWrong: examPrefill.natWrong ?? prev.natWrong,
        }));
        if (examPrefill.subjects) setExamSubjects(examPrefill.subjects);
      } else {
        // Reset for "Create Custom" or blank form
        setExamFormData(prev => ({
          title: '',
          description: '',
          durationMinutes: '',
          schoolId: prev.schoolId, // preserve selected school if any
          mcqCorrect: '',
          mcqWrong: '',
          natCorrect: '',
          natWrong: '',
        }));
        setExamSubjects([{ name: '', questionCount: '' }]);
      }
    }
  }, [examPrefill, activeForm, isOpen]);

  const fetchSchools = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setSchools(data || []);
    } catch (err) {
      console.error('Failed to fetch schools:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userFormData.email,
          password: userFormData.password,
          full_name: '',
          role: userFormData.role,
          school_id: userFormData.schoolId || null,
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      onRefresh && onRefresh();
      setUserFormData({ email: '', password: '', role: 'student', schoolId: '' });
      onClose();
    } catch (err: any) {
      setError('Failed to create user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    try {
      // 1. Create the school
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert({
          name: schoolFormData.name.trim(),
          domain: schoolFormData.domain.trim() || null,
          contact_email: schoolFormData.contact_email.trim() || null,
          contact_phone: schoolFormData.contact_phone.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (schoolError) throw schoolError;

      // 2. Create the school admin auth user
      if (schoolFormData.admin_email && schoolFormData.admin_password) {
        const res = await fetch('/api/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: schoolFormData.admin_email,
            password: schoolFormData.admin_password,
            full_name: schoolFormData.admin_name,
            role: 'school_admin',
            school_id: school.id,
          })
        });

        const result = await res.json();
        if (!res.ok) {
          await supabase.from('schools').delete().eq('id', school.id);
          throw new Error(result.error || 'Unknown error. School creation was aborted.');
        }
      }

      onRefresh && onRefresh();
      setSchoolFormData({ 
        name: '', 
        domain: '', 
        contact_email: '', 
        contact_phone: '', 
        admin_name: '',
        admin_email: '',
        admin_password: 'Password@123' 
      });
      onClose();
    } catch (err: any) {
      setError('Failed to create school: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (!examFormData.schoolId) throw new Error('Please select a school for the exam');

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          school_id: examFormData.schoolId,
          title: examFormData.title.trim(),
          description: examFormData.description.trim() || null,
          duration_minutes: examFormData.durationMinutes,
          status: 'draft',
          marking_scheme: {
            mcq_correct: examFormData.mcqCorrect,
            mcq_wrong: examFormData.mcqWrong,
            nat_correct: examFormData.natCorrect,
            nat_wrong: examFormData.natWrong,
          },
          created_by: user?.id,
        })
        .select()
        .single();

      if (examError) throw examError;

      // Create subjects
      const validSubjects = examSubjects.filter(s => s.name.trim());
      for (let i = 0; i < validSubjects.length; i++) {
        await supabase.from('exam_subjects').insert({
          exam_id: exam.id,
          subject_name: validSubjects[i].name.trim(),
          question_count: validSubjects[i].questionCount,
          sort_order: i,
        });
      }

      onRefresh && onRefresh();
      setExamFormData({
        title: '',
        description: '',
        durationMinutes: '',
        schoolId: '',
        mcqCorrect: '',
        mcqWrong: '',
        natCorrect: '',
        natWrong: '',
      });
      setExamSubjects([{ name: '', questionCount: '' }]);
      onClose();
    } catch (err: any) {
      setError('Failed to create exam: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    try {
      const { data: template, error: templateError } = await supabase
        .from('exam_templates')
        .insert({
          title: examFormData.title.trim(),
          description: examFormData.description.trim() || null,
          duration_minutes: examFormData.durationMinutes,
          marking_scheme: {
            mcq_correct: examFormData.mcqCorrect,
            mcq_wrong: examFormData.mcqWrong,
            nat_correct: examFormData.natCorrect,
            nat_wrong: examFormData.natWrong,
          },
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create template subjects
      const validSubjects = examSubjects.filter(s => s.name.trim());
      for (let i = 0; i < validSubjects.length; i++) {
        await supabase.from('exam_template_subjects').insert({
          template_id: template.id,
          subject_name: validSubjects[i].name.trim(),
          question_count: validSubjects[i].questionCount,
          sort_order: i,
        });
      }

      onRefresh && onRefresh();
      setExamFormData({
        title: '',
        description: '',
        durationMinutes: '',
        schoolId: '',
        mcqCorrect: '',
        mcqWrong: '',
        natCorrect: '',
        natWrong: '',
      });
      setExamSubjects([{ name: '', questionCount: '' }]);
      onClose();
    } catch (err: any) {
      setError('Failed to create template: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    if (activeForm === 'school') {
      handleCreateSchool(e);
    } else if (activeForm === 'user') {
      handleCreateUser(e);
    } else if (activeForm === 'template') {
      handleCreateTemplate(e);
    } else {
      handleCreateExam(e);
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      <div className={`fixed top-0 right-0 h-[100dvh] w-full max-w-[450px] bg-bg z-[1001] transition-transform duration-500 shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface">
          <div className="flex items-center gap-3">
            {activeForm === 'user' && <UserPlus size={20} className="text-accent-primary" />}
            {activeForm === 'school' && <School size={20} className="text-accent-primary" />}
            {activeForm === 'exam' && <FileText size={20} className="text-accent-primary" />}
            {activeForm === 'template' && <FileText size={20} className="text-accent-primary" />}
            <h3 className="text-lg font-semibold m-0 text-text-main">
              {activeForm === 'user' && 'Add New User'}
              {activeForm === 'school' && 'Onboard School'}
              {activeForm === 'exam' && 'Create Exam'}
              {activeForm === 'template' && 'Create Exam'}
            </h3>
          </div>
          <button className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-muted transition-all hover:bg-border hover:text-text-main hover:rotate-90 border-none cursor-pointer" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          <div className="flex bg-surface-hover p-1 rounded-lg mb-8 border border-slate-300 dark:border-zinc-700 gap-1">
            <button
              className={`flex-1 p-2 rounded text-sm font-semibold transition-all border-none cursor-pointer ${activeForm === 'school' ? 'bg-accent-primary text-white shadow-sm' : 'bg-transparent text-text-muted hover:bg-surface hover:text-text-main'}`}
              onClick={() => setActiveForm('school')}
            >
              School
            </button>
            <button
              className={`flex-1 p-2 rounded text-sm font-semibold transition-all border-none cursor-pointer ${activeForm === 'user' ? 'bg-accent-primary text-white shadow-sm' : 'bg-transparent text-text-muted hover:bg-surface hover:text-text-main'}`}
              onClick={() => setActiveForm('user')}
            >
              User
            </button>
            <button
              className={`flex-1 p-2 rounded text-sm font-semibold transition-all border-none cursor-pointer ${activeForm === 'exam' ? 'bg-accent-primary text-white shadow-sm' : 'bg-transparent text-text-muted hover:bg-surface hover:text-text-main'}`}
              onClick={() => setActiveForm('exam')}
            >
              Exam
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col gap-5 pb-24">
            {activeForm === 'user' && (
              <>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    required
                    className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                  />
                  <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Email Address</label>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    required
                    className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                  />
                  <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Password</label>
                </div>
                <div className="relative">
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    required
                    className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
                  >
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 transition-colors peer-focus:text-accent-primary pointer-events-none">System Role</label>
                </div>

                {['school_admin', 'teacher', 'student'].includes(userFormData.role) && (
                  <div className="relative">
                    <select
                      value={userFormData.schoolId}
                      onChange={(e) => setUserFormData({ ...userFormData, schoolId: e.target.value })}
                      required
                      className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
                    >
                      <option value="">Select School</option>
                      {schools.map(sch => (
                        <option key={sch.id} value={sch.id}>{sch.name}</option>
                      ))}
                    </select>
                    <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 transition-colors peer-focus:text-accent-primary pointer-events-none">School Assignment</label>
                  </div>
                )}
              </>
            )}

            {activeForm === 'school' && (
              <>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Springfield High"
                    value={schoolFormData.name}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, name: e.target.value })}
                    required
                    className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                  />
                  <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">School Name</label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="springfield.edu"
                    value={schoolFormData.domain}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, domain: e.target.value })}
                    className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                  />
                  <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Domain (Optional)</label>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="contact@school.edu"
                    value={schoolFormData.contact_email}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, contact_email: e.target.value })}
                    className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                  />
                  <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Contact Email</label>
                </div>
                
                <h4 className="text-sm font-semibold text-text-main mt-2 border-b border-slate-300 dark:border-zinc-700 pb-1">Admin Account</h4>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Principal Skinner"
                    value={schoolFormData.admin_name}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, admin_name: e.target.value })}
                    required
                    className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                  />
                  <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Admin Name</label>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="admin@school.edu"
                    value={schoolFormData.admin_email}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, admin_email: e.target.value })}
                    required
                    className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                  />
                  <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Admin Email</label>
                </div>
                <div className="relative">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Set login password"
                      value={schoolFormData.admin_password}
                      onChange={(e) => setSchoolFormData({ ...schoolFormData, admin_password: e.target.value })}
                      required
                      className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 pr-10 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                    />
                    <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Admin Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted cursor-pointer p-1.5 flex hover:text-text-main transition-colors z-20"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {(activeForm === 'exam' || activeForm === 'template') && (
              <>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={activeForm === 'template' ? "Template Title" : "JEE Main Mock Test"}
                    value={examFormData.title}
                    onChange={(e) => setExamFormData({ ...examFormData, title: e.target.value })}
                    required
                    className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                  />
                  <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Exam Title *</label>
                </div>
                <div className="relative">
                  <textarea
                    placeholder="Short description of the exam"
                    value={examFormData.description}
                    onChange={(e) => setExamFormData({ ...examFormData, description: e.target.value })}
                    rows={3}
                    className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl p-4 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50 resize-none"
                  />
                  <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Description</label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="180"
                    value={examFormData.durationMinutes}
                    onChange={(e) => setExamFormData({ ...examFormData, durationMinutes: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                    required
                    className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                  />
                  <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Duration (minutes) *</label>
                </div>
                {activeForm === 'exam' && (
                  <div className="relative">
                    <select
                      value={examFormData.schoolId}
                      onChange={(e) => setExamFormData({ ...examFormData, schoolId: e.target.value })}
                      required
                      className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
                    >
                      <option value="">Select School</option>
                      {schools.map(sch => (
                        <option key={sch.id} value={sch.id}>{sch.name}</option>
                      ))}
                    </select>
                    <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 transition-colors peer-focus:text-accent-primary pointer-events-none">School Assignment *</label>
                  </div>
                )}

                {/* Marking Scheme */}
                <h4 className="text-sm font-semibold text-text-main mt-2 border-b border-slate-300 dark:border-zinc-700 pb-1">Default Marking Scheme</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={examFormData.mcqCorrect}
                      onChange={(e) => setExamFormData({ ...examFormData, mcqCorrect: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-11 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                    />
                    <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 pointer-events-none">MCQ Correct</label>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={examFormData.mcqWrong}
                      onChange={(e) => setExamFormData({ ...examFormData, mcqWrong: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-11 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                    />
                    <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 pointer-events-none">MCQ Wrong</label>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={examFormData.natCorrect}
                      onChange={(e) => setExamFormData({ ...examFormData, natCorrect: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-11 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                    />
                    <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 pointer-events-none">NAT Correct</label>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={examFormData.natWrong}
                      onChange={(e) => setExamFormData({ ...examFormData, natWrong: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-11 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                    />
                    <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 pointer-events-none">NAT Wrong</label>
                  </div>
                </div>

                {/* Required Subjects */}
                <div className="flex items-center justify-between mt-2 border-b border-slate-300 dark:border-zinc-700 pb-1">
                  <h4 className="text-sm font-semibold text-text-main">Required Subjects</h4>
                  <button
                    type="button"
                    onClick={addExamSubject}
                    className="text-[11px] font-bold text-accent-primary hover:text-accent-primary/80 uppercase tracking-wider bg-transparent border-none cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-4">
                  {examSubjects.map((subject, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="e.g. Physics"
                          value={subject.name}
                          onChange={(e) => updateExamSubject(idx, 'name', e.target.value)}
                          className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-3 h-11 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                        />
                        <label className="absolute left-2.5 px-1 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3 peer-placeholder-shown:text-xs peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Subject Name</label>
                      </div>
                      <div className="relative w-24">
                        <input
                          type="number"
                          placeholder="10"
                          value={subject.questionCount}
                          min={1}
                          onChange={(e) => updateExamSubject(idx, 'questionCount', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                          className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-3 h-11 text-sm text-text-main text-center focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                        />
                        <label className="absolute left-2.5 px-1 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3 peer-placeholder-shown:text-xs peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Questions</label>
                      </div>
                      {examSubjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExamSubject(idx)}
                          className="mt-2.5 text-red-400 hover:text-red-500 bg-transparent border-none cursor-pointer text-sm font-bold shrink-0"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm mt-4 mb-2">
                {error}
              </div>
            )}

            <button type="submit" className="mt-auto w-full h-12 flex items-center justify-center gap-2 bg-accent-primary text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(5,150,105,0.15)] hover:shadow-[0_6px_25px_rgba(5,150,105,0.25)] transition-all border-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {activeForm === 'user' && <UserPlus size={18} />}
                  {activeForm === 'school' && <School size={18} />}
                  {activeForm === 'exam' && <FileText size={18} />}
                  {activeForm === 'user' && 'Add User Account'}
                  {activeForm === 'school' && 'Onboard School'}
                  {activeForm === 'exam' && 'Create Exam'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
