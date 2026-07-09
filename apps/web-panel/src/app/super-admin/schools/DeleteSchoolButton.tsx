'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteSchool } from '@/app/actions/school';

export default function DeleteSchoolButton({ schoolId }: { schoolId: string }) {
  const router = useRouter();
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
    } else {
      router.push('/schools');
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`text-[12px] font-semibold text-red-500 hover:text-red-600 transition-colors bg-transparent border-none cursor-pointer ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
