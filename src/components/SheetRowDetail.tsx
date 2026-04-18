import type { SheetTab, SheetRow, UserRole } from '@/types';
import { getAssignableTeamProfiles, translate, getLocalizedCell, type Language } from '@/lib/data';
import { X } from 'lucide-react';

interface Props {
  tab: SheetTab;
  row: SheetRow;
  role: UserRole;
  language: Language;
  onClose: () => void;
  onUpdate: (key: string, value: string) => void;
}

export function SheetRowDetail({ tab, row, role, language, onClose, onUpdate }: Props) {
  const canEditField = (colKey: string) => {
    if (role === 'administrator' || role === 'pm') return true;
    if (role === 'developer') return tab.columns.find(c => c.key === colKey)?.editable ?? false;
    return tab.guestEditableColumns.includes(colKey);
  };

  const codeCol = tab.columns.find(c => c.type === 'code');
  const codeValue = codeCol ? row[codeCol.key] : null;

  return (
    <div className="w-[420px] bg-surface-900 border-l border-surface-700 flex flex-col animate-slide-in shrink-0 h-full overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700">
        <div className="flex items-center gap-3 min-w-0">
          {codeValue && (
            <span className="font-mono text-xs bg-surface-800 px-2.5 py-1 rounded text-brand-300 border border-surface-700 shrink-0">
              {codeValue}
            </span>
          )}
          <span className="text-sm font-medium text-white truncate">
            {language === 'ja' ? tab.nameJa : tab.name}
          </span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-surface-800 shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {tab.columns.map(col => {
          const value = String(row[col.key] ?? '');
          const displayValue = getLocalizedCell(row, col.key, language);
          const editable = canEditField(col.key);
          const isGuestEditable = role === 'client' && tab.guestEditableColumns.includes(col.key);

          return (
            <div key={col.key}>
              <label className="text-xs text-gray-500 mb-1.5 flex items-center gap-2">
                {language === 'ja' ? col.labelJa : col.label}
                {language === 'en' && (
                  <>
                    <span className="text-gray-600">/</span>
                    <span className="text-gray-600">{col.labelJa}</span>
                  </>
                )}
                {isGuestEditable && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Editable
                  </span>
                )}
              </label>

              {editable && col.type === 'assignee' ? (
                <select
                  value={value}
                  onChange={e => onUpdate(col.key, e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                >
                  <option value="">{translate('Unassigned', language)}</option>
                  {getAssignableTeamProfiles().map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              ) : editable && (col.type === 'status' || col.type === 'select') && col.options ? (
                <select
                  value={value}
                  onChange={e => onUpdate(col.key, e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                >
                  {col.options.map(o => <option key={o} value={o}>{translate(o, language)}</option>)}
                </select>
              ) : editable && (col.type === 'longtext') ? (
                <textarea
                  value={value}
                  onChange={e => onUpdate(col.key, e.target.value)}
                  rows={3}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none"
                />
              ) : editable && col.type !== 'code' ? (
                <input
                  type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                  value={value}
                  onChange={e => onUpdate(col.key, e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              ) : (
                <p className="text-sm text-gray-300 bg-surface-850 rounded-lg px-3 py-2 border border-surface-800 whitespace-pre-wrap min-h-[36px] font-mono">
                  {(col.type === 'status' || col.type === 'select') ? (translate(value, language) || <span className="text-gray-600 italic">—</span>) : (displayValue || <span className="text-gray-600 italic">—</span>)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
