export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "cr" | "admin";
  rollNo?: number;
  course?: string;
  class?: string;
  section?: string;
}
