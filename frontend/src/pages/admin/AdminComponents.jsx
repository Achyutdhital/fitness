import React from 'react'
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiX, FiSave, FiLoader } from 'react-icons/fi'

// ── Table ─────────────────────────────────────────────────────────────────────
export const AdminTable = ({ columns, rows, onEdit, onDelete, loading }) => (
  <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
    {loading ? (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
      </div>
    ) : rows.length === 0 ? (
      <div className="text-center py-16 text-gray-500">No records found.</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/80">
              {columns.map(c => (
                <th key={c.key} className="text-left text-gray-400 font-semibold px-5 py-3 whitespace-nowrap">
                  {c.label}
                </th>
              ))}
              <th className="text-right text-gray-400 font-semibold px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {rows.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-gray-700/20 transition-colors">
                {columns.map(c => (
                  <td key={c.key} className="px-5 py-3 text-gray-300 max-w-xs">
                    {c.render ? c.render(row[c.key], row) : (
                      <span className="truncate block">{row[c.key] ?? '—'}</span>
                    )}
                  </td>
                ))}
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1.5 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all"
                      >
                        <FiEdit2 size={15} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)

// ── Modal ─────────────────────────────────────────────────────────────────────
export const AdminModal = ({ title, onClose, onSave, saving, children }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
        <h2 className="text-white font-bold text-lg">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
          <FiX size={20} />
        </button>
      </div>
      <div className="p-6 space-y-4">{children}</div>
      <div className="flex justify-end space-x-3 p-6 border-t border-gray-700 sticky bottom-0 bg-gray-900">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm font-medium transition-colors">
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-semibold flex items-center space-x-2 disabled:opacity-50 transition-all hover:shadow-lg"
        >
          {saving ? <><FiLoader size={14} className="animate-spin" /><span>Saving...</span></> : <><FiSave size={14} /><span>Save</span></>}
        </button>
      </div>
    </div>
  </div>
)

// ── Page Header ───────────────────────────────────────────────────────────────
export const AdminPageHeader = ({ title, subtitle, onAdd, addLabel = 'Add New', search, onSearch }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h1 className="text-xl font-black text-white">{title}</h1>
      {subtitle && <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>}
    </div>
    <div className="flex items-center space-x-3">
      {onSearch !== undefined && (
        <div className="relative">
          <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={15} />
          <input
            type="text"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 w-48"
          />
        </div>
      )}
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
        >
          <FiPlus size={16} />
          <span>{addLabel}</span>
        </button>
      )}
    </div>
  </div>
)

// ── Form Field ────────────────────────────────────────────────────────────────
export const Field = ({ label, children, required }) => (
  <div>
    <label className="block text-gray-300 text-sm font-medium mb-1.5">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
  </div>
)

export const Input = ({ ...props }) => (
  <input
    {...props}
    className={`w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder-gray-500 ${props.className || ''}`}
  />
)

export const Textarea = ({ ...props }) => (
  <textarea
    {...props}
    rows={props.rows || 4}
    className={`w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder-gray-500 resize-none ${props.className || ''}`}
  />
)

export const Select = ({ options, ...props }) => (
  <select
    {...props}
    className={`w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 transition-colors ${props.className || ''}`}
  >
    {options.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
)

export const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center space-x-3 cursor-pointer">
    <div
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-orange-500' : 'bg-gray-600'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </div>
    <span className="text-gray-300 text-sm">{label}</span>
  </label>
)

// ── Status Badge ──────────────────────────────────────────────────────────────
export const Badge = ({ label, color = 'gray' }) => {
  const colors = {
    green: 'bg-green-500/20 text-green-400 border-green-500/40',
    red: 'bg-red-500/20 text-red-400 border-red-500/40',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    gray: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}>
      {label}
    </span>
  )
}

// ── Confirm Delete Dialog ─────────────────────────────────────────────────────
export const ConfirmDelete = ({ item, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <FiTrash2 className="text-red-400" size={22} />
      </div>
      <h3 className="text-white font-bold text-center mb-2">Delete Confirmation</h3>
      <p className="text-gray-400 text-sm text-center mb-6">
        Are you sure you want to delete <span className="text-white font-semibold">"{item}"</span>? This cannot be undone.
      </p>
      <div className="flex space-x-3">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm font-medium transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-colors">
          Delete
        </button>
      </div>
    </div>
  </div>
)
