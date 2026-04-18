'use client';

import { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { UserProfile, SheetRow, Project, UserRole } from '@/types';
import {
  sheetTabs,
  userSeesProjectAsTeamMember,
  setCachedProfiles,
  getDemoGateEmailForUserId,
  type Language,
} from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { getProjectsAction, createProjectAction, updateProjectAction, deleteProjectAction } from '@/actions/projects';
import { getSheetRowsAction, upsertSheetRowAction, deleteSheetRowAction } from '@/actions/rows';
import { loginAction, logoutAction, getSession } from '@/actions/auth';
import { getProfiles, upgradeToAdminAction } from '@/actions/profiles';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { GenericSheet } from '@/components/GenericSheet';
import { SheetRowDetail } from '@/components/SheetRowDetail';
import { AddRowModal } from '@/components/AddRowModal';
import { ExportModal } from '@/components/ExportModal';
import { LoginScreen } from '@/components/LoginScreen';
import { ProjectDashboard } from '@/components/ProjectSelector';
import { PurposeView } from '@/components/PurposeView';
import { MasterScheduleView } from '@/components/MasterScheduleView';
import { AdminDashboard } from '@/components/AdminDashboard';
import { clearLoginSessionStorage, saveDemoGateEmail, setResumeRoleSelection } from '@/lib/loginSession';

type WorkspaceScope = 'team' | 'personal';

const PERSONAL_COLORS = [
  'from-brand-500 to-brand-700',
  'from-emerald-500 to-emerald-700',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-700',
  'from-violet-500 to-violet-700',
  'from-cyan-500 to-cyan-700',
];

export const dynamic = 'force-dynamic';

export default function App() {
  return (
    <Suspense fallback={null}>
      <AppContent />
    </Suspense>
  );
}

function AppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loggedInUser, setLoggedInUser] = useState<UserProfile | null>(null);
  const [workspaceScope, setWorkspaceScope] = useState<WorkspaceScope>('team');
  const [isLoading, setIsLoading] = useState(true);
  
  // URL-driven states
  const activeProjectId = searchParams.get('project');
  const activeTabId = searchParams.get('tab') || 'purpose';
  const showAdminDashboard = searchParams.get('admin') === 'true';

  const updateNavigation = useCallback((updates: { project?: string | null; tab?: string; admin?: boolean }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.project !== undefined) {
      if (updates.project) {
        params.set('project', updates.project);
        params.delete('admin');
      } else {
        params.delete('project');
      }
    }

    if (updates.tab) {
      params.set('tab', updates.tab);
    }

    if (updates.admin !== undefined) {
      if (updates.admin) {
        params.set('admin', 'true');
        params.delete('project');
      } else {
        params.delete('admin');
      }
    }

    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const setActiveProjectId = useCallback((id: string | null) => updateNavigation({ project: id }), [updateNavigation]);
  const setActiveTabId = useCallback((id: string) => updateNavigation({ tab: id }), [updateNavigation]);
  const setShowAdminDashboard = useCallback((show: boolean) => updateNavigation({ admin: show }), [updateNavigation]);

  const [selectedRow, setSelectedRow] = useState<SheetRow | null>(null);
  const [showAddRow, setShowAddRow] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /** Unified Workspace Data (managed by Server Actions). */
  const [projects, setProjects] = useState<Project[]>([]);
  const [sheetData, setSheetData] = useState<Record<string, Record<string, SheetRow[]>>>({});

  // Initial Session sync
  useEffect(() => {
    getSession().then(session => {
      if (session) {
        // Find existing user profile to populate state
        supabase.from('profiles').select('*').eq('email', session.email).single().then(({ data }) => {
          if (data) {
            setLoggedInUser({ ...data, accountKind: session.accountKind } as UserProfile);
            setWorkspaceScope(session.accountKind === 'personal' ? 'personal' : 'team');
          } else {
            setIsLoading(false);
          }
        });
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  // Sync Projects
  useEffect(() => {
    if (loggedInUser) {
      getProfiles().then(profiles => {
        setCachedProfiles(profiles);
        getProjectsAction().then(res => {
          setProjects(res);
          setIsLoading(false);
        });
      });
    }
  }, [loggedInUser, workspaceScope]);

  // Sync Sheet Rows: Fetch all tabs for the active project to populate sidebar counts
  useEffect(() => {
    if (activeProjectId) {
      const dataTabs = sheetTabs.filter(t => !t.isSpecialView);
      
      Promise.all(
        dataTabs.map(tab => 
          getSheetRowsAction(activeProjectId, tab.id).then(rows => ({ tabId: tab.id, rows }))
        )
      ).then(results => {
        const newData: Record<string, SheetRow[]> = {};
        results.forEach(res => {
          newData[res.tabId] = res.rows;
        });
        
        setSheetData(prev => ({
          ...prev,
          [activeProjectId]: newData
        }));
      });
    }
  }, [activeProjectId]);

  const [language, setLanguage] = useState<Language>('en');
  const [loginScreenKey, setLoginScreenKey] = useState(0);

  const role = loggedInUser?.role ?? null;
  const isTeamAccount = loggedInUser?.accountKind === 'team';

  const setActiveSheetData = useCallback(
    (updater: (prev: Record<string, Record<string, SheetRow[]>>) => Record<string, Record<string, SheetRow[]>>) => {
      setSheetData(updater);
    },
    []
  );

  const effectiveRole: UserRole = useMemo(() => {
    if (!loggedInUser || !role) return role ?? 'pm';
    if (loggedInUser.accountKind === 'personal') return 'pm';
    if (loggedInUser.accountKind === 'team' && workspaceScope === 'personal') return 'pm';
    return role;
  }, [loggedInUser, role, workspaceScope]);

  const visibleProjects = useMemo(() => {
    if (!loggedInUser) return [];
    // If it's team workspace, we still filter by role-based visibility rules
    if (workspaceScope === 'team') {
      if (role === 'administrator') return projects;
      if (role === 'pm' || role === 'developer') {
        return projects.filter(p => userSeesProjectAsTeamMember(loggedInUser.id, p));
      }
      if (role === 'client') return projects.filter(p => p.client_id === loggedInUser.id);
    }
    // For personal projects, backend already filtered them.
    return projects;
  }, [loggedInUser, projects, role, workspaceScope]);

  // Pre-fetch tasks for all projects to show progress bars on the dashboard
  useEffect(() => {
    if (visibleProjects.length > 0 && !activeProjectId) {
      visibleProjects.forEach(p => {
        if (!sheetData[p.id]?.['tasks']) {
          getSheetRowsAction(p.id, 'tasks').then(rows => {
            setSheetData(prev => ({
              ...prev,
              [p.id]: { ...prev[p.id], tasks: rows }
            }));
          });
        }
      });
    }
  }, [visibleProjects, activeProjectId, sheetData]);

  const activeProject = useMemo(
    () => projects.find(p => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  const visibleTabs = useMemo(
    () => (effectiveRole ? sheetTabs.filter(t => t.visibleTo.includes(effectiveRole)) : []),
    [effectiveRole]
  );

  const activeTab = useMemo(() => sheetTabs.find(t => t.id === activeTabId) ?? null, [activeTabId]);

  const currentRows = useMemo(() => {
    if (!activeProjectId || !activeTabId) return [];
    return sheetData[activeProjectId]?.[activeTabId] ?? [];
  }, [activeProjectId, activeTabId, sheetData]);

  const handleLogin = useCallback(async (user: UserProfile) => {
    // 1. Establish server session cookies first
    await loginAction(user.email, user.role, user.accountKind || 'personal');
    
    // 2. Then trigger frontend state update (which triggers data fetch effects)
    setLoggedInUser(user);
    setWorkspaceScope(user.accountKind || 'personal');

    // Redirect to proper view via URL
    const params = new URLSearchParams();
    if (user.role === 'administrator' && user.accountKind === 'team') {
      params.set('admin', 'true');
    }
    router.push(`?${params.toString()}`);

    setSelectedRow(null);
  }, [router]);

  const getPersonalTaskStats = useCallback(
    (projectId: string) => {
      const tasks = sheetData[projectId]?.['tasks'] ?? [];
      const total = tasks.length;
      const done = tasks.filter(t => t.status === 'Done').length;
      const inProgress = tasks.filter(t => t.status === 'In progress').length;
      const notStarted = tasks.filter(t => t.status === 'Not started').length;
      return { total, done, inProgress, notStarted };
    },
    [sheetData]
  );
  const handlePersonalCreateProject = useCallback(
    async (fields: { name: string; description: string }) => {
      if (!loggedInUser) return;
      const color = PERSONAL_COLORS[projects.length % PERSONAL_COLORS.length]!;
      const newProject: Partial<Project> = {
        name: fields.name,
        name_ja: fields.name,
        client: 'Personal',
        description: fields.description || 'Private workspace project',
        color,
      };
      try {
        const created = await createProjectAction(newProject);
        if (created) {
          setProjects(prev => [...prev, created]);
          setSheetData(prev => ({ ...prev, [created.id]: {} }));
        }
      } catch (err) {
        console.error('Failed to create personal project:', err);
      }
    },
    [loggedInUser, projects.length]
  );

  const handleWorkspaceScope = useCallback((scope: WorkspaceScope) => {
    setWorkspaceScope(scope);
    setActiveProjectId(null);
    setSelectedRow(null);
    if (scope === 'team' && loggedInUser?.role === 'administrator') {
      setShowAdminDashboard(true);
    } else {
      setShowAdminDashboard(false);
    }
  }, [loggedInUser?.role, setActiveProjectId, setSelectedRow, setShowAdminDashboard]);

  const handleSelectProject = useCallback(
    (projectId: string) => {
      const r = effectiveRole;
      const firstTab = r ? sheetTabs.find(t => t.visibleTo.includes(r)) : sheetTabs[0];
      
      updateNavigation({
        project: projectId,
        tab: firstTab?.id ?? 'purpose',
        admin: false
      });
      setSelectedRow(null);
    },
    [effectiveRole, updateNavigation]
  );
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    setSelectedRow(null);
  }, [setActiveTabId]);

  const handleBackToProjects = useCallback(() => {
    setActiveProjectId(null);
    setSelectedRow(null);
  }, [setActiveProjectId]);

  const handleUpdateRow = useCallback(
    async (rowId: string, key: string, value: string) => {
      if (!activeProjectId || !activeTabId) return;

      const currentTabRows = sheetData[activeProjectId]?.[activeTabId] ?? [];
      const row = currentTabRows.find(r => r.id === rowId);
      if (!row) return;

      const updatedRow = { ...row, [key]: value } as SheetRow & { project_id: string };

      try {
        await upsertSheetRowAction(activeTabId, updatedRow);
        setActiveSheetData(prev => {
          const projData = { ...prev[activeProjectId] };
          const tabRows = [...(projData[activeTabId] ?? [])];
          const idx = tabRows.findIndex(r => r.id === rowId);
          if (idx >= 0) tabRows[idx] = updatedRow;
          projData[activeTabId] = tabRows;
          return { ...prev, [activeProjectId]: projData };
        });
        
        if (selectedRow?.id === rowId) {
          setSelectedRow(prev => (prev ? { ...prev, [key]: value } : null));
        }
      } catch (err) {
        console.error('Failed to update row:', err);
      }
    },
    [activeProjectId, activeTabId, selectedRow, setActiveSheetData, sheetData]
  );

  const handleAddRow = useCallback(() => {
    setShowAddRow(true);
  }, []);

  const saveNewRow = useCallback(async (newRow: SheetRow) => {
    if (!activeProjectId || !activeTabId) return;

    try {
      const created = await upsertSheetRowAction(activeTabId, { ...newRow, project_id: activeProjectId });
      setActiveSheetData(prev => {
        const projData = { ...prev[activeProjectId] };
        projData[activeTabId] = [...(projData[activeTabId] ?? []), created];
        return { ...prev, [activeProjectId]: projData };
      });
      setShowAddRow(false);
      setSelectedRow(created);
    } catch (err) {
      console.error('Failed to create row:', err);
    }
  }, [activeProjectId, activeTabId, setActiveSheetData]);

  const handleDeleteRow = useCallback(
    async (rowId: string) => {
      if (!activeProjectId || !activeTabId) return;

      try {
        await deleteSheetRowAction(activeTabId, activeProjectId, rowId);
        setActiveSheetData(prev => {
          const projData = { ...prev[activeProjectId] };
          projData[activeTabId] = (projData[activeTabId] ?? []).filter(r => r.id !== rowId);
          return { ...prev, [activeProjectId]: projData };
        });
        if (selectedRow?.id === rowId) setSelectedRow(null);
      } catch (err) {
        console.error('Failed to delete row:', err);
      }
    },
    [activeProjectId, activeTabId, selectedRow, setActiveSheetData]
  );

  const getSheetDataForProject = useCallback(
    (projectId: string, sheetId: string) => {
      return sheetData[projectId]?.[sheetId] ?? [];
    },
    [sheetData]
  );

  const handleAddProject = useCallback(
    async (newProject: Partial<Project>) => {
      try {
        const created = await createProjectAction(newProject);
        if (created) {
          setProjects(prev => [...prev, created]);
          setSheetData(prev => ({ ...prev, [created.id]: {} }));
        }
      } catch (err) {
        console.error('Failed to create project:', err);
      }
    },
    []
  );
 
  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      await deleteProjectAction(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setSheetData(prev => {
        const copy = { ...prev };
        delete copy[projectId];
        return copy;
      });
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  }, []);

  const resetAfterLeave = useCallback(() => {
    setLoggedInUser(null);
    setActiveProjectId(null);
    setShowAdminDashboard(false);
    setWorkspaceScope('team');
    setProjects([]);
    setSheetData({});
    setLoginScreenKey(k => k + 1);
    router.push('/');
  }, [router, setActiveProjectId, setShowAdminDashboard]);

  const handleLogout = useCallback(() => {
    logoutAction();
    clearLoginSessionStorage();
    resetAfterLeave();
  }, [resetAfterLeave]);

  /** Team demo: return to role picker while keeping gate email for session. */
  const handleSwitchRole = useCallback(() => {
    if (!loggedInUser || loggedInUser.accountKind !== 'team') return;
    const demoEmail = getDemoGateEmailForUserId(loggedInUser.id) || loggedInUser.email;
    if (demoEmail) {
      saveDemoGateEmail(demoEmail);
      setResumeRoleSelection();
      logoutAction().then(() => resetAfterLeave());
    } else {
      logoutAction().then(() => {
        clearLoginSessionStorage();
        resetAfterLeave();
      });
    }
  }, [loggedInUser, resetAfterLeave]);

  const handleUpgrade = useCallback(async (teamName: string) => {
    if (!loggedInUser) return;
    try {
      await upgradeToAdminAction();
      const updatedUser = { ...loggedInUser, role: 'administrator' as UserRole, accountKind: 'team' as const };
      setLoggedInUser(updatedUser);
      setWorkspaceScope('team');
      setShowAdminDashboard(true);
      await loginAction(updatedUser.email, updatedUser.role, updatedUser.accountKind);
      console.log(`Team "${teamName}" created`);
    } catch (err) {
      console.error('Upgrade failed:', err);
      throw err;
    }
  }, [loggedInUser, setShowAdminDashboard]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface-950 flex-col gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-brand-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-brand-500 rounded-full animate-spin" />
        </div>
        <div className="flex flex-col items-center">
          <p className="text-white font-bold text-lg animate-pulse tracking-widest uppercase">CyberConnect</p>
          <p className="text-gray-500 text-xs mt-1">Initializing workspace...</p>
        </div>
      </div>
    );
  }

  if (!loggedInUser || !role) {
    return <LoginScreen key={loginScreenKey} onLogin={handleLogin} />;
  }

  const getTabRowCount = (tabId: string) => {
    if (!activeProjectId) return 0;
    return (sheetData[activeProjectId]?.[tabId] ?? []).length;
  };

  const showPersonalDashboard = workspaceScope === 'personal';

  return (
    <div className="flex h-screen bg-surface-950 text-gray-100 overflow-hidden">
      <Sidebar
        role={role}
        user={loggedInUser}
        activeTabId={activeTabId}
        visibleTabs={visibleTabs}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onTabChange={handleTabChange}
        workspaceScope={isTeamAccount ? workspaceScope : undefined}
        onWorkspaceScopeChange={isTeamAccount ? handleWorkspaceScope : undefined}
        onSwitchRole={isTeamAccount ? handleSwitchRole : undefined}
        onLogout={handleLogout}
        activeProject={activeProject}
        onBackToProjects={handleBackToProjects}
        getTabRowCount={getTabRowCount}
        showAdminDashboard={showAdminDashboard && !activeProjectId && isTeamAccount && workspaceScope === 'team'}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {activeProjectId && activeProject ? (
          activeTab?.isSpecialView ? (
            activeTab.id === 'purpose' ? (
              <PurposeView project={activeProject} />
            ) : (
              <MasterScheduleView />
            )
          ) : activeTab ? (
            <>
              <Header
                role={effectiveRole}
                user={loggedInUser}
                tab={activeTab}
                totalRows={currentRows.length}
                projectName={language === 'ja' ? (activeProject.name_ja || activeProject.nameJa || activeProject.name) : activeProject.name}
                language={language}
                onLanguageChange={setLanguage}
                onExport={() => setShowExport(true)}
              />
              <div className="flex-1 overflow-hidden relative">
                <GenericSheet
                  tab={activeTab}
                  rows={currentRows}
                  role={effectiveRole}
                  language={language}
                  onSelectRow={setSelectedRow}
                  onUpdateRow={handleUpdateRow}
                  onDeleteRow={handleDeleteRow}
                  onAddRow={handleAddRow}
                  selectedRowId={selectedRow?.id ?? null}
                />
              </div>
            </>
          ) : null
        ) : showAdminDashboard && role === 'administrator' && isTeamAccount && workspaceScope === 'team' ? (
          <AdminDashboard
            projects={projects}
            getSheetData={getSheetDataForProject}
            onSelectProject={handleSelectProject}
            onUpdateProject={async (id, u) => {
              try {
                await updateProjectAction(id, u);
                setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...u } : p)));
              } catch (err) {
                console.error('Failed to update project:', err);
              }
            }}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
          />
        ) : (
          <ProjectDashboard
            projects={visibleProjects}
            onSelectProject={handleSelectProject}
            mode={showPersonalDashboard ? 'personal' : 'team'}
            getTaskStats={getPersonalTaskStats}
            onPersonalCreateProject={handlePersonalCreateProject}
            onUpgrade={handleUpgrade}
          />
        )}
      </div>

      {selectedRow && activeTab && !activeTab.isSpecialView && (
        <SheetRowDetail
          tab={activeTab}
          row={selectedRow}
          role={effectiveRole}
          language={language}
          onClose={() => setSelectedRow(null)}
          onUpdate={(key, value) => handleUpdateRow(selectedRow.id, key, value)}
        />
      )}

      {showAddRow && activeTab && activeProjectId && (
        <AddRowModal
          tab={activeTab}
          projectId={activeProjectId}
          language={language}
          onClose={() => setShowAddRow(false)}
          onSave={saveNewRow}
        />
      )}

      {showExport && activeTab && (
        <ExportModal tab={activeTab} rows={currentRows} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
