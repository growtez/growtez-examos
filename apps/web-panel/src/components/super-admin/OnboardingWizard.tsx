'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  School, 
  User, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Check
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

const steps = [
  { id: 1, title: 'School Details', icon: School, description: 'Basic information' },
  { id: 2, title: 'Administrator', icon: User, description: 'Primary admin account' },
  { id: 3, title: 'Credits', icon: CreditCard, description: 'Exam credits balance' },
  { id: 4, title: 'Initial Exam', icon: FileText, description: 'Default template' },
];

export function OnboardingWizard() {
  const router = useRouter();
  const supabase = createClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [createdSchoolId, setCreatedSchoolId] = useState('');

  const [formData, setFormData] = useState({
    schoolName: '',
    domain: '',
    maxStudents: 500,
    contactEmail: '',
    contactPhone: '',
    
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    
    credits: 100,
    
    examTitle: 'Mid-Term Examination Template',
    examDuration: 60,
    examMarks: 100
  });

  const updateForm = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(c => c + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // 1. Create School
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert({
          name: formData.schoolName,
          domain: formData.domain || null,
          max_students: formData.maxStudents,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          exam_credits_balance: formData.credits,
          is_active: true
        })
        .select()
        .single();

      if (schoolError || !school) {
        throw new Error(`Failed to create school: ${schoolError?.message}`);
      }

      setCreatedSchoolId(school.id);

      // 2. Create Admin User
      const userRes = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.adminEmail,
          password: formData.adminPassword,
          full_name: formData.adminName,
          role: 'school_admin',
          school_id: school.id
        })
      });
      const userData = await userRes.json();
      
      if (!userRes.ok) {
        throw new Error(`Failed to create admin: ${userData.error}`);
      }

      // Add to school_admins table (if needed, usually handled by trigger, but we'll do it to be safe)
      await supabase.from('school_admins').insert({
        id: userData.user.id,
        school_id: school.id,
        email: formData.adminEmail,
        full_name: formData.adminName,
      });

      // 3. Create Initial Exam Template
      const { error: examError } = await supabase
        .from('exams')
        .insert({
          school_id: school.id,
          title: formData.examTitle,
          duration_minutes: formData.examDuration,
          total_marks: formData.examMarks,
          status: 'draft'
        });

      if (examError) {
        throw new Error(`Failed to create exam template: ${examError.message}`);
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during onboarding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8 border-accent-primary/20 bg-accent-primary/5 shadow-xl">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-text-main mb-2">School Onboarded!</h2>
          <p className="text-text-muted mb-8 max-w-md">
            {formData.schoolName} has been successfully created along with its administrator account and initial exam template.
          </p>
          <button
            onClick={() => router.push(`/schools/${createdSchoolId}`)}
            className="px-6 py-3 rounded-xl bg-accent-primary text-white font-bold hover:bg-accent-hover transition-colors shadow-lg shadow-accent-primary/25"
          >
            Go to School Dashboard
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-main">Onboard a new school</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
        {/* Left Vertical Stepper */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-8 relative">
          <div className="absolute left-[23px] top-[24px] bottom-[24px] w-[2px] bg-border z-0 hidden md:block" />
          
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div 
                key={step.id} 
                className={`relative z-10 flex flex-row items-center gap-4 transition-all duration-300 ${isActive ? 'translate-x-2' : ''}`}
              >
                <div 
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm border ${
                    isActive 
                      ? 'bg-accent-primary text-white border-accent-primary shadow-accent-primary/30 scale-110' 
                      : isCompleted
                        ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
                        : 'bg-surface text-text-muted border-border'
                  }`}
                >
                  {isCompleted ? <Check size={20} /> : <span className="font-bold text-sm">{step.id}</span>}
                </div>
                <div className="flex flex-col">
                  <span className={`text-[14px] font-bold ${isActive || isCompleted ? 'text-text-main' : 'text-text-muted'}`}>
                    {step.title}
                  </span>
                  <span className="text-[12px] text-text-muted opacity-80">{step.description}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Form Content */}
        <div className="flex-1 w-full">
          {error && (
            <div className="p-3 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
              {error}
            </div>
          )}
          
          <Card className="shadow-lg border-border/60 bg-surface">
            <CardContent className="p-5 md:p-7">
          
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-text-main mb-1">School Details</h3>
                <p className="text-sm text-text-muted">Enter the basic information for the new school.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-text-main">School Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.schoolName}
                    onChange={e => updateForm('schoolName', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all text-sm"
                    placeholder="e.g. Springfield High School"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-main">Custom Domain</label>
                  <input 
                    type="text" 
                    value={formData.domain}
                    onChange={e => updateForm('domain', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all text-sm"
                    placeholder="springfield.edu"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-main">Max Students</label>
                  <input 
                    type="number" 
                    value={formData.maxStudents}
                    onChange={e => updateForm('maxStudents', parseInt(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-main">Contact Email <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    value={formData.contactEmail}
                    onChange={e => updateForm('contactEmail', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all text-sm"
                    placeholder="admin@springfield.edu"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-main">Contact Phone</label>
                  <input 
                    type="tel" 
                    value={formData.contactPhone}
                    onChange={e => updateForm('contactPhone', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all text-sm"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-text-main mb-1">Administrator Account</h3>
                <p className="text-sm text-text-muted">Create the primary admin user who will manage this school.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-main">Admin Full Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.adminName}
                    onChange={e => updateForm('adminName', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all text-sm"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-main">Admin Email <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    value={formData.adminEmail}
                    onChange={e => updateForm('adminEmail', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all text-sm"
                    placeholder="john@springfield.edu"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-main">Temporary Password <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.adminPassword}
                    onChange={e => updateForm('adminPassword', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all text-sm"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-text-main mb-1">Credits Allocation</h3>
                <p className="text-sm text-text-muted">Set the initial exam credits available to this school.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-main">Exam Credits Balance</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={formData.credits}
                      onChange={e => updateForm('credits', parseInt(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all text-lg font-bold"
                    />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary" size={20} />
                  </div>
                  <p className="text-xs text-text-muted mt-2">1 credit allows 1 student to take 1 exam.</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-text-main mb-1">Initial Exam Template</h3>
                <p className="text-sm text-text-muted">Create a default draft exam to help the school get started quickly.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-main">Exam Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.examTitle}
                    onChange={e => updateForm('examTitle', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-text-main">Duration (mins)</label>
                    <input 
                      type="number" 
                      value={formData.examDuration}
                      onChange={e => updateForm('examDuration', parseInt(e.target.value))}
                      className="w-full px-4 py-2 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-text-main">Total Marks</label>
                    <input 
                      type="number" 
                      value={formData.examMarks}
                      onChange={e => updateForm('examMarks', parseInt(e.target.value))}
                      className="w-full px-4 py-2 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-colors ${
                currentStep === 1 
                  ? 'opacity-0 pointer-events-none' 
                  : 'text-text-muted hover:bg-surface-hover hover:text-text-main bg-transparent border-none cursor-pointer'
              }`}
            >
              <ChevronLeft size={18} /> Back
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && (!formData.schoolName || !formData.contactEmail)) ||
                  (currentStep === 2 && (!formData.adminName || !formData.adminEmail || !formData.adminPassword))
                }
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-accent-primary text-white font-bold hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
              >
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.examTitle}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer"
              >
                {isSubmitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Provisioning...</>
                ) : (
                  <><CheckCircle2 size={18} /> Complete Onboarding</>
                )}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</div>
  );
}
