import type { UserRole, UserProfile, SheetTab, Project } from '@/types';
import {
  ChevronLeft, ChevronRight, LogOut, FolderOpen, ArrowLeft, BarChart3,
  FileText, Server, ShieldCheck, Monitor, Puzzle, CheckSquare,
  FlaskConical, Plug, ListTodo, GanttChart, Calendar, Building2, UserRound,
  UserCog,
} from 'lucide-react';

type WorkspaceScope = 'team' | 'personal';

interface Props {
  role: UserRole;
  user: UserProfile;
  activeTabId: string;
  visibleTabs: SheetTab[];
  collapsed: boolean;
  onToggle: () => void;
  onTabChange: (tabId: string) => void;
  /** Team accounts: switch between company projects and private sandbox. */
  workspaceScope?: WorkspaceScope;
  onWorkspaceScopeChange?: (scope: WorkspaceScope) => void;
  /** Team accounts: reopen demo role selection without full sign-out. */
  onSwitchRole?: () => void;
  onLogout: () => void;
  activeProject: Project | null;
  onBackToProjects: () => void;
  getTabRowCount: (tabId: string) => number;
  showAdminDashboard: boolean;
}

const iconMap: Record<string, typeof FileText> = {
  FileText, Server, ShieldCheck, Monitor, Puzzle, CheckSquare,
  FlaskConical, Plug, ListTodo, GanttChart, Calendar,
};

const roleColors: Record<UserRole, string> = {
  administrator: 'bg-red-600',
  pm: 'bg-brand-600',
  developer: 'bg-emerald-600',
  client: 'bg-amber-600',
};

const roleLabels: Record<UserRole, string> = {
  administrator: 'Administrator',
  pm: 'Project Manager',
  developer: 'Developer',
  client: 'Guest',
};

