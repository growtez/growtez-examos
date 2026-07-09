'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

const steps = [
  { id: 1, title: 'School Details' },
  { id: 2, title: 'Administrator' },
  { id: 3, title: 'Initial Exam' },
];

export function OnboardingWizard({ className, resumeSchoolId }: { className?: string; resumeSchoolId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [createdSchoolId, setCreatedSchoolId] = useState('');
  const [existingExams, setExistingExams] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');

  useEffect(() => {
    async function fetchExams() {
      try {
        const { data } = await supabase
          .from('exams')
          .select('id, title, duration_minutes, total_marks, schools(name)')
          .limit(20);
        setExistingExams(data || []);
      } catch (err) {
        console.error('Failed to fetch existing exams', err);
      }
    }
    fetchExams();
  }, []);

  useEffect(() => {
    if (!resumeSchoolId) return;

    async function loadPartialSchool() {
      setError('');
      setIsSubmitting(true);
      try {
        const { data: school, error: schoolErr } = await supabase
          .from('schools')
          .select('*, school_admins(*)')
          .eq('id', resumeSchoolId)
          .single();

        if (schoolErr) throw schoolErr;
        if (!school) throw new Error('School not found.');

        setCreatedSchoolId(school.id);

        const hasAdmin = school.school_admins && school.school_admins.length > 0;
        const admin = hasAdmin ? school.school_admins[0] : null;

        setFormData(prev => ({
          ...prev,
          schoolName: school.name || '',
          domain: school.domain || '',
          maxStudents: school.max_students ?? 500,
          contactEmail: school.contact_email || '',
          contactPhone: school.contact_phone || '',
          adminName: admin ? admin.full_name || '' : '',
          adminEmail: admin ? admin.email || '' : '',
        }));

        if (!hasAdmin) {
          setCurrentStep(2);
        } else {
          setCurrentStep(3);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load school.');
      } finally {
        setIsSubmitting(false);
      }
    }

    loadPartialSchool();
  }, [resumeSchoolId]);

  const [formData, setFormData] = useState({
    schoolName: '',
    domain: '',
    maxStudents: 500,
    contactEmail: '',
    contactPhone: '',
    
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    
    examTitle: 'Mid-Term Exam Template',
    examDuration: 60,
    examMarks: 100
  });

  const updateForm = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId === 'custom') {
      setFormData(prev => ({
        ...prev,
        examTitle: 'Mid-Term Exam Template',
        examDuration: 60,
        examMarks: 100
      }));
    } else {
      const selected = existingExams.find(e => e.id === templateId);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          examTitle: selected.title,
          examDuration: selected.duration_minutes,
          examMarks: selected.total_marks
        }));
      }
    }
  };

  const handleNext = () => {
    const stepToSave = currentStep;
    
    // Transition to the next step instantly
    setCurrentStep(c => c + 1);
    
    setError('');
    setIsSubmitting(true);
    
    // Perform saving in the background
    (async () => {
      try {
        if (stepToSave === 1) {
          // Create or update school record
          if (!createdSchoolId) {
            const { data: school, error: schoolError } = await supabase
              .from('schools')
              .insert({
                name: formData.schoolName,
                domain: formData.domain || null,
                max_students: formData.maxStudents,
                contact_email: formData.contactEmail,
                contact_phone: formData.contactPhone,
                exam_credits_balance: 100, // Default exam credits balance
                is_active: true
              })
              .select()
              .single();

            if (schoolError || !school) throw new Error(schoolError?.message || 'Failed to create school');
            setCreatedSchoolId(school.id);
          } else {
            const { error: schoolError } = await supabase
              .from('schools')
              .update({
                name: formData.schoolName,
                domain: formData.domain || null,
                max_students: formData.maxStudents,
                contact_email: formData.contactEmail,
                contact_phone: formData.contactPhone,
              })
              .eq('id', createdSchoolId);

            if (schoolError) throw new Error(schoolError.message);
          }
        } else if (stepToSave === 2) {
          // Check if school admin already exists for this school
          const { data: existingAdmin } = await supabase
            .from('school_admins')
            .select('id, email')
            .eq('school_id', createdSchoolId)
            .maybeSingle();

          if (existingAdmin && existingAdmin.email === formData.adminEmail) {
            // Admin already created with this email, skip creation and update the name if needed
            const { error: updateError } = await supabase
              .from('school_admins')
              .update({ full_name: formData.adminName })
              .eq('id', existingAdmin.id);

            if (updateError) throw new Error(updateError.message);
          } else {
            // Create Admin User
            const userRes = await fetch('/api/users/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: formData.adminEmail,
                password: formData.adminPassword,
                full_name: formData.adminName,
                role: 'school_admin',
                school_id: createdSchoolId
              })
            });
            const userData = await userRes.json();
            
            if (!userRes.ok) {
              throw new Error(userData.error || 'Failed to create admin');
            }

            await supabase.from('school_admins').insert({
              id: userData.user.id,
              school_id: createdSchoolId,
              email: formData.adminEmail,
              full_name: formData.adminName,
            });
          }
        }
      } catch (err: any) {
        setError(`Save error on step ${stepToSave}: ${err.message || 'Failed to save'}`);
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Create Initial Exam Template (School and Admin are already created)
      const { error: examError } = await supabase
        .from('exams')
        .insert({
          school_id: createdSchoolId,
          title: formData.examTitle,
          duration_minutes: formData.examDuration,
          total_marks: formData.examMarks,
          status: 'draft'
        });

      if (examError) {
        throw new Error(`Exam: ${examError.message}`);
      }

      router.refresh();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refresh-tables'));
      }
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className={`border-accent-primary/20 bg-accent-primary/5 shadow-md w-full ${className || ''}`}>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-5">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="text-xl font-bold text-text-main mb-2">Onboarded!</h3>
          <p className="text-sm text-text-muted mb-6">
            {formData.schoolName} setup completed successfully.
          </p>
          <button
            onClick={() => router.push(`/schools/${createdSchoolId}`)}
            className="w-full py-2.5 px-4 rounded-xl bg-accent-primary text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            Go to School
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-md border-border bg-surface w-full flex flex-col justify-between ${className || ''}`}>
      <CardContent className="p-6 flex flex-col gap-6 flex-grow justify-between">
        <div>
          <h2 className="text-base font-bold text-text-main">Onboard School</h2>
          <div className="flex items-center justify-between mt-1.5 text-xs text-text-muted">
            <span>Step {currentStep} of 3</span>
            <span className="font-semibold text-accent-primary">{steps[currentStep-1].title}</span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full h-1.5 bg-border rounded-full mt-2.5 overflow-hidden">
            <div 
              className="h-full bg-accent-primary transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
            {error}
          </div>
        )}

        <div className="flex-1 min-h-[190px]">
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in pt-2">
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.schoolName}
                  onChange={e => updateForm('schoolName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm"
                  placeholder="Springfield High"
                />
                <label className="absolute -top-2 left-3 bg-surface px-1 text-[10px] font-semibold text-text-muted">School Name *</label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.maxStudents}
                    onChange={e => updateForm('maxStudents', parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm"
                  />
                  <label className="absolute -top-2 left-3 bg-surface px-1 text-[10px] font-semibold text-text-muted">Approx Students</label>
                </div>
                <div className="relative">
                  <input 
                    type="tel" 
                    value={formData.contactPhone}
                    onChange={e => updateForm('contactPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm"
                    placeholder="9876543210"
                  />
                  <label className="absolute -top-2 left-3 bg-surface px-1 text-[10px] font-semibold text-text-muted">Contact Phone *</label>
                </div>
              </div>

              <div className="relative">
                <input 
                  type="email" 
                  value={formData.contactEmail}
                  onChange={e => updateForm('contactEmail', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm"
                  placeholder="admin@springfield.edu"
                />
                <label className="absolute -top-2 left-3 bg-surface px-1 text-[10px] font-semibold text-text-muted">Contact Email *</label>
              </div>
              
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.domain}
                  onChange={e => updateForm('domain', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm"
                  placeholder="www.springfield.edu"
                />
                <label className="absolute -top-2 left-3 bg-surface px-1 text-[10px] font-semibold text-text-muted">School Website</label>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in pt-2">
              <p className="text-[11px] text-text-muted bg-surface-hover/50 p-2.5 rounded-xl border border-border/30">
                ℹ️ This account will have <strong>School Admin</strong> privileges to manage the school.
              </p>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.adminName}
                  onChange={e => updateForm('adminName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm"
                  placeholder="John Doe"
                />
                <label className="absolute -top-2 left-3 bg-surface px-1 text-[10px] font-semibold text-text-muted">Admin Full Name *</label>
              </div>
              
              <div className="relative">
                <input 
                  type="email" 
                  value={formData.adminEmail}
                  onChange={e => updateForm('adminEmail', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm"
                  placeholder="john@springfield.edu"
                />
                <label className="absolute -top-2 left-3 bg-surface px-1 text-[10px] font-semibold text-text-muted">Admin Email *</label>
              </div>

              <div className="relative">
                <input 
                  type="text" 
                  value={formData.adminPassword}
                  onChange={e => updateForm('adminPassword', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm"
                  placeholder="Min 6 chars"
                />
                <label className="absolute -top-2 left-3 bg-surface px-1 text-[10px] font-semibold text-text-muted">Password *</label>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in pt-2">
              <div className="relative">
                <select
                  value={selectedTemplateId}
                  onChange={e => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm appearance-none cursor-pointer"
                >
                  <option value="custom">Create Custom Exam</option>
                  {existingExams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} ({exam.schools?.name || 'Template'})
                    </option>
                  ))}
                </select>
                <label className="absolute -top-2 left-3 bg-surface px-1 text-[10px] font-semibold text-text-muted">Exam Template Source</label>
              </div>

              <div className="relative">
                <input 
                  type="text" 
                  value={formData.examTitle}
                  onChange={e => updateForm('examTitle', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm"
                />
                <label className="absolute -top-2 left-3 bg-surface px-1 text-[10px] font-semibold text-text-muted">Exam Title *</label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.examDuration}
                    onChange={e => updateForm('examDuration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm"
                  />
                  <label className="absolute -top-2 left-3 bg-surface px-1 text-[10px] font-semibold text-text-muted">Duration (mins)</label>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.examMarks}
                    onChange={e => updateForm('examMarks', parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm"
                  />
                  <label className="absolute -top-2 left-3 bg-surface px-1 text-[10px] font-semibold text-text-muted">Total Marks</label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className={`flex items-center gap-1 text-xs font-bold text-text-muted hover:text-text-main transition-colors ${
              currentStep === 1 ? 'opacity-0 pointer-events-none' : 'cursor-pointer bg-transparent border-none'
            }`}
          >
            <ChevronLeft size={16} /> Back
          </button>
          
          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              disabled={
                isSubmitting ||
                (currentStep === 1 && (!formData.schoolName || !formData.contactEmail || formData.contactPhone.length !== 10)) ||
                (currentStep === 2 && (!formData.adminName || !formData.adminEmail || !formData.adminPassword))
              }
              className="flex items-center gap-1 px-5 py-2 rounded-xl bg-accent-primary text-white text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              {isSubmitting ? (
                <><Loader2 size={14} className="animate-spin" /> Saving...</>
              ) : (
                <>Save & Next <ChevronRight size={16} /></>
              )}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.examTitle}
              className="flex items-center gap-1 px-5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              {isSubmitting ? (
                <><Loader2 size={14} className="animate-spin" /> ...</>
              ) : (
                <>Submit</>
              )}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
