import React, { useEffect, useMemo, useState } from 'react'
import { cmsAPI } from '../../services/api'
import { AdminTable, AdminModal, AdminPageHeader, ConfirmDelete, Field, Input, Textarea, Select, Toggle, Badge } from './AdminComponents'

const PAGE_OPTIONS = [
  { value: 'home', label: 'Homepage' },
  { value: 'about', label: 'About' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Other' },
]

const SECTION_OPTIONS = [
  { value: 'hero', label: 'Hero Section' },
  { value: 'features', label: 'Features Grid' },
  { value: 'pricing', label: 'Pricing Table' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'cta', label: 'Call to Action' },
  { value: 'text', label: 'Text Block' },
  { value: 'gallery', label: 'Image Gallery' },
  { value: 'team', label: 'Team Members' },
  { value: 'faq', label: 'FAQ Section' },
  { value: 'banner', label: 'Banner' },
  { value: 'custom', label: 'Custom HTML' },
]

const CYCLE_OPTIONS = [
  { value: 'primary', label: 'Primary Button' },
  { value: 'secondary', label: 'Secondary Button' },
  { value: 'outline', label: 'Outline Button' },
]

const ASSET_CATEGORIES = [
  { value: '', label: 'Uncategorized' },
  { value: 'hero', label: 'Hero Images' },
  { value: 'icon', label: 'Icons' },
  { value: 'team', label: 'Team Photos' },
  { value: 'testimonial', label: 'Testimonials' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'logo', label: 'Logos' },
  { value: 'banner', label: 'Banners' },
  { value: 'other', label: 'Other' },
]

const emptyPage = {
  title: '',
  slug: '',
  content: '',
  is_visible: true,
  show_in_footer: false,
  show_in_menu: false,
  meta_description: '',
  meta_keywords: '',
}

const emptySection = {
  page: 'home',
  section_type: 'hero',
  title: '',
  subtitle: '',
  description: '',
  image_url: '',
  background_color: '#111827',
  text_color: '#ffffff',
  columns: 3,
  is_visible: true,
  display_order: 0,
  cta_text: '',
  cta_url: '',
  cta_style: 'primary',
  custom_html: '',
  custom_css: '',
}

const emptyAsset = {
  name: '',
  description: '',
  alt_text: '',
  category: '',
  image_url: '',
  width: '',
  height: '',
  file_size: '',
}

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const AdminPages = () => {
  const [tab, setTab] = useState('pages')
  const [pages, setPages] = useState([])
  const [sections, setSections] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyPage)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [msg, setMsg] = useState('')
  const [assetFile, setAssetFile] = useState(null)
  const [sectionFilter, setSectionFilter] = useState('')
  const [editingSlug, setEditingSlug] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [pagesRes, sectionsRes, assetsRes] = await Promise.all([
        cmsAPI.getPages(),
        cmsAPI.getAllSections(),
        cmsAPI.getImageAssets(),
      ])
      setPages(pagesRes.data.results || pagesRes.data || [])
      setSections(sectionsRes.data.results || sectionsRes.data || [])
      setAssets(assetsRes.data.results || assetsRes.data || [])
    } catch (error) {
      console.error(error)
      setMsg('Failed to load CMS data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const savePage = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.title),
      }
      if (modal === 'edit-page') {
        await cmsAPI.updatePage(editingSlug, payload)
        setMsg('Page updated')
      } else {
        await cmsAPI.createPage(payload)
        setMsg('Page created')
      }
      setModal(null)
      setEditingSlug('')
      await load()
    } catch (error) {
      setMsg(error.response?.data ? JSON.stringify(error.response.data) : 'Error saving page')
    } finally {
      setSaving(false)
    }
  }

  const saveSection = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        columns: Number(form.columns || 1),
        display_order: Number(form.display_order || 0),
      }
      if (modal === 'edit-section') {
        await cmsAPI.updateSection(form.id, payload)
        setMsg('Section updated')
      } else {
        await cmsAPI.createSection(payload)
        setMsg('Section created')
      }
      setModal(null)
      await load()
    } catch (error) {
      setMsg(error.response?.data ? JSON.stringify(error.response.data) : 'Error saving section')
    } finally {
      setSaving(false)
    }
  }

  const saveAsset = async () => {
    setSaving(true)
    try {
      const payload = new FormData()
      payload.append('name', form.name)
      payload.append('description', form.description || '')
      payload.append('alt_text', form.alt_text || '')
      payload.append('category', form.category || '')
      payload.append('image_url', form.image_url || '')
      if (form.width) payload.append('width', form.width)
      if (form.height) payload.append('height', form.height)
      if (form.file_size) payload.append('file_size', form.file_size)
      if (assetFile) payload.append('image', assetFile)

      if (modal === 'edit-asset') {
        await cmsAPI.updateImageAsset(form.id, payload)
        setMsg('Asset updated')
      } else {
        await cmsAPI.uploadImageAsset(payload)
        setMsg('Asset uploaded')
      }
      setModal(null)
      setAssetFile(null)
      await load()
    } catch (error) {
      setMsg(error.response?.data ? JSON.stringify(error.response.data) : 'Error saving asset')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    try {
      if (deleting.type === 'page') {
        await cmsAPI.deletePage(deleting.item.slug)
      } else if (deleting.type === 'section') {
        await cmsAPI.deleteSection(deleting.item.id)
      } else {
        await cmsAPI.deleteImageAsset(deleting.item.id)
      }
      setMsg('Deleted successfully')
      setDeleting(null)
      await load()
    } catch (error) {
      setMsg('Delete failed')
    }
  }

  const filteredPages = useMemo(
    () => pages.filter((page) => page.title?.toLowerCase().includes(search.toLowerCase())),
    [pages, search]
  )

  const filteredSections = useMemo(
    () => sections.filter((section) => {
      const matchesSearch = section.title?.toLowerCase().includes(search.toLowerCase()) || section.section_type?.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = !sectionFilter || section.page === sectionFilter
      return matchesSearch && matchesFilter
    }),
    [sections, search, sectionFilter]
  )

  const filteredAssets = useMemo(
    () => assets.filter((asset) => asset.name?.toLowerCase().includes(search.toLowerCase())),
    [assets, search]
  )

  const pageCols = [
    { key: 'title', label: 'Title' },
    { key: 'slug', label: 'Slug', render: (value) => <span className="font-mono text-xs text-gray-400">/{value}</span> },
    { key: 'show_in_menu', label: 'Menu', render: (value) => <Badge label={value ? 'Yes' : 'No'} color={value ? 'green' : 'gray'} /> },
    { key: 'show_in_footer', label: 'Footer', render: (value) => <Badge label={value ? 'Yes' : 'No'} color={value ? 'green' : 'gray'} /> },
    { key: 'is_visible', label: 'Visible', render: (value) => <Badge label={value ? 'Yes' : 'No'} color={value ? 'green' : 'gray'} /> },
  ]

  const sectionCols = [
    { key: 'page', label: 'Page', render: (value) => <Badge label={value} color="blue" /> },
    { key: 'section_type', label: 'Type', render: (value) => <span className="capitalize">{value}</span> },
    { key: 'title', label: 'Title' },
    { key: 'display_order', label: 'Order' },
    { key: 'is_visible', label: 'Visible', render: (value) => <Badge label={value ? 'Yes' : 'No'} color={value ? 'green' : 'gray'} /> },
  ]

  const assetCols = [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category', render: (value) => <span className="capitalize">{value || 'uncategorized'}</span> },
    { key: 'resolved_image_url', label: 'Preview', render: (value) => value ? <a className="text-orange-400 hover:underline" href={value} target="_blank" rel="noreferrer">Open</a> : '—' },
    { key: 'alt_text', label: 'Alt Text' },
  ]

  const renderAssetPreview = (asset) => {
    const imageUrl = assetFile ? URL.createObjectURL(assetFile) : asset.resolved_image_url || asset.image_url
    return imageUrl ? (
      <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-900">
        <img src={imageUrl} alt={form.alt_text || form.name || 'Asset preview'} className="w-full h-48 object-cover" />
      </div>
    ) : (
      <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900 p-6 text-gray-500 text-sm">No preview available</div>
    )
  }

  const currentSectionOptions = [
    { value: '', label: 'All Sections' },
    ...sections.map((section) => ({ value: String(section.id), label: `${section.page} · ${section.title || section.section_type}` })),
  ]

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        title="CMS"
        subtitle="Manage pages, sections, and image assets"
        onAdd={() => {
          if (tab === 'pages') {
            setForm(emptyPage)
            setModal('create-page')
          } else if (tab === 'sections') {
            setForm(emptySection)
            setModal('create-section')
          } else {
            setForm(emptyAsset)
            setAssetFile(null)
            setModal('create-asset')
          }
        }}
        addLabel={tab === 'pages' ? 'New Page' : tab === 'sections' ? 'New Section' : 'Upload Asset'}
        search={search}
        onSearch={setSearch}
      />

      {msg && <div className="p-3 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-xl text-sm">{msg}</div>}

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'pages', label: `Pages (${pages.length})` },
          { id: 'sections', label: `Sections (${sections.length})` },
          { id: 'assets', label: `Assets (${assets.length})` },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === item.id ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {item.label}
          </button>
        ))}
        {tab === 'sections' && (
          <div className="ml-auto min-w-[220px]">
            <Select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} options={currentSectionOptions} />
          </div>
        )}
      </div>

      {tab === 'pages' && (
        <AdminTable
          columns={pageCols}
          rows={filteredPages}
          loading={loading}
          onEdit={(row) => {
            setForm({ ...row })
            setEditingSlug(row.slug)
            setModal('edit-page')
          }}
          onDelete={(row) => setDeleting({ type: 'page', item: row })}
        />
      )}

      {tab === 'sections' && (
        <AdminTable
          columns={sectionCols}
          rows={filteredSections}
          loading={loading}
          onEdit={(row) => {
            setForm({
              ...row,
              columns: row.columns ?? 1,
              display_order: row.display_order ?? 0,
            })
            setModal('edit-section')
          }}
          onDelete={(row) => setDeleting({ type: 'section', item: row })}
        />
      )}

      {tab === 'assets' && (
        <AdminTable
          columns={assetCols}
          rows={filteredAssets}
          loading={loading}
          onEdit={(row) => {
            setForm({ ...row })
            setAssetFile(null)
            setModal('edit-asset')
          }}
          onDelete={(row) => setDeleting({ type: 'asset', item: row })}
        />
      )}

      {modal && (modal === 'create-page' || modal === 'edit-page') && (
        <AdminModal title={modal === 'edit-page' ? 'Edit Page' : 'New Page'} onClose={() => setModal(null)} onSave={savePage} saving={saving}>
          <Field label="Title" required>
            <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} placeholder="About Us" />
          </Field>
          <Field label="Slug" required>
            <Input value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="about-us" />
          </Field>
          <Field label="Content" required>
            <Textarea value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} placeholder="HTML or plain text content" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Meta Description">
              <Input value={form.meta_description || ''} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
            </Field>
            <Field label="Meta Keywords">
              <Input value={form.meta_keywords || ''} onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-2">
            <Toggle label="Visible" checked={!!form.is_visible} onChange={(value) => setForm({ ...form, is_visible: value })} />
            <Toggle label="Show in Footer" checked={!!form.show_in_footer} onChange={(value) => setForm({ ...form, show_in_footer: value })} />
            <Toggle label="Show in Menu" checked={!!form.show_in_menu} onChange={(value) => setForm({ ...form, show_in_menu: value })} />
          </div>
        </AdminModal>
      )}

      {modal && (modal === 'create-section' || modal === 'edit-section') && (
        <AdminModal title={modal === 'edit-section' ? 'Edit Section' : 'New Section'} onClose={() => setModal(null)} onSave={saveSection} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Page" required>
              <Select value={form.page || 'home'} onChange={(e) => setForm({ ...form, page: e.target.value })} options={PAGE_OPTIONS} />
            </Field>
            <Field label="Section Type" required>
              <Select value={form.section_type || 'hero'} onChange={(e) => setForm({ ...form, section_type: e.target.value })} options={SECTION_OPTIONS} />
            </Field>
            <Field label="Title">
              <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Subtitle">
              <Input value={form.subtitle || ''} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </Field>
            <div className="col-span-2">
              <Field label="Description">
                <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
              </Field>
            </div>
            <Field label="Image URL">
              <Input value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </Field>
            <Field label="Display Order">
              <Input type="number" value={form.display_order ?? 0} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
            </Field>
            <Field label="Background Color">
              <Input value={form.background_color || '#111827'} onChange={(e) => setForm({ ...form, background_color: e.target.value })} />
            </Field>
            <Field label="Text Color">
              <Input value={form.text_color || '#ffffff'} onChange={(e) => setForm({ ...form, text_color: e.target.value })} />
            </Field>
            <Field label="Columns">
              <Input type="number" value={form.columns ?? 1} onChange={(e) => setForm({ ...form, columns: e.target.value })} />
            </Field>
            <Field label="CTA Text">
              <Input value={form.cta_text || ''} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} />
            </Field>
            <Field label="CTA URL">
              <Input value={form.cta_url || ''} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} />
            </Field>
            <Field label="CTA Style">
              <Select value={form.cta_style || 'primary'} onChange={(e) => setForm({ ...form, cta_style: e.target.value })} options={CYCLE_OPTIONS} />
            </Field>
            <div className="col-span-2 pt-2">
              <Toggle label="Visible" checked={!!form.is_visible} onChange={(value) => setForm({ ...form, is_visible: value })} />
            </div>
            <div className="col-span-2">
              <Field label="Custom HTML">
                <Textarea value={form.custom_html || ''} onChange={(e) => setForm({ ...form, custom_html: e.target.value })} rows={5} />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Custom CSS">
                <Textarea value={form.custom_css || ''} onChange={(e) => setForm({ ...form, custom_css: e.target.value })} rows={4} />
              </Field>
            </div>
          </div>
        </AdminModal>
      )}

      {modal && (modal === 'create-asset' || modal === 'edit-asset') && (
        <AdminModal title={modal === 'edit-asset' ? 'Edit Asset' : 'Upload Asset'} onClose={() => { setModal(null); setAssetFile(null) }} onSave={saveAsset} saving={saving}>
          <Field label="Name" required>
            <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Homepage Hero" />
          </Field>
          <Field label="Description">
            <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Select value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} options={ASSET_CATEGORIES} />
            </Field>
            <Field label="Alt Text">
              <Input value={form.alt_text || ''} onChange={(e) => setForm({ ...form, alt_text: e.target.value })} />
            </Field>
            <Field label="Width">
              <Input type="number" value={form.width || ''} onChange={(e) => setForm({ ...form, width: e.target.value })} />
            </Field>
            <Field label="Height">
              <Input type="number" value={form.height || ''} onChange={(e) => setForm({ ...form, height: e.target.value })} />
            </Field>
          </div>
          <Field label="Image File">
            <Input type="file" accept="image/*" onChange={(e) => setAssetFile(e.target.files?.[0] || null)} />
          </Field>
          <Field label="Image URL fallback">
            <Input value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
          </Field>
          {renderAssetPreview(form)}
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDelete
          item={deleting.item.title || deleting.item.name || deleting.item.slug}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

export default AdminPages
