import React, { useEffect, useState } from 'react'
import { workoutAPI } from '../../services/api'
import { AdminTable, AdminModal, AdminPageHeader, ConfirmDelete, Field, Input, Textarea, Select, Toggle, Badge } from './AdminComponents'

const DIET_TYPES = [
  { value: 'regular', label: 'Regular' }, { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' }, { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' }, { value: 'gluten_free', label: 'Gluten Free' },
]
const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' },
]
const empty = { title: '', description: '', difficulty_level: 'beginner', calories_per_day: 2000, protein_grams: 150, carbs_grams: 200, fats_grams: 65, duration_days: 7, dietary_type: 'regular', meals_per_day: 3, is_active: true }

const AdminMealPlans = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => {
    setLoading(true)
    try { const r = await workoutAPI.getMealPlans(); setPlans(r.data.results || r.data) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const save = async () => {
    setSaving(true)
    try {
      if (modal === 'edit') { await workoutAPI.updateMealPlan(form.id, form); setMsg('Updated!') }
      else { await workoutAPI.createMealPlan(form); setMsg('Created!') }
      setModal(null); load()
    } catch (e) { setMsg('Error saving') } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    try { await workoutAPI.deleteMealPlan(deleting.id); setMsg('Deleted'); setDeleting(null); load() }
    catch { setMsg('Delete failed') }
  }

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) })

  const cols = [
    { key: 'title', label: 'Title' },
    { key: 'dietary_type', label: 'Diet', render: v => <Badge label={v} color="blue" /> },
    { key: 'calories_per_day', label: 'Cal/Day' },
    { key: 'duration_days', label: 'Days' },
    { key: 'meals_per_day', label: 'Meals/Day' },
    { key: 'is_active', label: 'Active', render: v => <Badge label={v ? 'Active' : 'Hidden'} color={v ? 'green' : 'gray'} /> },
  ]

  return (
    <div className="p-6">
      <AdminPageHeader title="Meal Plans" subtitle={`${plans.length} total plans`} onAdd={() => { setForm(empty); setModal('create') }} addLabel="Add Meal Plan" search={search} onSearch={setSearch} />
      {msg && <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-xl text-sm">{msg}</div>}
      <AdminTable columns={cols} rows={plans.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))} loading={loading} onEdit={r => { setForm(r); setModal('edit') }} onDelete={setDeleting} />
      {modal && (
        <AdminModal title={modal === 'edit' ? 'Edit Meal Plan' : 'New Meal Plan'} onClose={() => setModal(null)} onSave={save} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Title" required><Input {...f('title')} placeholder="e.g. High Protein Muscle Builder" /></Field></div>
            <div className="col-span-2"><Field label="Description"><Textarea {...f('description')} placeholder="Describe this meal plan..." /></Field></div>
            <Field label="Diet Type"><Select {...f('dietary_type')} options={DIET_TYPES} /></Field>
            <Field label="Difficulty"><Select {...f('difficulty_level')} options={DIFFICULTIES} /></Field>
            <Field label="Calories/Day"><Input type="number" {...f('calories_per_day')} /></Field>
            <Field label="Duration (days)"><Input type="number" {...f('duration_days')} /></Field>
            <Field label="Protein (g)"><Input type="number" {...f('protein_grams')} /></Field>
            <Field label="Carbs (g)"><Input type="number" {...f('carbs_grams')} /></Field>
            <Field label="Fats (g)"><Input type="number" {...f('fats_grams')} /></Field>
            <Field label="Meals/Day"><Input type="number" {...f('meals_per_day')} /></Field>
            <div className="col-span-2 pt-2"><Toggle label="Active (visible to users)" checked={!!form.is_active} onChange={v => setForm({ ...form, is_active: v })} /></div>
          </div>
        </AdminModal>
      )}
      {deleting && <ConfirmDelete item={deleting.title} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </div>
  )
}
export default AdminMealPlans
