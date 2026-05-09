// AdminSubscriptions.jsx
import React, { useEffect, useState } from 'react'
import { subscriptionAPI } from '../../services/api'
import { AdminTable, AdminModal, AdminPageHeader, ConfirmDelete, Field, Input, Textarea, Select, Toggle, Badge } from './AdminComponents'

const BILLING = [{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' }]
const empty = { name: '', description: '', price: '', billing_cycle: 'monthly', duration_days: 30, max_workouts_per_week: 5, include_meal_plans: false, include_personal_trainer: false, include_nutrition_consultation: false, include_community_access: true, is_active: true, priority: 0 }

const AdminSubscriptions = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => {
    setLoading(true)
    try { const r = await subscriptionAPI.getPlans(); setPlans(r.data.results || r.data) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const save = async () => {
    setSaving(true)
    try {
      if (modal === 'edit') { await subscriptionAPI.updatePlan(form.id, form); setMsg('Plan updated!') }
      else { await subscriptionAPI.createPlan(form); setMsg('Plan created!') }
      setModal(null); load()
    } catch (e) { setMsg('Error saving') } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    try { await subscriptionAPI.deletePlan(deleting.id); setMsg('Deleted'); setDeleting(null); load() }
    catch { setMsg('Delete failed') }
  }

  const f = (key) => ({ value: form[key] ?? '', onChange: e => setForm({ ...form, [key]: e.target.value }) })

  const cols = [
    { key: 'name', label: 'Plan Name' },
    { key: 'price', label: 'Price', render: v => `$${v}` },
    { key: 'billing_cycle', label: 'Billing' },
    { key: 'max_workouts_per_week', label: 'Workouts/Week', render: v => v >= 999 ? 'Unlimited' : v },
    { key: 'include_meal_plans', label: 'Meals', render: v => <Badge label={v ? '✓' : '✗'} color={v ? 'green' : 'gray'} /> },
    { key: 'is_active', label: 'Active', render: v => <Badge label={v ? 'Active' : 'Hidden'} color={v ? 'green' : 'gray'} /> },
  ]

  return (
    <div className="p-6">
      <AdminPageHeader title="Subscription Plans" subtitle="Manage pricing tiers" onAdd={() => { setForm(empty); setModal('create') }} addLabel="Add Plan" />
      {msg && <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-xl text-sm">{msg}</div>}
      <AdminTable columns={cols} rows={plans} loading={loading} onEdit={r => { setForm(r); setModal('edit') }} onDelete={setDeleting} />
      {modal && (
        <AdminModal title={modal === 'edit' ? 'Edit Plan' : 'New Plan'} onClose={() => setModal(null)} onSave={save} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Plan Name" required><Input {...f('name')} placeholder="e.g. Transform" /></Field>
            <Field label="Price (USD)" required><Input type="number" step="0.01" {...f('price')} placeholder="19.99" /></Field>
            <Field label="Billing Cycle"><Select {...f('billing_cycle')} options={BILLING} /></Field>
            <Field label="Duration (days)"><Input type="number" {...f('duration_days')} /></Field>
            <div className="col-span-2"><Field label="Description"><Textarea {...f('description')} rows={2} /></Field></div>
            <Field label="Max Workouts/Week"><Input type="number" {...f('max_workouts_per_week')} placeholder="999 = unlimited" /></Field>
            <Field label="Priority (sort order)"><Input type="number" {...f('priority')} /></Field>
            <div className="col-span-2 grid grid-cols-2 gap-3 pt-2">
              <Toggle label="Include Meal Plans" checked={!!form.include_meal_plans} onChange={v => setForm({ ...form, include_meal_plans: v })} />
              <Toggle label="Personal Trainer" checked={!!form.include_personal_trainer} onChange={v => setForm({ ...form, include_personal_trainer: v })} />
              <Toggle label="Nutrition Consultation" checked={!!form.include_nutrition_consultation} onChange={v => setForm({ ...form, include_nutrition_consultation: v })} />
              <Toggle label="Community Access" checked={!!form.include_community_access} onChange={v => setForm({ ...form, include_community_access: v })} />
              <Toggle label="Active (visible)" checked={!!form.is_active} onChange={v => setForm({ ...form, is_active: v })} />
            </div>
          </div>
        </AdminModal>
      )}
      {deleting && <ConfirmDelete item={deleting.name} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </div>
  )
}

export default AdminSubscriptions
