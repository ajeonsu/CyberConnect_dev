import { useState } from 'react';
import type { Project } from '@/types';
import { FolderOpen, Plus, Circle, Pause, CheckCircle, X, Sparkles } from 'lucide-react';
import { getUserName } from '@/lib/data';
import { UpgradeModal } from './UpgradeModal';

const statusIcon: Record<Project['status'], { icon: typeof Circle; color: string; label: string }> = {
  active: { icon: Circle, color: 'text-emerald-400', label: 'Active' },
  completed: { icon: CheckCircle, color: 'text-brand-400', label: 'Completed' },
  on_hold: { icon: Pause, color: 'text-amber-400', label: 'On Hold' },
};

export function ProjectDashboard({
  projects,
  onSelectProject,
  mode = 'team',
  getTaskStats,
  onPersonalCreateProject,
  onUpgrade,
}: {
  projects: Project[];
  onSelectProject: (id: string) => void;
  mode?: 'team' | 'personal';
  getTaskStats?: (projectId: string) => { total: number; done: number; inProgress: number; notStarted: number };
  onPersonalCreateProject?: (fields: { name: string; description: string }) => void;
  onUpgrade?: (teamName: string) => Promise<void>;
}) {
  const [showModal, setShowModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const title = mode === 'personal' ? 'Your workspace' : 'Projects / プロジェクト';
  const subtitle =
    mode === 'personal'
      ? 'Create projects and track task progress here'
      : 'Select a project to manage requirements';

  const submitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !onPersonalCreateProject) return;
    onPersonalCreateProject({ name: newName.trim(), description: newDesc.trim() });
    setNewName('');
    setNewDesc('');
    setShowModal(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 text-white">
      <div className="max-w-4xl w-full animate-fade-in">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-gray-500 mt-1">{subtitle}</p>
            {mode === 'personal' && (
              <p className="text-emerald-500/80 text-xs mt-2">Personal space — managed by your private account.</p>
            )}
          </div>
          {mode === 'personal' && (
            <button 
              onClick={() => setShowUpgrade(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-600/20 group active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              Go Team — Upgrade
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => {
            const st = statusIcon[project.status];
            const StIcon = st.icon;
            const stats = getTaskStats?.(project.id);
            const progress = stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => onSelectProject(project.id)}
                className="group relative bg-surface-900 border border-surface-700 rounded-2xl p-5 text-left hover:border-brand-500/50 hover:bg-surface-850 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${project.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <FolderOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${st.color}`}>
                    <StIcon className="w-3 h-3" />
                    <span>{st.label}</span>
                  </div>
                </div>
                <h3 className="text-white font-semibold">{project.name}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{project.name_ja}</p>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed line-clamp-2">{project.description}</p>
                {stats && (
                  <div className="mt-4 pt-3 border-t border-surface-700">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-500">Task progress</span>
                      <span className="text-gray-400 font-medium">
                        {stats.done}/{stats.total} ({progress}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-brand-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1.5">
                      {stats.inProgress} in progress · {stats.notStarted} not started
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-700">
                  <span className="text-xs text-gray-500">
                    Client: <span className="text-gray-400">{project.client}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    PM: <span className="text-gray-400">{getUserName(project.pm_id || '')}</span>
                  </span>
                </div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-brand-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </button>
            );
          })}

          {onPersonalCreateProject && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="group bg-surface-900/50 border-2 border-dashed border-surface-700 rounded-2xl p-5 text-left hover:border-emerald-500/40 hover:bg-surface-850/50 transition-all duration-200 flex flex-col items-center justify-center min-h-[180px]"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center mb-3 group-hover:border-emerald-500/30 transition-colors">
                <Plus className="w-5 h-5 text-gray-500 group-hover:text-emerald-400" />
              </div>
              <span className="text-gray-500 text-sm font-medium group-hover:text-gray-300">New project</span>
              <span className="text-gray-600 text-xs mt-0.5">新規プロジェクト</span>
            </button>
          )}
        </div>
      </div>

      {showModal && onPersonalCreateProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">New project</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-surface-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitNew} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Project name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  placeholder="My roadmap"
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Description</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="What are you building?"
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={!newName.trim()}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition"
              >
                Create project
              </button>
            </form>
          </div>
        </div>
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} onUpgrade={onUpgrade || (async () => {})} />}
    </div>
  );
}
