'use client';

import { createContext, useContext } from 'react';

export type DrawerForm = 'school' | 'user' | 'exam' | 'template';

export interface ExamPrefill {
  title?: string;
  description?: string;
  durationMinutes?: number;
  mcqCorrect?: number;
  mcqWrong?: number;
  natCorrect?: number;
  natWrong?: number;
  subjects?: { name: string; questionCount: number }[];
}

interface DrawerContextType {
  openDrawer: (form: DrawerForm, prefill?: ExamPrefill) => void;
}

export const DrawerContext = createContext<DrawerContextType>({ openDrawer: () => {} });
export const useDrawer = () => useContext(DrawerContext);
