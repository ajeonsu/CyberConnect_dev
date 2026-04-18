import type { SheetTab, SheetColumn, SheetRow, Project, UserProfile } from '@/types';

function col(key: string, label: string, labelJa: string, width: number, type: SheetColumn['type'] = 'text', editable = true, options?: string[]): SheetColumn {
  return { key, label, labelJa, width, type, editable, options };
}

// ── User Profiles ─────────────────────────────────────────

let cachedProfiles: UserProfile[] = [];

export function setCachedProfiles(profiles: UserProfile[]) {
  cachedProfiles = profiles;
}

export function getUserName(userId: string): string {
  if (!userId) return 'None';
  const fromProfiles = cachedProfiles.find(u => u.id === userId)?.name;
  if (fromProfiles) return fromProfiles;
  return 'Unknown';
}

export function getProfilesByRole(role: UserProfile['role']): UserProfile[] {
  return cachedProfiles.filter(u => u.role === role);
}

/** All PM + developer accounts (unique). Any of these can be assigned as project PM or as a developer, including both on the same project. */
export function getAssignableTeamProfiles(): UserProfile[] {
  const seen = new Set<string>();
  const out: UserProfile[] = [];
  for (const role of ['pm', 'developer'] as const) {
    for (const u of getProfilesByRole(role)) {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        out.push(u);
      }
    }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/** True if the user is the project PM or listed as a developer (supports PM+dev on the same project). */
export function userSeesProjectAsTeamMember(userId: string, project: Project): boolean {
  return project.pm_id === userId || project.assignedDevIds.includes(userId);
}

export function getProjectCountForUser(userId: string, role: UserProfile['role'], projectList: Project[]): number {
  if (role === 'pm') return projectList.filter(p => userSeesProjectAsTeamMember(userId, p)).length;
  if (role === 'developer') return projectList.filter(p => userSeesProjectAsTeamMember(userId, p)).length;
  if (role === 'client') return projectList.filter(p => p.client_id === userId).length;
  return projectList.length;
}

export type Language = 'en' | 'ja';

export const sheetTabs: SheetTab[] = [
  {
    id: 'purpose',
    name: 'Purpose',
    nameJa: '概要',
    icon: 'FileText',
    visibleTo: ['administrator', 'pm', 'client'],
    columns: [],
    guestEditableColumns: [],
    pmCanAddRows: false,
    isSpecialView: true,
  },
  {
    id: 'tech_stack',
    name: 'Technical Stack',
    nameJa: '技術スタック',
    icon: 'Server',
    visibleTo: ['administrator', 'pm', 'developer', 'client'],
    columns: [
      col('major_item', 'Major Items', '大項目', 160, 'text', true),
      col('medium_item', 'Medium Item', '中項目', 160, 'text', true),
      col('content', 'Content', '内容', 500, 'longtext', true),
    ],
    guestEditableColumns: [],
    pmCanAddRows: true,
  },
  {
    id: 'non_func',
    name: 'Non-Functional',
    nameJa: '非機能要件',
    icon: 'ShieldCheck',
    visibleTo: ['administrator', 'pm', 'developer', 'client'],
    columns: [
      col('major_item', 'Major Item', '大項目', 120, 'text', true),
      col('medium_item', 'Medium Item', '中項目', 160, 'text', true),
      col('content', 'Content', '内容', 500, 'longtext', true),
    ],
    guestEditableColumns: [],
    pmCanAddRows: true,
  },
  {
    id: 'screen_list',
    name: 'Screens',
    nameJa: '画面一覧',
    icon: 'Monitor',
    visibleTo: ['administrator', 'pm', 'developer', 'client'],
    columns: [
      col('screen_code', 'Code', '画面ID', 100, 'code', false),
      col('user_category', 'User', 'ユーザー', 120, 'text', true),
      col('major_item', 'Major', '大項目', 120, 'text', true),
      col('medium_item', 'Medium', '中項目', 120, 'text', true),
      col('screen_name', 'Name', '画面名', 180, 'text', true),
      col('path', 'Path', 'パス', 160, 'text', true),
      col('overview', 'Overview', '概要', 250, 'longtext', true),
      col('status', 'Status', 'ステータス', 130, 'status', true, ['Not started', 'In progress', 'Completed', 'Need to be checked']),
      col('completion_dev', 'Dev', '開発完了', 80, 'status', true, ['', 'Done']),
      col('completion_client', 'Client', 'クライアント完了', 80, 'status', true, ['', 'Done']),
      col('remarks', 'Remarks', '備考', 250, 'longtext', true),
    ],
    guestEditableColumns: ['remarks'],
    pmCanAddRows: true,
  },
  {
    id: 'function_list',
    name: 'Functions',
    nameJa: '機能一覧',
    icon: 'Puzzle',
    visibleTo: ['administrator', 'pm', 'developer', 'client'],
    columns: [
      col('function_code', 'Code', '機能ID', 100, 'code', false),
      col('phase', 'Phase', 'フェーズ', 100, 'select', true, ['MVP', 'v2', 'v3']),
      col('user_category', 'User', 'ユーザー', 120, 'text', true),
      col('main_category', 'Main', '大項目', 140, 'text', true),
      col('subcategory', 'Sub', '中項目', 140, 'text', true),
      col('screen_code', 'Screen', '画面ID', 100, 'text', true),
      col('screen_name', 'Screen Name', '画面名', 160, 'text', true),
      col('function_name', 'Function', '機能名', 180, 'text', true),
      col('function_details', 'Details', '詳細', 300, 'longtext', true),
      col('effort', 'Effort', '工数', 80, 'text', true),
      col('status', 'Status', 'ステータス', 130, 'status', true, ['Not started', 'In progress', 'Completed', 'Need to be checked']),
      col('completion_dev', 'Dev', '開発完了', 80, 'status', true, ['', 'Done']),
      col('completion_client', 'Client', 'クライアント完了', 80, 'status', true, ['', 'Done']),
      col('remarks', 'Remarks', '備考', 250, 'longtext', true),
    ],
    guestEditableColumns: ['remarks'],
    pmCanAddRows: true,
  },
  {
    id: 'tasks',
    name: 'Tasks',
    nameJa: 'タスク',
    icon: 'CheckSquare',
    visibleTo: ['administrator', 'pm', 'developer', 'client'],
    columns: [
      col('task_code', 'Code', 'タスクID', 100, 'code', false),
      col('phase', 'Phase', 'フェーズ', 100, 'select', true, ['MVP', 'v2', 'v3']),
      col('sprint', 'Sprint', 'スプリント', 100, 'text', true),
      col('epic', 'Epic', 'エピック', 140, 'text', true),
      col('screen_code', 'Screen', '画面ID', 100, 'text', true),
      col('function_code', 'Function', '機能ID', 100, 'text', true),
      col('task', 'Task', 'タスク', 250, 'text', true),
      col('person_day', 'P/Day', '工数', 80, 'number', true),
      col('assignee', 'Assignee', '担当者', 140, 'assignee', true),
      col('status', 'Status', 'ステータス', 130, 'status', true, ['Not started', 'In progress', 'Done', 'Blocked', 'Need to be checked']),
      col('deadline', 'Deadline', '期限', 120, 'date', true),
      col('completed_date', 'Done At', '完了日', 120, 'date', true),
      col('completion_pm', 'PM Check', 'PM確認', 100, 'select', true, ['', 'Check']),
      col('remark', 'Remark', '備考', 250, 'longtext', true),
    ],
    guestEditableColumns: ['remark'],
    pmCanAddRows: true,
  },
  {
    id: 'test_case',
    name: 'Test Cases',
    nameJa: 'テストケース',
    icon: 'FlaskConical',
    visibleTo: ['administrator', 'pm', 'developer', 'client'],
    columns: [
      col('category', 'Category', 'カテゴリ', 150, 'text', true),
      col('scenario_name', 'Scenario', 'シナリオ', 150, 'text', true),
      col('test_type', 'Type', '種別', 100, 'text', true),
      col('summary', 'Summary', '概要', 250, 'longtext', true),
      col('test_steps', 'Steps', '手順', 300, 'longtext', true),
      col('expected_results', 'Expected', '期待値', 250, 'longtext', true),
      col('status', 'Status', 'ステータス', 100, 'status', true, ['', 'Pass', 'Fail']),
      col('tester', 'Tester', '実施者', 120, 'text', true),
      col('remarks', 'Remarks', '備考', 200, 'longtext', true),
    ],
    guestEditableColumns: [],
    pmCanAddRows: true,
  },
  {
    id: 'app_list',
    name: 'API List',
    nameJa: 'API一覧',
    icon: 'Plug',
    visibleTo: ['administrator', 'pm', 'developer', 'client'],
    columns: [
      col('category', 'Category', 'カテゴリ', 120, 'text', true),
      col('service_name', 'Service', 'サービス', 140, 'text', true),
      col('api_name', 'API Name', 'API名', 160, 'text', true),
      col('auth_method', 'Auth', '認証', 120, 'text', true),
      col('data_handling', 'Data', 'データ', 250, 'longtext', true),
      col('realtime', 'Realtime', 'リアルタイム', 100, 'select', true, ['No', 'Yes', 'Partial']),
      col('mvp_required', 'Required', '必要性', 100, 'select', true, ['MVP', 'v2', 'v3']),
      col('status', 'Status', 'ステータス', 130, 'status', true, ['Not started', 'In progress', 'Completed']),
      col('remarks', 'Remarks', '備考', 200, 'longtext', true),
    ],
    guestEditableColumns: [],
    pmCanAddRows: true,
  },
  {
    id: 'backlog',
    name: 'Backlog',
    nameJa: 'バックログ',
    icon: 'ListTodo',
    visibleTo: ['administrator', 'pm', 'developer', 'client'],
    columns: [
      col('epic', 'Epic', 'エピック', 140, 'text', true),
      col('story', 'Story', 'ストーリー', 180, 'text', true),
      col('task', 'Task', 'タスク', 300, 'longtext', true),
      col('owner', 'Owner', 'オーナー', 120, 'text', true),
      col('sprint', 'Sprint', 'スプリント', 100, 'text', true),
    ],
    guestEditableColumns: [],
    pmCanAddRows: true,
  },
  {
    id: 'process_chart',
    name: 'Process Chart',
    nameJa: '工程表',
    icon: 'GanttChart',
    visibleTo: ['administrator', 'pm', 'developer', 'client'],
    columns: [
      col('code', 'Code', 'ID', 100, 'text', true),
      col('category', 'Category', 'カテゴリ', 120, 'text', true),
      col('task', 'Task', 'タスク', 300, 'text', true),
      col('sprint', 'Sprint', 'スプリント', 120, 'text', true),
      col('person_days', 'P/Days', '工数', 100, 'text', true),
      col('status', 'Status', 'ステータス', 130, 'status', true, ['Planned', 'In progress', 'Completed', 'Deprecated']),
    ],
    guestEditableColumns: [],
    pmCanAddRows: true,
  },
  {
    id: 'master_schedule',
    name: 'Master Schedule',
    nameJa: 'マスタースケジュール',
    icon: 'Calendar',
    visibleTo: ['administrator', 'pm', 'client'],
    columns: [],
    guestEditableColumns: [],
    pmCanAddRows: false,
    isSpecialView: true,
  },
];

// ── Authentication Helpers ──────────────────────────────────

export function normalizeDemoGateEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isDemoAdminGateEmail(email: string): boolean {
  const n = normalizeDemoGateEmail(email);
  return n === 'admin@gmail.com' || n === 'admin@cyberconnect.io';
}

export function isRecognizedDemoGateEmail(email: string): boolean {
  return email.trim().length > 0;
}

export function getDemoGateEmailForUserId(userId: string): string | null {
  return cachedProfiles.find(u => u.id === userId)?.email ?? null;
}

// ── Counter for new codes ─────────────────────────────────

const counters: Record<string, number> = {};

export function generateCode(prefix: string, projectId: string): string {
  const key = `${projectId}-${prefix}`;
  counters[key] = (counters[key] || 0) + 1;
  // Add a random suffix to prevent collisions across sessions/users
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${String(counters[key]).padStart(2, '0')}-${random}`;
}

export function translate(key: string, lang: Language): string {
  if (lang === 'en') return key;
  return translations[key] ?? key;
}

export function getLocalizedCell(row: SheetRow, key: string, lang: Language): string {
  // If the value is a UUID (assignee_id, owner_id, etc), resolve it to a name
  const val = String(row[key] ?? '');
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (uuidRegex.test(val) && (key === 'assignee' || key === 'owner' || key === 'tester' || key === 'assignee_id' || key === 'owner_id' || key === 'tester_id')) {
    return getUserName(val);
  }

  if (lang === 'en') return val;
  const jaKey = `${key}_ja`;
  if (typeof row[jaKey] === 'string' && row[jaKey] !== '') return row[jaKey] as string;
  return val;
}

export const translations: Record<string, string> = {
  'Not started': '未着手',
  'In progress': '進行中',
  'Completed': '完了',
  'Done': '完了',
  'Blocked': 'ブロック',
  'Need to be checked': '要確認',
  'Pass': '合格',
  'Fail': '不合格',
  'Planned': '計画',
  'Deprecated': '廃止',
  'MVP': 'MVP（最小版）',
  'v2': 'v2',
  'v3': 'v3',
  'Unassigned': '未割当',
  'true': 'はい',
  'false': 'いいえ',
};
