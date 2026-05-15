import React, { useEffect, useState } from 'react'
import { cmsAPI } from '../../services/api'
import { Field, Input, Textarea, Toggle } from './AdminComponents'
import { FiSave, FiGlobe, FiTarget, FiHash } from 'react-icons/fi'
import SEO from '../../components/SEO'

const AdminSEO = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await cmsAPI.getSettings()
      setSettings(res.data)
    } catch (e) {
      console.error(e)
      setMsg({ text: 'Failed to load SEO settings', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg({ text: '', type: '' })
    try {
      await cmsAPI.updateSettings(settings)
      setMsg({ text: 'SEO Settings updated successfully!', type: 'success' })
    } catch (e) {
      setMsg({ text: 'Failed to update settings', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-20 bg-gray-800/40 rounded-2xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-800/40 rounded-2xl w-full" />
          <div className="h-64 bg-gray-800/40 rounded-2xl w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <SEO title="Global SEO Settings" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">Global <span className="gradient-text">SEO Settings</span></h1>
          <p className="text-gray-500 text-sm font-medium">Manage default metadata, social sharing links, and site-wide branding.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="btn btn-primary flex items-center space-x-2 px-6 py-3 rounded-2xl shadow-lg shadow-orange-500/20 disabled:opacity-50"
        >
          <FiSave />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-sm font-bold flex items-center space-x-2 ${
          msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Core Identity */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-[2rem] p-8 border border-gray-700 shadow-xl space-y-6">
           <h3 className="text-white font-black text-lg flex items-center space-x-3 mb-2 border-b border-gray-700 pb-4">
              <FiGlobe className="text-orange-400" />
              <span>Site Identity</span>
           </h3>
           <Field label="Site Name">
             <Input value={settings?.site_name || ''} onChange={e => setSettings({...settings, site_name: e.target.value})} placeholder="FitCoachPro" />
           </Field>
           <Field label="Site Tagline">
             <Input value={settings?.site_tagline || ''} onChange={e => setSettings({...settings, site_tagline: e.target.value})} placeholder="Transform Your Body, Transform Your Life" />
           </Field>
           <Field label="Global Meta Title">
             <Input value={settings?.meta_title || ''} onChange={e => setSettings({...settings, meta_title: e.target.value})} placeholder="FitCoachPro - Fitness Subscription Platform" />
           </Field>
        </div>

        {/* Search Engine Metadata */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-[2rem] p-8 border border-gray-700 shadow-xl space-y-6">
           <h3 className="text-white font-black text-lg flex items-center space-x-3 mb-2 border-b border-gray-700 pb-4">
              <FiTarget className="text-blue-400" />
              <span>Search Engine Metadata</span>
           </h3>
           <Field label="Global Meta Keywords">
             <Textarea value={settings?.meta_keywords || ''} onChange={e => setSettings({...settings, meta_keywords: e.target.value})} rows={3} placeholder="fitness, workout, diet pkg, coach" />
             <p className="text-gray-500 text-[10px] mt-1 font-bold uppercase tracking-widest">Comma-separated terms</p>
           </Field>
           <Field label="Global Meta Description">
             <Textarea value={settings?.meta_description || ''} onChange={e => setSettings({...settings, meta_description: e.target.value})} rows={3} placeholder="Your complete fitness subscription platform..." />
           </Field>
        </div>

        {/* Social Presence */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-[2rem] p-8 border border-gray-700 shadow-xl space-y-6 md:col-span-2">
           <h3 className="text-white font-black text-lg flex items-center space-x-3 mb-2 border-b border-gray-700 pb-4">
              <FiHash className="text-pink-400" />
              <span>Social Links & Verification</span>
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <Field label="Facebook URL">
               <Input value={settings?.facebook_url || ''} onChange={e => setSettings({...settings, facebook_url: e.target.value})} placeholder="https://facebook.com/..." />
             </Field>
             <Field label="Twitter / X URL">
               <Input value={settings?.twitter_url || ''} onChange={e => setSettings({...settings, twitter_url: e.target.value})} placeholder="https://twitter.com/..." />
             </Field>
             <Field label="Instagram URL">
               <Input value={settings?.instagram_url || ''} onChange={e => setSettings({...settings, instagram_url: e.target.value})} placeholder="https://instagram.com/..." />
             </Field>
             <Field label="YouTube URL">
               <Input value={settings?.youtube_url || ''} onChange={e => setSettings({...settings, youtube_url: e.target.value})} placeholder="https://youtube.com/..." />
             </Field>
             <Field label="LinkedIn URL">
               <Input value={settings?.linkedin_url || ''} onChange={e => setSettings({...settings, linkedin_url: e.target.value})} placeholder="https://linkedin.com/..." />
             </Field>
           </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSEO
