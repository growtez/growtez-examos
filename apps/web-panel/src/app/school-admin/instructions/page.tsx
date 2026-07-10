'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Image as ImageIcon, FileText, CheckCircle2 } from 'lucide-react';

export default function InstructionsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  
  const [instructionText, setInstructionText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: admin } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      if (admin?.school_id) {
        setSchoolId(admin.school_id);
        
        // Fetch existing instructions
        const { data: instr } = await supabase.from('school_instructions').select('*').eq('school_id', admin.school_id).single();
        if (instr) {
          setInstructionText(instr.content_text || '');
          setImageUrl(instr.image_url || '');
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!schoolId) return;
    setSaving(true);
    setSaveSuccess(false);
    
    const supabase = createClient();
    
    // Check if exists
    const { data: existing } = await supabase.from('school_instructions').select('id').eq('school_id', schoolId).single();
    
    if (existing) {
      await supabase.from('school_instructions')
        .update({ content_text: instructionText, image_url: imageUrl, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('school_instructions')
        .insert([{ school_id: schoolId, content_text: instructionText, image_url: imageUrl }]);
    }
    
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a2e2e]">Exam Instructions</h1>
        <p className="text-[#555555] mt-1">Configure the default instructions shown to students before they start an exam on the desktop app.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#e0f2f2] overflow-hidden">
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-40 bg-gray-100 rounded-xl w-full"></div>
              <div className="h-12 bg-gray-100 rounded-xl w-full"></div>
            </div>
          ) : (
            <>
              {/* Text Instructions */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-[#1a2e2e]">
                  <FileText className="w-4 h-4 text-[#008080]" />
                  Instruction Text
                </label>
                <textarea
                  value={instructionText}
                  onChange={(e) => setInstructionText(e.target.value)}
                  placeholder="Enter the instructions for the students. If left empty, default ParikshaOS instructions will be used."
                  className="w-full h-40 p-4 border border-[#e0f2f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080] resize-none text-sm text-[#1a2e2e]"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-[#1a2e2e]">
                  <ImageIcon className="w-4 h-4 text-[#008080]" />
                  Instruction Banner / Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/instruction-banner.jpg"
                  className="w-full p-3 border border-[#e0f2f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080] text-sm text-[#1a2e2e]"
                />
                {imageUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-[#e0f2f2] bg-gray-50 h-48 flex items-center justify-center">
                    <img src={imageUrl} alt="Instruction preview" className="max-h-full max-w-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#e0f2f2] flex items-center justify-between">
                <div>
                  {saveSuccess && (
                    <span className="flex items-center gap-2 text-green-600 text-sm font-medium animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      Saved successfully!
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Instructions'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
