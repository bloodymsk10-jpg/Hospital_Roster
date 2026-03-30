export interface Doctor {
  id: number;
  name: string;
  degree: string;
  dept: string;
  unit: string;
  defRoom: string;
  defTime: string;
}

export interface RosterItem {
  id: number;
  docId: number;
  time: string;
  room: string;
  status: 'YES' | 'NO' | 'PENDING';
}

export interface UserData {
  masterDoctors: Doctor[];
  rosterData: { [day: string]: RosterItem[] };
  hospitalHeadline: string;
}
