import React, { useEffect, useState } from 'react'
import { workoutAPI } from '../../services/api'
import {
  AdminTable, AdminModal, AdminPageHeader, ConfirmDelete,
  Field, Input, Textarea, Select, Toggle, Badge
} from './AdminComponents'

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const empty = {
  title: '', description: '', difficulty_level: 'beginner',
  duration_minutes: 30, calories_burnt: 0, instructions: '',
  video_url: '', equipment_needed: [], muscle_groups: [],
  is_featured: false, is_active: true, category: '',
}

const AdminWorkouts = () => {
  const [workouts, setWorkouts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | 'edit'
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [w, c] = await Promise.all([workoutAPI.getWorkouts(), workoutAPI.getCategories()])
      setWorkouts(w.data.results || w.data)
      setCategories(c.data.results || c.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const openCreate = () => { setForm(empty); setModal('create') }
  const openEdit = (row) => { setForm({ ...row, category: row.category || '' }); setModal('edit') }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        equipment_needed: typeof form.equipment_needed === 'string'
          ? form.equipment_needed.split(',').map(s => s.trim()).filter(Boolean)
          : form.equipment_needed,
        muscle_groups: typeof form.muscle_groups === 'string'
          ? form.muscle_groups.split(',').map(s => s.trim()).filter(Boolean)
          : form.muscle_groups,
      }
      if (modal === 'edit') {
        await workoutAPI.updateWorkout(form.id, payload)
        setMsg('Workout updated!')
      } else {
        await workoutAPI.createWorkout(payload)
        setMsg('Workout created!')
      }
      setModal(null)
      load()
    } catch (e) {
      setMsg(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving')
    } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    try {
      await workoutAPI.deleteWorkout(deleting.id)
      setMsg('Workout deleted')
      setDeleting(null)
      load()
    } catch (e) { setMsg('Delete failed') }
  }

  const filtered = workouts.filter(w =>
    w.title?.toLowerCase().includes(search.toLowerCase())
  )

  const cols = [
    { key: 'title', label: 'Title' },
    { key: 'difficulty_level', label: 'Level', render: v => <Badge label={v} color={v === 'beginner' ? 'green' : v === 'intermediate' ? 'yellow' : 'red'} /> },
    { key: 'duration_minutes', label: 'Duration', render: v => `${v} min` },
    { key: 'calories_burnt', label: 'Calories' },
    { key: 'rating', label: 'Rating', render: v => `${Number(v || 0).toFixed(1)} ★` },
    { key: 'is_featured', label: 'Featured', render: v => <Badge label={v ? 'Yes' : 'No'} color={v ? 'orange' : 'gray'} /> },
    { key: 'is_active', label: 'Active', render: v => <Badge label={v ? 'Active' : 'Hidden'} color={v ? 'green' : 'gray'} /> },
  ]

  const catOptions = [{ value: '', label: 'No Category' }, ...categories.map(c => ({ value: c.id, label: c.name }))]

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Workouts" subtitle={`${workouts.length} total workouts`}
        onAdd={openCreate} addLabel="Add Workout"
        search={search} onSearch={setSearch}
      />

      {msg && <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-xl text-sm">{msg}</div>}

      <AdminTable columns={cols} rows={filtered} loading={loading} onEdit={openEdit} onDelete={setDeleting} />

      {modal && (
        <AdminModal
          title={modal === 'edit' ? 'Edit Workout' : 'New Workout'}
          onClose={() => setModal(null)} onSave={save} saving={saving}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Title" required>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. 30-Minute HIIT Blast" />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Description" required>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe this workout..." />
              </Field>
            </div>
            <Field label="Category">
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} options={catOptions} />
            </Field>
            <Field label="Difficulty" required>
              <Select value={form.difficulty_level} onChange={e => setForm({ ...form, difficulty_level: e.target.value })} options={DIFFICULTIES} />
            </Field>
            <Field label="Duration (minutes)" required>
              <Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} />
            </Field>
            <Field label="Calories Burned">
              <Input type="number" value={form.calories_burnt} onChange={e => setForm({ ...form, calories_burnt: e.target.value })} />
            </Field>
            <div className="col-span-2">
              <Field label="Instructions">
                <Textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} rows={3} placeholder="Step-by-step instructions..." />
              </Field>
            </div>
            <Field label="Equipment (comma-separated)">
              <Input
                value={Array.isArray(form.equipment_needed) ? form.equipment_needed.join(', ') : form.equipment_needed}
                onChange={e => setForm({ ...form, equipment_needed: e.target.value })}
                placeholder="dumbbells, mat, barbell"
              />
            </Field>
            <Field label="Muscle Groups (comma-separated)">
              <Input
                value={Array.isArray(form.muscle_groups) ? form.muscle_groups.join(', ') : form.muscle_groups}
                onChange={e => setForm({ ...form, muscle_groups: e.target.value })}
                placeholder="chest, back, legs"
              />
            </Field>
            <Field label="Video URL">
              <Input value={form.video_url || ''} onChange={e => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/..." />
            </Field>
            <div className="flex flex-col space-y-3 pt-2">
              <Toggle label="Featured workout" checked={!!form.is_featured} onChange={v => setForm({ ...form, is_featured: v })} />
              <Toggle label="Active (visible)" checked={!!form.is_active} onChange={v => setForm({ ...form, is_active: v })} />
            </div>
          </div>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDelete item={deleting.title} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
      )}
    </div>
  )
}

export default AdminWorkouts
