import React, { useEffect, useState } from 'react'
import { cmsAPI, coreAPI } from '../../services/api'
import api from '../../services/api'
import { AdminTable, AdminModal, AdminPageHeader, ConfirmDelete, Field, Input, Textarea, Select, Toggle, Badge } from './AdminComponents'

// ── Messages ──────────────────────────────────────────────────────────────────
export const AdminMessages = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')

  const STATUS_OPTIONS = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ]
  const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ]
  const CATEGORY_OPTIONS = [
    { value: 'general', label: 'General' },
    { value: 'account', label: 'Account Access' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'coaching', label: 'Coaching & Sessions' },
    { value: 'cancellation', label: 'Cancellation' },
    { value: 'feedback', label: 'Feedback / Feature Request' },
  ]

  const loadTickets = async () => {
    setLoading(true)
    try {
      const response = await coreAPI.getSupportTickets()
      setTickets(response.data.results || response.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const cols = [
    { key: 'subject', label: 'Subject' },
    { key: 'requester_name', label: 'Requester', render: (v, row) => v || row.name || '—' },
    { key: 'email', label: 'Email' },
    { key: 'category', label: 'Category', render: v => <Badge label={v?.replace('_', ' ') || 'general'} color={v === 'billing' ? 'orange' : v === 'technical' ? 'red' : v === 'coaching' ? 'blue' : 'gray'} /> },
    { key: 'priority', label: 'Priority', render: v => <Badge label={v} color={v === 'urgent' ? 'red' : v === 'high' ? 'orange' : v === 'medium' ? 'blue' : 'gray'} /> },
    { key: 'status', label: 'Status', render: v => <Badge label={v.replace('_', ' ')} color={v === 'open' ? 'orange' : v === 'in_progress' ? 'blue' : v === 'resolved' ? 'green' : 'gray'} /> },
    { key: 'created_at', label: 'Date', render: v => v ? new Date(v).toLocaleDateString() : '—' },
  ]

  const filteredTickets = tickets.filter(ticket =>
    [ticket.subject, ticket.name, ticket.email, ticket.category, ticket.status, ticket.priority]
      .filter(Boolean)
      .some(value => value.toLowerCase().includes(search.toLowerCase()))
  )

  const openCount = tickets.filter(ticket => ticket.status === 'open').length
  const urgentCount = tickets.filter(ticket => ticket.priority === 'urgent').length

  const openTicket = (ticket) => {
    setForm({ ...ticket })
    setModal('edit')
  }

  const save = async () => {
    setSaving(true)
    try {
      await coreAPI.updateSupportTicket(form.id, {
        status: form.status,
        priority: form.priority,
        category: form.category,
        admin_notes: form.admin_notes,
      })
      setMsg('Ticket updated.')
      setModal(null)
      setForm({})
      await loadTickets()
    } catch (error) {
      setMsg('Could not update ticket.')
    } finally {
      setSaving(false)
    }
  }

  const f = (key) => ({ value: form[key] ?? '', onChange: event => setForm({ ...form, [key]: event.target.value }) })

  return (
    <div className="p-6">
      <AdminPageHeader title="Support Inbox" subtitle={`${openCount} open · ${urgentCount} urgent`} search={search} onSearch={setSearch} />
      {msg && <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-xl text-sm">{msg}</div>}
      <AdminTable
        columns={cols}
        rows={filteredTickets}
        loading={loading}
        onEdit={openTicket}
      />
      {modal === 'edit' && (
        <AdminModal title="Ticket Details" onClose={() => setModal(null)} onSave={save} saving={saving}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400">Requester</p><p className="text-white font-semibold">{form.requester_name || form.name}</p></div>
              <div><p className="text-gray-400">Email</p><p className="text-white">{form.email}</p></div>
              <div><p className="text-gray-400">Submitted</p><p className="text-white">{form.created_at ? new Date(form.created_at).toLocaleString() : '—'}</p></div>
              <div><p className="text-gray-400">Triaged</p><p className="text-white">{form.triaged_at ? new Date(form.triaged_at).toLocaleString() : 'Pending'}</p></div>
            </div>

            <div>
              <p className="text-gray-400 mb-1 text-xs uppercase tracking-widest">Subject</p>
              <p className="text-white font-semibold">{form.subject}</p>
            </div>

            <div>
              <p className="text-gray-400 mb-1 text-xs uppercase tracking-widest">Message</p>
              <p className="text-gray-200 bg-gray-800 rounded-xl p-4 leading-relaxed whitespace-pre-wrap">{form.message}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Category">
                <Select {...f('category')} options={CATEGORY_OPTIONS} />
              </Field>
              <Field label="Priority">
                <Select {...f('priority')} options={PRIORITY_OPTIONS} />
              </Field>
              <Field label="Status">
                <Select {...f('status')} options={STATUS_OPTIONS} />
              </Field>
            </div>

            <Field label="Admin Notes">
              <Textarea {...f('admin_notes')} rows={4} placeholder="Internal notes for the support team" />
            </Field>
          </div>
        </AdminModal>
      )}
    </div>
  )
}

// ── Settings ──────────────────────────────────────────────────────────────────
export const AdminSettings = () => {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    cmsAPI.getSettings().then(r => setSettings(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await cmsAPI.updateSettings(settings); setMsg('Settings saved!') }
    catch { setMsg('Error saving settings') } finally { setSaving(false) }
  }

  const f = (key) => ({ value: settings[key] || '', onChange: e => setSettings({ ...settings, [key]: e.target.value }) })

  if (loading) return <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" /></div>

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-black text-white">Site Settings</h1><p className="text-gray-400 text-sm">Configure your website branding and contact info</p></div>
        <button onClick={save} disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      {msg && <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-xl text-sm">{msg}</div>}

      <div className="space-y-6">
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6 space-y-4">
          <h2 className="text-white font-bold">Brand</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Site Name"><Input {...f('site_name')} /></Field>
            <Field label="Tagline"><Input {...f('site_tagline')} /></Field>
            <div className="col-span-2"><Field label="Description"><Textarea {...f('site_description')} rows={2} /></Field></div>
            <Field label="Logo URL"><Input {...f('logo_url')} placeholder="https://..." /></Field>
            <Field label="Hero Image URL"><Input {...f('hero_image_url')} placeholder="https://..." /></Field>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6 space-y-4">
          <h2 className="text-white font-bold">Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email"><Input type="email" {...f('email')} /></Field>
            <Field label="Phone"><Input {...f('phone')} /></Field>
            <div className="col-span-2"><Field label="Address"><Input {...f('address')} /></Field></div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6 space-y-4">
          <h2 className="text-white font-bold">Social Media</h2>
          <div className="grid grid-cols-2 gap-4">
            {['facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url', 'youtube_url'].map(key => (
              <Field key={key} label={key.replace('_url', '').charAt(0).toUpperCase() + key.replace('_url', '').slice(1)}>
                <Input {...f(key)} placeholder="https://..." />
              </Field>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6 space-y-4">
          <h2 className="text-white font-bold">SEO</h2>
          <Field label="Meta Description"><Textarea {...f('meta_description')} rows={2} /></Field>
          <Field label="Meta Keywords"><Input {...f('meta_keywords')} placeholder="fitness, coaching, workouts" /></Field>
        </div>
      </div>
    </div>
  )
}

// ── Challenges ────────────────────────────────────────────────────────────────
export const AdminChallenges = () => {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const GOAL_TYPES = [{ value: 'workouts', label: 'Complete Workouts' }, { value: 'calories', label: 'Burn Calories' }, { value: 'minutes', label: 'Train Minutes' }, { value: 'streak', label: 'Maintain Streak' }]
  const empty = { title: '', description: '', icon: '🏅', goal_type: 'workouts', goal_value: 7, reward_points: 50, start_date: new Date().toISOString().slice(0, 16), end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16), is_active: true }

  useEffect(() => {
    coreAPI.getChallenges().then(r => setChallenges(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...form, start_date: new Date(form.start_date).toISOString(), end_date: new Date(form.end_date).toISOString() }
      if (modal === 'edit') { await api.patch(`/core/challenges/${form.id}/`, payload); setMsg('Updated!') }
      else { await api.post('/core/challenges/', payload); setMsg('Created!') }
      setModal(null)
      coreAPI.getChallenges().then(r => setChallenges(r.data))
    } catch (e) { setMsg('Error saving') } finally { setSaving(false) }
  }

  const f = (key) => ({ value: form[key] ?? '', onChange: e => setForm({ ...form, [key]: e.target.value }) })

  const cols = [
    { key: 'icon', label: '', render: v => <span className="text-2xl">{v}</span> },
    { key: 'title', label: 'Title' },
    { key: 'goal_type', label: 'Goal Type' },
    { key: 'goal_value', label: 'Goal' },
    { key: 'reward_points', label: 'Points' },
    { key: 'participant_count', label: 'Participants' },
    { key: 'is_active', label: 'Active', render: v => <Badge label={v ? 'Active' : 'Ended'} color={v ? 'green' : 'gray'} /> },
  ]

  return (
    <div className="p-6">
      <AdminPageHeader title="Challenges" subtitle="Manage fitness challenges" onAdd={() => { setForm(empty); setModal('create') }} addLabel="New Challenge" />
      {msg && <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-xl text-sm">{msg}</div>}
      <AdminTable columns={cols} rows={challenges} loading={loading} onEdit={r => { setForm({ ...r, start_date: r.start_date?.slice(0, 16), end_date: r.end_date?.slice(0, 16) }); setModal('edit') }} />
      {modal && (
        <AdminModal title={modal === 'edit' ? 'Edit Challenge' : 'New Challenge'} onClose={() => setModal(null)} onSave={save} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title" required><Input {...f('title')} placeholder="7-Day Workout Challenge" /></Field>
            <Field label="Icon (emoji)"><Input {...f('icon')} placeholder="🏅" /></Field>
            <div className="col-span-2"><Field label="Description"><Textarea {...f('description')} rows={2} /></Field></div>
            <Field label="Goal Type"><Select {...f('goal_type')} options={GOAL_TYPES} /></Field>
            <Field label="Goal Value"><Input type="number" {...f('goal_value')} /></Field>
            <Field label="Reward Points"><Input type="number" {...f('reward_points')} /></Field>
            <div />
            <Field label="Start Date"><Input type="datetime-local" {...f('start_date')} /></Field>
            <Field label="End Date"><Input type="datetime-local" {...f('end_date')} /></Field>
            <div className="col-span-2 pt-2"><Toggle label="Active" checked={!!form.is_active} onChange={v => setForm({ ...form, is_active: v })} /></div>
          </div>
        </AdminModal>
      )}
    </div>
  )
}

// ── Coupons ───────────────────────────────────────────────────────────────────
export const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [msg, setMsg] = useState('')

  const DTYPE = [{ value: 'percentage', label: 'Percentage (%)' }, { value: 'fixed', label: 'Fixed Amount ($)' }]
  const empty = { code: '', description: '', discount_type: 'percentage', discount_value: 10, valid_from: new Date().toISOString().slice(0, 16), valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16), max_uses: '', min_purchase_amount: 0, is_active: true }

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/core/coupons/')
      setCoupons(r.data.results || r.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...form, code: form.code.toUpperCase(), valid_from: new Date(form.valid_from).toISOString(), valid_until: new Date(form.valid_until).toISOString() }
      if (modal === 'edit') { await api.patch(`/core/coupons/${form.id}/`, payload); setMsg('Updated!') }
      else { await api.post('/core/coupons/', payload); setMsg('Created!') }
      setModal(null); load()
    } catch (e) { setMsg('Error saving') } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    try {
      await api.delete(`/core/coupons/${deleting.id}/`)
      setMsg('Deleted'); setDeleting(null); load()
    } catch { setMsg('Delete failed') }
  }

  const f = (key) => ({ value: form[key] ?? '', onChange: e => setForm({ ...form, [key]: e.target.value }) })

  const cols = [
    { key: 'code', label: 'Code', render: v => <span className="font-mono font-bold text-orange-400">{v}</span> },
    { key: 'discount_type', label: 'Type' },
    { key: 'discount_value', label: 'Value', render: (v, row) => row.discount_type === 'percentage' ? `${v}%` : `$${v}` },
    { key: 'times_used', label: 'Used', render: (v, row) => `${v} / ${row.max_uses || '∞'}` },
    { key: 'valid_until', label: 'Expires', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'is_active', label: 'Active', render: v => <Badge label={v ? 'Active' : 'Inactive'} color={v ? 'green' : 'gray'} /> },
  ]

  return (
    <div className="p-6">
      <AdminPageHeader title="Coupons" subtitle="Manage discount codes" onAdd={() => { setForm(empty); setModal('create') }} addLabel="New Coupon" />
      {msg && <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-xl text-sm">{msg}</div>}
      <AdminTable columns={cols} rows={coupons} loading={loading} onEdit={r => { setForm({ ...r, valid_from: r.valid_from?.slice(0, 16), valid_until: r.valid_until?.slice(0, 16) }); setModal('edit') }} onDelete={setDeleting} />
      {modal && (
        <AdminModal title={modal === 'edit' ? 'Edit Coupon' : 'New Coupon'} onClose={() => setModal(null)} onSave={save} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code" required><Input {...f('code')} placeholder="WELCOME20" className="uppercase" /></Field>
            <Field label="Discount Type"><Select {...f('discount_type')} options={DTYPE} /></Field>
            <Field label="Discount Value" required><Input type="number" step="0.01" {...f('discount_value')} /></Field>
            <Field label="Min Purchase ($)"><Input type="number" step="0.01" {...f('min_purchase_amount')} /></Field>
            <Field label="Max Uses (blank = unlimited)"><Input type="number" {...f('max_uses')} placeholder="Leave blank for unlimited" /></Field>
            <div />
            <Field label="Valid From"><Input type="datetime-local" {...f('valid_from')} /></Field>
            <Field label="Valid Until"><Input type="datetime-local" {...f('valid_until')} /></Field>
            <div className="col-span-2"><Field label="Description"><Input {...f('description')} placeholder="e.g. Welcome discount for new members" /></Field></div>
            <div className="col-span-2 pt-2"><Toggle label="Active" checked={!!form.is_active} onChange={v => setForm({ ...form, is_active: v })} /></div>
          </div>
        </AdminModal>
      )}
      {deleting && <ConfirmDelete item={deleting.code} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </div>
  )
}

// ── Newsletter ────────────────────────────────────────────────────────────────
export const AdminNewsletter = () => {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    cmsAPI.getNewsletterSubscribers().then(r => setSubscribers(r.data.results || r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const cols = [
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Name', render: v => v || '—' },
    { key: 'is_active', label: 'Status', render: v => <Badge label={v ? 'Subscribed' : 'Unsubscribed'} color={v ? 'green' : 'gray'} /> },
    { key: 'subscribed_at', label: 'Subscribed', render: v => v ? new Date(v).toLocaleDateString() : '—' },
  ]

  return (
    <div className="p-6">
      <AdminPageHeader title="Newsletter" subtitle={`${subscribers.filter(s => s.is_active).length} active subscribers`} search={search} onSearch={setSearch} />
      <AdminTable
        columns={cols}
        rows={subscribers.filter(s => s.email?.toLowerCase().includes(search.toLowerCase()))}
        loading={loading}
      />
    </div>
  )
}

// ── Pages ─────────────────────────────────────────────────────────────────────
export const AdminPages = () => {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [msg, setMsg] = useState('')

  const empty = { title: '', content: '', is_visible: true, show_in_footer: false, show_in_menu: false, meta_description: '' }

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/cms/pages/')
      setPages(r.data.results || r.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      if (modal === 'edit') { await api.patch(`/cms/pages/${form.slug}/`, form); setMsg('Updated!') }
      else { await api.post('/cms/pages/', form); setMsg('Created!') }
      setModal(null); load()
    } catch (e) { setMsg('Error saving') } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    try {
      await api.delete(`/cms/pages/${deleting.slug}/`)
      setMsg('Deleted'); setDeleting(null); load()
    } catch { setMsg('Delete failed') }
  }

  const f = (key) => ({ value: form[key] ?? '', onChange: e => setForm({ ...form, [key]: e.target.value }) })

  const cols = [
    { key: 'title', label: 'Title' },
    { key: 'slug', label: 'Slug', render: v => <span className="font-mono text-xs text-gray-400">/{v}</span> },
    { key: 'show_in_footer', label: 'Footer', render: v => <Badge label={v ? 'Yes' : 'No'} color={v ? 'green' : 'gray'} /> },
    { key: 'show_in_menu', label: 'Menu', render: v => <Badge label={v ? 'Yes' : 'No'} color={v ? 'green' : 'gray'} /> },
    { key: 'is_visible', label: 'Visible', render: v => <Badge label={v ? 'Yes' : 'No'} color={v ? 'green' : 'gray'} /> },
  ]

  return (
    <div className="p-6">
      <AdminPageHeader title="Pages" subtitle="Manage static pages" onAdd={() => { setForm(empty); setModal('create') }} addLabel="New Page" />
      {msg && <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-xl text-sm">{msg}</div>}
      <AdminTable columns={cols} rows={pages} loading={loading} onEdit={r => { setForm(r); setModal('edit') }} onDelete={setDeleting} />
      {modal && (
        <AdminModal title={modal === 'edit' ? 'Edit Page' : 'New Page'} onClose={() => setModal(null)} onSave={save} saving={saving}>
          <Field label="Title" required><Input {...f('title')} placeholder="e.g. About Us" /></Field>
          <Field label="Content" required><Textarea {...f('content')} rows={8} placeholder="Page content (HTML supported)..." /></Field>
          <Field label="Meta Description"><Input {...f('meta_description')} /></Field>
          <div className="grid grid-cols-3 gap-4 pt-2">
            <Toggle label="Visible" checked={!!form.is_visible} onChange={v => setForm({ ...form, is_visible: v })} />
            <Toggle label="Show in Footer" checked={!!form.show_in_footer} onChange={v => setForm({ ...form, show_in_footer: v })} />
            <Toggle label="Show in Menu" checked={!!form.show_in_menu} onChange={v => setForm({ ...form, show_in_menu: v })} />
          </div>
        </AdminModal>
      )}
      {deleting && <ConfirmDelete item={deleting.title} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </div>
  )
}

export default AdminMessages
