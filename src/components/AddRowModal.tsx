import React, { useState } from 'react';
import type { SheetTab, SheetRow } from '@/types';
import { X, Save } from 'lucide-react';
import { getAssignableTeamProfiles, translate, generateCode, type Language } from '@/lib/data';

interface Props {
  tab: SheetTab;
  projectId: string;
  language: Language;
  onClose: () => void;
  onSave: (row: SheetRow) => void;
}

export function AddRowModal({ tab, projectId, language, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    tab.columns.forEach(c => {
      if (c.type === 'code') {
        const prefix = c.key === 'task_code' ? 'TSK' : c.key === 'screen_code' ? 'SCR' : c.key === 'function_code' ? 'FNC' : 'ITM';
        initial[c.key] = generateCode(prefix, projectId);
      } else if (c.type === 'status' && c.options?.length) {
        initial[c.key] = c.options[0];
      } else {
        initial[c.key] = '';
      }
    });
    return initial;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Explicitly handle mapping and data types for DB compatibility
    const processedData: Record<string, string | number> = { ...formData };
    
    // Handle Tasks specific fields
    if (tab.id === 'tasks') {
      if (formData.completion_pm) processedData.completion_pm = formData.completion_pm;
      if (formData.person_day) processedData.person_day = parseFloat(formData.person_day);
    }
    
    // Handle Process Chart specific fields
    if (tab.id === 'process_chart') {
      if (formData.person_days) processedData.person_days = parseFloat(formData.person_days);
    }

    const newRow = {
      ...processedData,
      id: crypto.randomUUID(),
      project_id: projectId,
      created_at: new Date().toISOString()
    } as SheetRow;
    onSave(newRow);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700 bg-surface-850/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-brand-500 rounded-full" />
            {translate('Add New', language)} {language === 'ja' ? tab.nameJa : tab.name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-surface-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {tab.columns
              .filter(col => {
                // Filter out developer-specific fields for the Tasks tab during creation
                if (tab.id === 'tasks') {
                  const devFields = ['status', 'completed_date', 'pm_check', 'remark'];
                  return !devFields.includes(col.key);
                }
                return true;
              })
              .map(col => (
              <div key={col.key} className={col.type === 'longtext' ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  {language === 'ja' ? col.labelJa : col.label}
                </label>
                
                {col.type === 'status' || col.type === 'select' ? (
                  <select
                    value={formData[col.key]}
                    onChange={e => setFormData(prev => ({ ...prev, [col.key]: e.target.value }))}
                    className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  >
                    {col.options?.map(opt => (
                      <option key={opt} value={opt}>{translate(opt, language)}</option>
                    ))}
                  </select>
                ) : col.type === 'assignee' ? (
                  <select
                    value={formData[col.key]}
                    onChange={e => setFormData(prev => ({ ...prev, [col.key]: e.target.value }))}
                    className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  >
                    <option value="">{translate('Unassigned', language)}</option>
                    {getAssignableTeamProfiles().map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                ) : col.type === 'longtext' ? (
                  <textarea
                    rows={3}
                    value={formData[col.key]}
                    onChange={e => setFormData(prev => ({ ...prev, [col.key]: e.target.value }))}
                    className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none"
                  />
                ) : (
                  <input
                    type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                    value={formData[col.key]}
                    onChange={e => setFormData(prev => ({ ...prev, [col.key]: e.target.value }))}
                    className={`w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${col.type === 'code' ? 'font-mono border-brand-500/30' : ''}`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-surface-700 text-gray-300 hover:text-white hover:bg-surface-800 transition-all font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-brand-600/20 active:scale-95"
            >
              <Save className="w-4 h-4" />
              Save Row
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
