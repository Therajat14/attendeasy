export interface AttendanceRecord {
  userId: string;
  date: string;
  status: "present" | "absent";
}
