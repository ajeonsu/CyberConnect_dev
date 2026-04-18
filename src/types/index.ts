export type UserRole = 'administrator' | 'pm' | 'developer' | 'client';

export type AccountKind = 'team' | 'personal';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Team = company demo (role selection). Personal = isolated workspace. */
  accountKind?: AccountKind;
  avatar_url?: string;
  department?: string;
}

export interface SheetTab {
  id: string;
  name: string;
  nameJa: string;
  icon: string;
  visibleTo: UserRole[];
  columns: SheetColumn[];
  guestEditableColumns: string[];
  pmCanAddRows: boolean;
  isSpecialView?: boolean;
}

export interface SheetColumn {
  key: string;
  label: string;
  labelJa: string;
  width: number;
  type: 'text' | 'status' | 'select' | 'date' | 'number' | 'code' | 'assignee' | 'longtext';
  editable: boolean;
  options?: string[];
}

export interface SheetRow {
  id: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface Project {
  id: string;
  name: string;
  name_ja: string;
  nameJa?: string; // Keep for static data compatibility
  client: string;
  pm_id: string | null;
  assignedDevIds: string[]; // From project_members join
  client_id: string | null;
  description: string;
  description_ja: string;
  color: string;
  status: 'active' | 'completed' | 'on_hold';
  background: string;
  background_ja: string;
  purpose: string;
  purpose_ja: string;
  dev_period: string;
  workspace_type: AccountKind;
  owner_id: string | null;
  created_at: string;
}

export interface ExportOptions {
  format: 'pdf' | 'csv';
  columns: string[];
}
