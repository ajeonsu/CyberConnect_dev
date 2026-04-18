import { useState } from 'react';
import type { Project, SheetRow } from '@/types';
import { FolderOpen, CheckCircle, Clock, Pause, Users, ListChecks, AlertTriangle, Plus, X, ChevronDown } from 'lucide-react';
import { getUserName, getProfilesByRole, getAssignableTeamProfiles } from '@/lib/data';

interface Props {
  projects: Project[];
  getSheetData: (projectId: string, sheetId: string) => SheetRow[];
  onSelectProject: (projectId: string) => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onAddProject: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
}

const PROJECT_COLORS = [
  'from-brand-500 to-brand-700',
  'from-emerald-500 to-emerald-700',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-700',
  'from-violet-500 to-violet-700',
  'from-cyan-500 to-cyan-700',
];

export function AdminDashboard({ projects, getSheetData, onSelectProject, onUpdateProject, onAddProject, onDeleteProject }: Props) {
  // Note: onDeleteProject is forwarded via window event or can be passed in Props in future
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingPm, setEditingPm] = useState<string | null>(null);
  const [editingDevs, setEditingDevs] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [inviteFor, setInviteFor] = useState<{ projectId: string; role: 'pm' | 'developer' | 'client' } | null>(null);
  const [showDeleteConfirmFor, setShowDeleteConfirmFor] = useState<string | null>(null);

  const assignableTeam = getAssignableTeamProfiles();

  const pmGroups = new Map<string, Project[]>();
  for (const p of projects) {
    const pmName = getUserName(p.pm_id || '');
    const list = pmGroups.get(pmName) ?? [];
    list.push(p);
    pmGroups.set(pmName, list);
  }

  const getTaskStats = (projectId: string) => {
    const tasks = getSheetData(projectId, 'tasks');
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'Done').length;
    const inProgress = tasks.filter(t => t.status === 'In progress').length;
    const blocked = tasks.filter(t => t.status === 'Blocked').length;
    const notStarted = tasks.filter(t => t.status === 'Not started').length;
    return { total, done, inProgress, blocked, notStarted };
  };

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const allTasks = projects.flatMap(p => getSheetData(p.id, 'tasks'));
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'Done').length;
  const blockedTasks = allTasks.filter(t => t.status === 'Blocked').length;

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">管理者ダッシュボード — Monitor all projects across project managers</p>
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FolderOpen} label="Total Projects" labelJa="プロジェクト総数" value={totalProjects} color="text-brand-400" />
          <StatCard icon={CheckCircle} label="Active" labelJa="アクティブ" value={activeProjects} color="text-emerald-400" />
          <StatCard icon={ListChecks} label="Tasks Done" labelJa="完了タスク" value={`${completedTasks}/${totalTasks}`} color="text-brand-400" />
          <StatCard icon={AlertTriangle} label="Blocked" labelJa="ブロック中" value={blockedTasks} color={blockedTasks > 0 ? 'text-red-400' : 'text-gray-500'} />
        </div>

        {Array.from(pmGroups.entries()).map(([pmName, pmProjects]) => (
          <div key={pmName} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold">PM: {pmName}</h2>
                <p className="text-xs text-gray-500">{pmProjects.length} project{pmProjects.length > 1 ? 's' : ''}</p>
              </div>
            </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pmProjects.map(project => {
                const stats = getTaskStats(project.id);
                const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
                const StatusIcon = project.status === 'active' ? CheckCircle : project.status === 'on_hold' ? Pause : Clock;
                const statusColor = project.status === 'active' ? 'text-emerald-400' : project.status === 'on_hold' ? 'text-amber-400' : 'text-brand-400';

                return (
                  <div key={project.id} className="bg-surface-900 border border-surface-700 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3 cursor-pointer" onClick={() => onSelectProject(project.id)}>
                      <div className="flex items-center gap-3 group">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${project.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                          <FolderOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-sm group-hover:text-brand-300 transition-colors">{project.name}</h3>
                          <p className="text-gray-500 text-xs">{project.client}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${statusColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="capitalize">{project.status.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-gray-500">Task Progress</span>
                        <span className="text-gray-400 font-medium">{stats.done}/{stats.total} ({progress}%)</span>
                      </div>
                      <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs mb-3">
                      {stats.inProgress > 0 && <span className="flex items-center gap-1 text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{stats.inProgress} in progress</span>}
                      {stats.notStarted > 0 && <span className="flex items-center gap-1 text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" />{stats.notStarted} not started</span>}
                      {stats.blocked > 0 && <span className="flex items-center gap-1 text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />{stats.blocked} blocked</span>}
                    </div>

                      <div className="pt-3 border-t border-surface-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider" title="Any PM or developer account">PM</span>
                        {editingPm === project.id ? (
                          <select
                            value={project.pm_id || ''}
                            onChange={e => { onUpdateProject(project.id, { pm_id: e.target.value }); setEditingPm(null); }}
                            onBlur={() => setEditingPm(null)}
                            autoFocus
                            className="bg-surface-800 border border-brand-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                          >
                            <option value="">None</option>
                            {assignableTeam.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button onClick={() => setEditingPm(project.id)} className="text-xs text-gray-300 hover:text-brand-300 transition-colors flex items-center gap-1">
                              {getUserName(project.pm_id || '')} <ChevronDown className="w-3 h-3 text-gray-600" />
                            </button>
                            <button onClick={() => setInviteFor({ projectId: project.id, role: 'pm' })} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-surface-800 border border-surface-700">Invite</button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider" title="PM can be selected here too">Devs</span>
                        {editingDevs === project.id ? (
                          <div className="flex flex-wrap gap-1 items-center">
                            {assignableTeam.map(member => {
                              const assigned = (project.assignedDevIds || []).includes(member.id);
                              const isPm = project.pm_id === member.id;
                              return (
                                <button
                                  key={member.id}
                                  type="button"
                                  title={isPm ? 'Also listed as PM — can be dev too' : undefined}
                                  onClick={() => {
                                    const devIds = project.assignedDevIds || [];
                                    const newIds = assigned
                                      ? devIds.filter(id => id !== member.id)
                                      : [...devIds, member.id];
                                    onUpdateProject(project.id, { assignedDevIds: newIds });
                                  }}
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-all ${
                                    assigned ? 'bg-brand-500/20 border-brand-500/40 text-brand-300' : 'bg-surface-800 border-surface-700 text-gray-500 hover:text-gray-300'
                                  }`}
                                >
                                  {member.name}
                                </button>
                              );
                            })}
                            <button onClick={() => setEditingDevs(null)} className="text-gray-500 hover:text-white ml-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button onClick={() => setEditingDevs(project.id)} className="text-xs text-gray-400 hover:text-brand-300 transition-colors flex items-center gap-1">
                              {(project.assignedDevIds || []).length > 0
                                ? (project.assignedDevIds || []).map(id => getUserName(id)).join(', ')
                                : 'None'
                              }
                              <ChevronDown className="w-3 h-3 text-gray-600" />
                            </button>
                            <button onClick={() => setInviteFor({ projectId: project.id, role: 'developer' })} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-surface-800 border border-surface-700">Invite</button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider" title="Assign a client user">Client</span>
                        {editingClient === project.id ? (
                          <select
                            value={project.client_id || ''}
                            onChange={e => { onUpdateProject(project.id, { client_id: e.target.value }); setEditingClient(null); }}
                            onBlur={() => setEditingClient(null)}
                            autoFocus
                            className="bg-surface-800 border border-brand-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                          >
                            <option value="">None</option>
                            {getProfilesByRole('client').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button onClick={() => setEditingClient(project.id)} className="text-xs text-gray-300 hover:text-brand-300 transition-colors flex items-center gap-1">
                              {getUserName(project.client_id || '')} <ChevronDown className="w-3 h-3 text-gray-600" />
                            </button>
                            <button onClick={() => setInviteFor({ projectId: project.id, role: 'client' })} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-surface-800 border border-surface-700">Invite</button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setShowDeleteConfirmFor(project.id)} className="text-xs text-rose-400 hover:text-white px-2 py-1 rounded bg-surface-800 border border-surface-700">Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {showNewProject && (
          <NewProjectModal
            existingCount={projects.length}
            onClose={() => setShowNewProject(false)}
            onAdd={(p) => { onAddProject(p); setShowNewProject(false); }}
          />
        )}
        
        {inviteFor && (
          <InviteModal
            initialRole={inviteFor.role}
            onClose={() => setInviteFor(null)}
            onInvite={(emails, role) => {
              const resolved = emails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
              const updates: Partial<Project> = {};
              const addDevIds: string[] = [];
              const assignable = getAssignableTeamProfiles();
              const clients = getProfilesByRole('client');

              for (const em of resolved) {
                const u = assignable.find(p => p.email.toLowerCase() === em) || 
                          clients.find(p => p.email.toLowerCase() === em);
                if (!u) continue;
                if (role === 'pm') updates.pm_id = u.id;
                else if (role === 'developer') addDevIds.push(u.id);
                else if (role === 'client') updates.client_id = u.id;
              }
              if (addDevIds.length > 0) {
                const proj = projects.find(p => p.id === inviteFor.projectId);
                const merged = Array.from(new Set([...(proj?.assignedDevIds ?? []), ...addDevIds]));
                updates.assignedDevIds = merged;
              }
              onUpdateProject(inviteFor.projectId, updates);
              setInviteFor(null);
            }}
          />
        )}
        {showDeleteConfirmFor && (
          <DeleteConfirmModal
            project={projects.find(p => p.id === showDeleteConfirmFor)!}
            onClose={() => setShowDeleteConfirmFor(null)}
            onConfirm={(id) => {
              if (typeof onDeleteProject === 'function') {
                onDeleteProject(id);
              } else {
                const ev = new CustomEvent('admin:deleteProject', { detail: id });
                window.dispatchEvent(ev);
              }
              setShowDeleteConfirmFor(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, labelJa, value, color }: {
  icon: typeof FolderOpen; label: string; labelJa: string; value: string | number; color: string;
}) {
  return (
    <div className="bg-surface-900 border border-surface-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-600 mt-0.5">{labelJa}</p>
    </div>
  );
}

function NewProjectModal({ existingCount, onClose, onAdd }: {
  existingCount: number;
  onClose: () => void;
  onAdd: (p: Project) => void;
}) {
  const [name, setName] = useState('');
  const [nameJa, setNameJa] = useState('');
  const [client, setClient] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const colorIdx = existingCount % PROJECT_COLORS.length;
    onAdd({
      id: `proj-${Date.now()}`,
      name: name.trim(),
      name_ja: nameJa.trim() || name.trim(),
      client: client.trim() || 'TBD',
      pm_id: '',
      assignedDevIds: [],
      client_id: '',
      description: desc.trim(),
      description_ja: '',
      color: PROJECT_COLORS[colorIdx],
      status: 'active',
      background: '',
      background_ja: '',
      purpose: '',
      purpose_ja: '',
      dev_period: '',
      workspace_type: 'team',
      owner_id: null,
      created_at: new Date().toISOString().split('T')[0],
    } as Project);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-lg p-6 animate-fade-in shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">New Project</h2>
            <p className="text-xs text-gray-500">新規プロジェクト作成</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-surface-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Project Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="My Project"
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Name (JA)</label>
              <input value={nameJa} onChange={e => setNameJa(e.target.value)} placeholder="プロジェクト名"
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Client Name</label>
            <input value={client} onChange={e => setClient(e.target.value)} placeholder="Client company name"
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40" />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief project description"
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40" />
          </div>

          {/* Only show name, client free text and description on create (PM/Devs assigned later via Invite). */}

          <button type="submit" disabled={!name.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all">
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </form>
      </div>
    </div>
  );
}

function InviteModal({ initialRole, onClose, onInvite }: { initialRole?: 'pm' | 'developer' | 'client'; onClose: () => void; onInvite: (emails: string, role: 'pm' | 'developer' | 'client') => void }) {
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState<'pm' | 'developer' | 'client'>(initialRole || 'developer');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md p-6 animate-fade-in shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Invite to project</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 rounded"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-gray-400 mb-3">Enter comma-separated emails to invite. For demo emails use @gmail.com addresses.</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Emails</label>
            <input value={emails} onChange={e => setEmails(e.target.value)} placeholder="angel@gmail.com, aj@gmail.com"
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value as 'pm' | 'developer' | 'client')} className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-gray-200">
              <option value="developer">Developer</option>
              <option value="pm">Project Manager</option>
              <option value="client">Client</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose} className="text-sm px-3 py-2 rounded bg-surface-800 border border-surface-700 text-gray-300">Cancel</button>
            <button onClick={() => onInvite(emails, role)} className="text-sm px-3 py-2 rounded bg-brand-600 text-white">Invite</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ project, onClose, onConfirm }: { project: Project; onClose: () => void; onConfirm: (id: string) => void }) {
  const [word, setWord] = useState('');
  const [nameConfirm, setNameConfirm] = useState('');
  const canConfirm = word.trim().toLowerCase() === 'delete' && nameConfirm.trim() === project.name;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md p-6 animate-fade-in shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Delete project</h3>
          <p className="text-sm text-gray-400 mt-2">This will permanently delete the project and its data. To confirm, type <span className="font-mono text-sm">delete</span> and the project name <span className="font-medium">{project.name}</span>.</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Type "delete"</label>
            <input value={word} onChange={e => setWord(e.target.value)} className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-gray-200" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Project name</label>
            <input value={nameConfirm} onChange={e => setNameConfirm(e.target.value)} placeholder={project.name} className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-gray-200" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose} className="text-sm px-3 py-2 rounded bg-surface-800 border border-surface-700 text-gray-300">Cancel</button>
            <button disabled={!canConfirm} onClick={() => onConfirm(project.id)} className={`text-sm px-3 py-2 rounded ${canConfirm ? 'bg-rose-500 text-white' : 'bg-surface-800 text-gray-400'}`}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}
