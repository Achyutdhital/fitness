import React, { useEffect, useState } from 'react'
import { cmsAPI } from '../../services/api'
import { AdminTable, AdminModal, AdminPageHeader, ConfirmDelete, Field, Input, Textarea, Select, Toggle, Badge } from './AdminComponents'

const STATUS_OPTIONS = [{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]
const emptyPost = { title: '', content: '', excerpt: '', featured_image_url: '', author: '', status: 'draft', featured: false, tags: '', category_id: '', meta_title: '', meta_description: '', meta_keywords: '' }
const emptyCat = { name: '', description: '', color: '#f97316' }

const AdminBlog = () => {
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyPost)
  const [catModal, setCatModal] = useState(null)
  const [catForm, setCatForm] = useState(emptyCat)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('posts')
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => {
    setLoading(true)
    try {
      const [p, c] = await Promise.all([cmsAPI.getBlogPosts(), cmsAPI.getBlogCategories()])
      setPosts(p.data.results || p.data)
      setCategories(c.data.results || c.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const savePost = async () => {
    setSaving(true)
    try {
      const payload = { ...form, published_date: form.status === 'published' ? new Date().toISOString() : null }
      if (modal === 'edit') { await cmsAPI.updateBlogPost(form.slug, payload); setMsg('Post updated!') }
      else { await cmsAPI.createBlogPost(payload); setMsg('Post created!') }
      setModal(null); load()
    } catch (e) { setMsg('Error saving post') } finally { setSaving(false) }
  }

  const saveCat = async () => {
    setSaving(true)
    try {
      if (catModal === 'edit') { await cmsAPI.updateBlogCategory(catForm.slug, catForm); setMsg('Category updated!') }
      else { await cmsAPI.createBlogCategory(catForm); setMsg('Category created!') }
      setCatModal(null); load()
    } catch (e) { setMsg('Error saving category') } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    try {
      if (deleting.type === 'post') { await cmsAPI.deleteBlogPost(deleting.item.slug); setMsg('Post deleted') }
      else { await cmsAPI.deleteBlogCategory(deleting.item.slug); setMsg('Category deleted') }
      setDeleting(null); load()
    } catch { setMsg('Delete failed') }
  }

  const postCols = [
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    { key: 'status', label: 'Status', render: v => <Badge label={v} color={v === 'published' ? 'green' : v === 'draft' ? 'yellow' : 'gray'} /> },
    { key: 'featured', label: 'Featured', render: v => <Badge label={v ? 'Yes' : 'No'} color={v ? 'orange' : 'gray'} /> },
    { key: 'views_count', label: 'Views' },
    { key: 'created_at', label: 'Created', render: v => v ? new Date(v).toLocaleDateString() : '—' },
  ]

  const catCols = [
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'color', label: 'Color', render: v => <span className="flex items-center space-x-2"><span className="w-4 h-4 rounded-full inline-block" style={{ background: v }} /><span>{v}</span></span> },
    { key: 'description', label: 'Description' },
  ]

  const catOptions = [{ value: '', label: 'No Category' }, ...categories.map(c => ({ value: c.id, label: c.name }))]
  const f = (key, src = form, setter = setForm) => ({ value: src[key] || '', onChange: e => setter({ ...src, [key]: e.target.value }) })

  return (
    <div className="p-6">
      <AdminPageHeader title="Blog" subtitle="Manage posts and categories" onAdd={() => { setForm(emptyPost); setModal('create') }} addLabel="New Post" search={search} onSearch={setSearch} />
      {msg && <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-xl text-sm">{msg}</div>}

      <div className="flex space-x-2 mb-4">
        {[{ id: 'posts', label: `Posts (${posts.length})` }, { id: 'categories', label: `Categories (${categories.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{t.label}</button>
        ))}
        {tab === 'categories' && <button onClick={() => { setCatForm(emptyCat); setCatModal('create') }} className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all">+ Add Category</button>}
      </div>

      {tab === 'posts' && <AdminTable columns={postCols} rows={posts.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))} loading={loading} onEdit={r => { setForm({ ...r, category_id: r.category?.id || '' }); setModal('edit') }} onDelete={r => setDeleting({ type: 'post', item: r })} />}
      {tab === 'categories' && <AdminTable columns={catCols} rows={categories} loading={loading} onEdit={r => { setCatForm(r); setCatModal('edit') }} onDelete={r => setDeleting({ type: 'cat', item: r })} />}

      {modal && (
        <AdminModal title={modal === 'edit' ? 'Edit Post' : 'New Post'} onClose={() => setModal(null)} onSave={savePost} saving={saving}>
          <Field label="Title" required><Input {...f('title')} placeholder="Post title..." /></Field>
          
          <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700 mb-4">
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-3 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              <span>SEO Meta Data</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Meta Title"><Input {...f('meta_title')} placeholder="Browser tab title..." /></Field>
              <Field label="Meta Keywords"><Input {...f('meta_keywords')} placeholder="keywords, separated, by, commas" /></Field>
              <div className="md:col-span-2">
                <Field label="Meta Description"><Textarea {...f('meta_description')} rows={2} placeholder="Search engine description (max 160 chars)..." /></Field>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Author"><Input {...f('author')} placeholder="Author name" /></Field>
            <Field label="Status"><Select {...f('status')} options={STATUS_OPTIONS} /></Field>
            <Field label="Category"><Select value={form.category_id || ''} onChange={e => setForm({ ...form, category_id: e.target.value })} options={catOptions} /></Field>
            <Field label="Tags (comma-separated)"><Input {...f('tags')} placeholder="fitness, nutrition, tips" /></Field>
          </div>
          <Field label="Featured Image URL"><Input {...f('featured_image_url')} placeholder="https://images.unsplash.com/..." /></Field>
          <Field label="Excerpt"><Textarea {...f('excerpt')} rows={2} placeholder="Short summary shown in lists..." /></Field>
          <Field label="Content" required><Textarea {...f('content')} rows={8} placeholder="Write your blog post content here..." /></Field>
          <Toggle label="Featured post (shown on homepage)" checked={!!form.featured} onChange={v => setForm({ ...form, featured: v })} />
        </AdminModal>
      )}

      {catModal && (
        <AdminModal title={catModal === 'edit' ? 'Edit Category' : 'New Category'} onClose={() => setCatModal(null)} onSave={saveCat} saving={saving}>
          <Field label="Name" required><Input {...f('name', catForm, setCatForm)} placeholder="e.g. Nutrition" /></Field>
          <Field label="Description"><Textarea {...f('description', catForm, setCatForm)} rows={2} /></Field>
          <Field label="Color (hex)"><Input {...f('color', catForm, setCatForm)} placeholder="#f97316" /></Field>
        </AdminModal>
      )}

      {deleting && <ConfirmDelete item={deleting.item.title || deleting.item.name} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </div>
  )
}
export default AdminBlog