export function Sidebar({
  role,
  user,
  activeTabId,
  visibleTabs,
  collapsed,
  onToggle,
  onTabChange,
  workspaceScope,
  onWorkspaceScopeChange,
  onSwitchRole,
  onLogout,
  activeProject,
  onBackToProjects,
  getTabRowCount,
  showAdminDashboard,
}: Props) {
  const showWorkspaceSwitch = user.accountKind === 'team' && workspaceScope !== undefined && onWorkspaceScopeChange;

  const roleLine =
    user.accountKind === 'personal'
      ? 'Personal space'
      : showWorkspaceSwitch && workspaceScope === 'personal'
        ? 'Personal workspace'
        : roleLabels[role];

  return (
    <div className={`${collapsed ? 'w-16' : 'w-60'} bg-surface-900 border-r border-surface-700 flex flex-col transition-all duration-200 shrink-0`}>
      <div className="p-4 flex items-center gap-3 border-b border-surface-700">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="text-white font-semibold text-sm truncate">CyberConnect</h2>
            <p className="text-gray-500 text-xs truncate">Platform</p>
          </div>
        )}
        <button type="button" onClick={onToggle} className="ml-auto text-gray-500 hover:text-gray-300 transition-colors shrink-0">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 py-2.5 border-b border-surface-700">
          <div className="flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded-full ${roleColors[role]} flex items-center justify-center shrink-0`}>
              <span className="text-white text-[9px] font-bold">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-300 text-xs font-medium truncate">{user.name}</p>
              <p className="text-gray-600 text-[10px] truncate">{roleLine}</p>
            </div>
            {role === 'client' && workspaceScope !== 'personal' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                View Only
              </span>
            )}
          </div>

          {showWorkspaceSwitch && (
            <div className="mt-2.5 flex rounded-lg bg-surface-800 p-0.5 border border-surface-700">
              <button
                type="button"
                onClick={() => onWorkspaceScopeChange!('team')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                  workspaceScope === 'team'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Building2 className="w-3 h-3 shrink-0" />
                Team
              </button>
              <button
                type="button"
                onClick={() => onWorkspaceScopeChange!('personal')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                  workspaceScope === 'personal'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <UserRound className="w-3 h-3 shrink-0" />
                Personal
              </button>
            </div>
          )}
        </div>
      )}

      {collapsed && showWorkspaceSwitch && (
        <div className="px-2 pt-1 flex flex-col gap-1 border-b border-surface-700 pb-2">
          <button
            type="button"
            title="Team workspace"
            onClick={() => onWorkspaceScopeChange!('team')}
            className={`flex items-center justify-center p-2 rounded-lg border transition-colors ${
              workspaceScope === 'team' ? 'bg-brand-600 border-brand-500 text-white' : 'border-surface-700 text-gray-500 hover:text-gray-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Personal workspace"
            onClick={() => onWorkspaceScopeChange!('personal')}
            className={`flex items-center justify-center p-2 rounded-lg border transition-colors ${
              workspaceScope === 'personal' ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-surface-700 text-gray-500 hover:text-gray-300'
            }`}
          >
            <UserRound className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeProject && !collapsed && (
        <div className="px-2 pt-2">
          <button
            type="button"
            onClick={onBackToProjects}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all bg-surface-800 border border-surface-700 hover:border-brand-500/30 group"
          >
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${activeProject.color} flex items-center justify-center shrink-0`}>
              <FolderOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-gray-500">Project</div>
              <div className="text-xs font-medium text-white truncate">{activeProject.name}</div>
              <div className="text-[9px] text-gray-600 truncate">{activeProject.name_ja || activeProject.nameJa}</div>
            </div>
            <ArrowLeft className="w-3.5 h-3.5 text-gray-600 group-hover:text-brand-400 transition-colors" />
          </button>
        </div>
      )}

      {activeProject && collapsed && (
        <div className="px-2 pt-2">
          <button
            type="button"
            onClick={onBackToProjects}
            className={`w-full flex items-center justify-center p-2.5 rounded-lg bg-gradient-to-br ${activeProject.color} hover:opacity-80 transition-opacity`}
            title={activeProject.name}
          >
            <FolderOpen className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {showAdminDashboard && !collapsed && (
          <div className="px-3 py-3 mb-2 rounded-lg bg-brand-600/10 border border-brand-500/20">
            <div className="flex items-center gap-2 text-brand-300 text-xs font-medium">
              <BarChart3 className="w-4 h-4" />
              Admin Dashboard
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Viewing all PM projects</p>
          </div>
        )}

        {activeProject ? (
          visibleTabs.map(tab => {
            const Icon = iconMap[tab.icon] ?? FileText;
            const isActive = activeTabId === tab.id;
            const count = tab.isSpecialView ? null : getTabRowCount(tab.id);

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-brand-600/15 text-brand-300'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-surface-800'
                }`}
                title={collapsed ? tab.name : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-400' : ''}`} />
                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{tab.name}</div>
                      <div className="text-[10px] text-gray-600 truncate">{tab.nameJa}</div>
                    </div>
                    {count !== null && count > 0 && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-800 text-gray-500'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })
        ) : !collapsed ? (
          <div className="px-3 py-8 text-center">
            <FolderOpen className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              {showAdminDashboard ? 'Click a project above' : 'Select a project'}
            </p>
            <p className="text-gray-600 text-xs mt-0.5">プロジェクトを選択</p>
          </div>
        ) : null}
      </nav>

      <div className="p-2 border-t border-surface-700 space-y-0.5">
        {onSwitchRole && (
          <button
            type="button"
            onClick={onSwitchRole}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:text-brand-300 hover:bg-brand-500/5 transition-colors"
            title={collapsed ? 'Switch role' : undefined}
          >
            <UserCog className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <span className="text-xs text-left leading-tight">
                Switch role
                <span className="block text-[10px] text-gray-600 font-normal">ロールを変更</span>
              </span>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-xs">Logout</span>}
        </button>
      </div>
    </div>
  );
}
