export interface User {
  id: string;
  name: string;
  role: "student" | "teacher" | "cr" | "admin";
}
