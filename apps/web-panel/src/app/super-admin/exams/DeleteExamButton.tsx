'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteExam } from '@/app/actions/exam';

export default function DeleteExamButton({ examId }: { examId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this exam? It will be moved to the trash.')) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteExam(examId);
    
    if (!result.success) {
      alert(`Failed to delete exam: ${result.error}`);
      setIsDeleting(false);
    } else {
      router.refresh();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refresh-tables'));
      }
      router.push('/exams');
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider bg-transparent border-none cursor-pointer ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
