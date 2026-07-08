'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, UserPlus, School, Eye, EyeOff } from 'lucide-react';

interface QuickCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeForm: 'school' | 'user';
  setActiveForm: (form: 'school' | 'user') => void;
  onRefresh?: () => void;
}

export default function QuickCreateDrawer({ isOpen, onClose, activeForm, setActiveForm, onRefresh }: QuickCreateDrawerProps) {
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
    max_students: 500,
    admin_name: '',
    admin_email: '',
    admin_password: 'Password@123' 
  });
  const [showPassword, setShowPassword] = useState(true);

  const roleOptions = [
    { value: 'school_admin', label: 'School Admin' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'student', label: 'Student' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchSchools();
      // Reset forms on open
      setUserFormData({ email: '', password: '', role: 'student', schoolId: '' });
      setSchoolFormData({ 
        name: '', 
        domain: '', 
        contact_email: '', 
        contact_phone: '', 
        max_students: 500,
        admin_name: '',
        admin_email: '',
        admin_password: 'Password@123' 
      });
      setError(null);
    }
  }, [isOpen]);

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
          full_name: '', // We don't have a name field in this quick form
          role: userFormData.role,
          school_id: userFormData.schoolId || null,
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      onRefresh && onRefresh();
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
          max_students: schoolFormData.max_students,
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
          throw new Error('School created, but admin failed: ' + (result.error || 'Unknown error'));
        }
      }

      onRefresh && onRefresh();
      onClose();
    } catch (err: any) {
      setError('Failed to create school: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      <div className={`fixed top-0 right-0 h-screen w-full max-w-[450px] bg-bg z-[1001] transition-transform duration-500 shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface">
          <div className="flex items-center gap-3">
            {activeForm === 'user' ? <UserPlus size={20} className="text-accent-primary" /> : <School size={20} className="text-accent-primary" />}
            <h3 className="text-lg font-semibold m-0 text-text-main">{activeForm === 'user' ? 'Add New User' : 'Onboard School'}</h3>
          </div>
          <button className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-muted transition-all hover:bg-border hover:text-text-main hover:rotate-90 border-none cursor-pointer" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          <div className="flex bg-surface-hover p-1 rounded-lg mb-8 border border-border">
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
              User Account
            </button>
          </div>

          <form onSubmit={activeForm === 'user' ? handleCreateUser : handleCreateSchool} className="flex-1 flex flex-col gap-5">
            {activeForm === 'user' ? (
              <>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    required
                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
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
                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                  />
                  <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Password</label>
                </div>
                <div className="relative">
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    required
                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
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
                      className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
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
            ) : (
              <>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Springfield High"
                    value={schoolFormData.name}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, name: e.target.value })}
                    required
                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                  />
                  <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">School Name</label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="springfield.edu"
                    value={schoolFormData.domain}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, domain: e.target.value })}
                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                  />
                  <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Domain (Optional)</label>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="contact@school.edu"
                    value={schoolFormData.contact_email}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, contact_email: e.target.value })}
                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                  />
                  <label className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Contact Email</label>
                </div>
                
                <h4 className="text-sm font-semibold text-text-main mt-2 border-b border-border pb-1">Admin Account</h4>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Principal Skinner"
                    value={schoolFormData.admin_name}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, admin_name: e.target.value })}
                    required
                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
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
                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
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
                      className="peer w-full bg-surface-hover border border-border rounded-xl px-4 pr-10 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
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
                  {activeForm === 'user' ? <UserPlus size={18} /> : <School size={18} />}
                  {activeForm === 'user' ? 'Add User Account' : 'Onboard School'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
