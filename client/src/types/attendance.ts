export interface AttendanceTeacher {
  id: string;
  name: string;
  email: string;
}

export interface AttendanceStudent {
  studentId: string;
  name: string;
  email: string;
  rollNo: number | null;
  submittedAt: string;
}

export interface AttendanceSession {
  id: string;
  teacher?: AttendanceTeacher;
  lectureName: string;
  course: string;
  class: string;
  section: string;
  date: string;
  formToken: string;
  formUrl: string;
  expiresAt: string;
  isActive: boolean;
  students: AttendanceStudent[];
  studentCount: number;
  hasMarked?: boolean;
}

export interface StartSessionResponse {
  message: string;
  formUrl: string;
  expiresAt: string;
  session: AttendanceSession;
}
