import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import { AdminTable, AdminModal, AdminPageHeader, Field, Input, Select, Toggle, Badge } from './AdminComponents'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => {
    setLoading(true)
    try { const r = await adminAPI.getUsers(); setUsers(r.data.results || r.data) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const save = async () => {
    setSaving(true)
    try {
      await adminAPI.updateUser(form.id, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        is_active: form.is_active,
        is_staff: form.is_staff,
      })
      setMsg('User updated!')
      setModal(null)
      load()
    } catch (e) { setMsg('Error updating user') } finally { setSaving(false) }
  }

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(search.toLowerCase())
  )

  const cols = [
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'first_name', label: 'Name', render: (v, row) => `${v || ''} ${row.last_name || ''}`.trim() || '—' },
    { key: 'fitness_level', label: 'Level', render: v => v ? <Badge label={v} color="blue" /> : '—' },
    { key: 'is_staff', label: 'Staff', render: v => <Badge label={v ? 'Staff' : 'User'} color={v ? 'orange' : 'gray'} /> },
    { key: 'is_active', label: 'Status', render: v => <Badge label={v ? 'Active' : 'Inactive'} color={v ? 'green' : 'red'} /> },
    { key: 'created_at', label: 'Joined', render: v => v ? new Date(v).toLocaleDateString() : '—' },
  ]

  return (
    <div className="p-6">
      <AdminPageHeader title="Users" subtitle={`${users.length} total users`} search={search} onSearch={setSearch} />
      {msg && <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-xl text-sm">{msg}</div>}
      <AdminTable columns={cols} rows={filtered} loading={loading} onEdit={r => { setForm(r); setModal('edit') }} />
      {modal && (
        <AdminModal title="Edit User" onClose={() => setModal(null)} onSave={save} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name"><Input value={form.first_name || ''} onChange={e => setForm({ ...form, first_name: e.target.value })} /></Field>
            <Field label="Last Name"><Input value={form.last_name || ''} onChange={e => setForm({ ...form, last_name: e.target.value })} /></Field>
            <div className="col-span-2"><Field label="Email"><Input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></Field></div>
            <div className="col-span-2 grid grid-cols-2 gap-3 pt-2">
              <Toggle label="Active account" checked={!!form.is_active} onChange={v => setForm({ ...form, is_active: v })} />
              <Toggle label="Staff (admin access)" checked={!!form.is_staff} onChange={v => setForm({ ...form, is_staff: v })} />
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-800 rounded-xl text-xs text-gray-400">
            <p>Username: <span className="text-white">{form.username}</span></p>
            <p>Joined: <span className="text-white">{form.created_at ? new Date(form.created_at).toLocaleDateString() : '—'}</span></p>
          </div>
        </AdminModal>
      )}
    </div>
  )
}

export default AdminUsers
