import { useState } from 'react';
import type { UserRole, SheetTab, SheetRow } from '@/types';
import { getAssignableTeamProfiles, translate, getLocalizedCell, type Language } from '@/lib/data';
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';

interface Props {
  tab: SheetTab;
  rows: SheetRow[];
  role: UserRole;
  language: Language;
  onSelectRow: (row: SheetRow) => void;
  onUpdateRow: (id: string, key: string, value: string) => void;
  onDeleteRow: (id: string) => void;
  onAddRow: () => void;
  selectedRowId: string | null;
}

const statusColors: Record<string, { text: string; bg: string }> = {
  'Not started': { text: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  'In progress': { text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  'Completed': { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  'Done': { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  'Blocked': { text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  'Need to be checked': { text: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
  'Pass': { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  'Fail': { text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  'Planned': { text: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  'Deprecated': { text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  'MVP': { text: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
  'v2': { text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  'v3': { text: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
};

export function GenericSheet({ tab, rows, role, language, onSelectRow, onUpdateRow, onDeleteRow, onAddRow, selectedRowId }: Props) {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editingCell, setEditingCell] = useState<{ id: string; key: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...rows].sort((a, b) => {
    if (!sortKey) return 0;
    const av = getLocalizedCell(a, sortKey, language) || String(a[sortKey] ?? '');
    const bv = getLocalizedCell(b, sortKey, language) || String(b[sortKey] ?? '');
    const cmp = av.localeCompare(bv, language === 'ja' ? 'ja' : 'en');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const canEditCell = (colKey: string) => {
    if (role === 'administrator' || role === 'pm') return true;
    if (role === 'developer') {
      const c = tab.columns.find(c => c.key === colKey);
      return c?.editable ?? false;
    }
    return tab.guestEditableColumns.includes(colKey);
  };

  const canAddRow = (role === 'administrator' || role === 'pm') && tab.pmCanAddRows;
  const canDeleteRow = role === 'administrator' || role === 'pm';

  const startEdit = (id: string, key: string, value: string) => {
    if (!canEditCell(key)) return;
    setEditingCell({ id, key });
    setEditValue(value);
  };

  const commitEdit = () => {
    if (!editingCell) return;
    onUpdateRow(editingCell.id, editingCell.key, editValue);
    setEditingCell(null);
  };

  return (
    <div className="h-full flex flex-col">
      {canAddRow && (
        <div className="px-4 py-2 border-b border-surface-800 flex items-center gap-2 bg-surface-950/50">
          <button
            onClick={onAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </button>
          <span className="text-xs text-gray-500">{rows.length} rows</span>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse min-w-max">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface-900 border-b border-surface-700">
              <th className="w-10 px-3 py-2.5 text-left sticky left-0 bg-surface-900 z-20">
                <span className="text-gray-500 text-xs">#</span>
              </th>
              {tab.columns.map(c => (
                <th
                  key={c.key}
                  className="px-3 py-2.5 text-left cursor-pointer group select-none"
                  style={{ minWidth: c.width }}
                  onClick={() => handleSort(c.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <div>
                      <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                        {language === 'ja' ? c.labelJa : c.label}
                      </span>
                      {language === 'en' && (
                        <span className="block text-[10px] text-gray-600">{c.labelJa}</span>
                      )}
                    </div>
                    {sortKey === c.key && (
                      sortDir === 'asc'
                        ? <ChevronUp className="w-3.5 h-3.5 text-brand-400" />
                        : <ChevronDown className="w-3.5 h-3.5 text-brand-400" />
                    )}
                  </div>
                </th>
              ))}
              {canDeleteRow && <th className="w-10 px-3 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr
                key={row.id}
                className={`border-b border-surface-800 hover:bg-surface-900/50 cursor-pointer transition-colors ${
                  selectedRowId === row.id ? 'bg-brand-600/8 border-brand-500/20' : ''
                }`}
                onClick={() => onSelectRow(row)}
              >
                <td className="px-3 py-2 text-xs text-gray-600 sticky left-0 bg-surface-950/80 backdrop-blur-sm">
                  {idx + 1}
                </td>
                {tab.columns.map(c => {
                  const value = String(row[c.key] ?? '');
                  const displayValue = getLocalizedCell(row, c.key, language);
                  const isEditing = editingCell?.id === row.id && editingCell?.key === c.key;
                  const editable = canEditCell(c.key);
                  const isGuestEditable = role === 'client' && tab.guestEditableColumns.includes(c.key);

                  return (
                    <td
                      key={c.key}
                      className={`px-3 py-2 text-sm ${isGuestEditable ? 'bg-amber-500/3' : ''}`}
                      style={{ minWidth: c.width }}
                      onDoubleClick={(e) => { e.stopPropagation(); if (editable) startEdit(row.id, c.key, value); }}
                    >
                      {isEditing ? (
                        c.type === 'assignee' ? (
                          <select
                            autoFocus
                            value={editValue}
                            onChange={e => { setEditValue(e.target.value); }}
                            onBlur={commitEdit}
                            className="w-full bg-surface-800 border border-brand-500 rounded px-2 py-1 text-sm text-white focus:outline-none"
                            onClick={e => e.stopPropagation()}
                          >
                            <option value="">{translate('Unassigned', language)}</option>
                            {getAssignableTeamProfiles().map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                        ) : c.type === 'status' || c.type === 'select' ? (
                          <select
                            autoFocus
                            value={editValue}
                            onChange={e => { setEditValue(e.target.value); }}
                            onBlur={commitEdit}
                            className="w-full bg-surface-800 border border-brand-500 rounded px-2 py-1 text-sm text-white focus:outline-none"
                            onClick={e => e.stopPropagation()}
                          >
                            {(c.options ?? []).map(o => <option key={o} value={o}>{translate(o, language)}</option>)}
                          </select>
                        ) : (
                          <input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null); }}
                            className="w-full bg-surface-800 border border-brand-500 rounded px-2 py-1 text-sm text-white focus:outline-none"
                            onClick={e => e.stopPropagation()}
                          />
                        )
                      ) : c.type === 'code' ? (
                        <span className="font-mono text-xs bg-surface-800 px-2 py-1 rounded text-brand-300 border border-surface-700">
                          {displayValue}
                        </span>
                      ) : c.type === 'status' || c.type === 'select' ? (
                        value ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${statusColors[value]?.bg ?? 'bg-gray-500/10 border-gray-500/20'} ${statusColors[value]?.text ?? 'text-gray-400'}`}>
                            {translate(value, language)}
                          </span>
                        ) : <span className="text-gray-600">—</span>
                      ) : c.type === 'assignee' ? (
                        displayValue ? (
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <span className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-[10px] text-white font-medium shrink-0">
                              {displayValue.charAt(0)}
                            </span>
                            <span className="text-gray-300">{displayValue}</span>
                          </span>
                        ) : <span className="text-gray-600 text-xs">{translate('Unassigned', language)}</span>
                      ) : c.type === 'date' ? (
                        <span className="text-gray-400 text-xs">{displayValue || '—'}</span>
                      ) : c.type === 'number' ? (
                        <span className="text-gray-300 font-mono text-xs">{displayValue || '—'}</span>
                      ) : c.type === 'longtext' ? (
                        <span className="text-gray-300 text-xs leading-relaxed line-clamp-2">{displayValue || <span className="text-gray-600">—</span>}</span>
                      ) : (
                        <span className={`text-gray-300 truncate block ${isGuestEditable ? 'cursor-text' : ''}`}>
                          {displayValue || <span className="text-gray-600">—</span>}
                        </span>
                      )}
                    </td>
                  );
                })}
                {canDeleteRow && (
                  <td className="px-3 py-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteRow(row.id); }}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p className="text-lg font-medium">No data in this sheet</p>
            <p className="text-sm mt-1">このシートにはデータがありません</p>
            {canAddRow && (
              <button onClick={onAddRow} className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-all">
                <Plus className="w-4 h-4" />
                Add First Row
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
