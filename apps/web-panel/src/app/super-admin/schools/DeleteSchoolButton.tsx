'use client';

import { useState } from 'react';
import { deleteSchool } from '@/app/actions/school';

export default function DeleteSchoolButton({ schoolId }: { schoolId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this school? All associated users, exams, and data will be permanently removed. This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteSchool(schoolId);
    
    if (!result.success) {
      alert(`Failed to delete school: ${result.error}`);
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`text-red-400 hover:text-red-300 text-sm font-medium transition-colors ml-4 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
