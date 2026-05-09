import React, { useEffect, useState } from 'react'
import { coreAPI } from '../services/api'
import { FiPlus, FiTrendingDown, FiTrendingUp, FiActivity } from 'react-icons/fi'

const MeasurementsPage = () => {
  const [measurements, setMeasurements] = useState([])
  const [latest, setLatest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '', body_fat_percentage: '', muscle_mass: '',
    chest: '', waist: '', hips: '', arms: '', thighs: '', notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [h, l] = await Promise.allSettled([coreAPI.getMeasurements(), coreAPI.getLatestMeasurement()])
      if (h.status === 'fulfilled') setMeasurements(h.value.data)
      if (l.status === 'fulfilled') setLatest(l.value.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {}
      Object.entries(form).forEach(([k, v]) => { if (v !== '') payload[k] = v })
      await coreAPI.addMeasurement(payload)
      setMessage('Measurement saved!')
      setShowForm(false)
      setForm({ date: new Date().toISOString().split('T')[0], weight: '', body_fat_percentage: '', muscle_mass: '', chest: '', waist: '', hips: '', arms: '', thighs: '', notes: '' })
      await loadData()
    } catch (e) {
      setMessage(e.response?.data?.date?.[0] || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const getTrend = (field) => {
    if (measurements.length < 2) return null
    const curr = measurements[0]?.[field]
    const prev = measurements[1]?.[field]
    if (!curr || !prev) return null
    return curr < prev ? 'down' : curr > prev ? 'up' : 'same'
  }

  const metrics = [
    { key: 'weight', label: 'Weight', unit: 'kg', color: 'from-blue-500 to-cyan-500' },
    { key: 'body_fat_percentage', label: 'Body Fat', unit: '%', color: 'from-orange-500 to-red-500' },
    { key: 'muscle_mass', label: 'Muscle Mass', unit: 'kg', color: 'from-green-500 to-teal-500' },
    { key: 'waist', label: 'Waist', unit: 'cm', color: 'from-purple-500 to-indigo-500' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-1">Body <span className="gradient-text">Measurements</span></h1>
            <p className="text-gray-400">Track your physical progress over time</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center space-x-2">
            <FiPlus size={18} />
            <span>Log Today</span>
          </button>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/40 text-green-400 rounded-xl">{message}</div>
        )}

        {/* Latest Metrics */}
        {latest && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {metrics.map(m => {
              const trend = getTrend(m.key)
              return (
                <div key={m.key} className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-3`}>
                    <FiActivity className="text-white" size={18} />
                  </div>
                  <p className="text-gray-400 text-sm mb-1">{m.label}</p>
                  <div className="flex items-end space-x-2">
                    <p className="text-white text-2xl font-black">{latest[m.key] ?? '—'}</p>
                    {latest[m.key] && <p className="text-gray-500 text-sm mb-1">{m.unit}</p>}
                  </div>
                  {trend && (
                    <div className={`flex items-center space-x-1 text-xs mt-1 ${trend === 'down' ? 'text-green-400' : 'text-red-400'}`}>
                      {trend === 'down' ? <FiTrendingDown size={12} /> : <FiTrendingUp size={12} />}
                      <span>vs last entry</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Log Form */}
        {showForm && (
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8 mb-8">
            <h2 className="text-white font-bold text-xl mb-6">Log New Measurement</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="input-field bg-gray-900 text-white border-gray-700" required />
                </div>
                {[
                  { key: 'weight', label: 'Weight (kg)' },
                  { key: 'body_fat_percentage', label: 'Body Fat (%)' },
                  { key: 'muscle_mass', label: 'Muscle Mass (kg)' },
                  { key: 'chest', label: 'Chest (cm)' },
                  { key: 'waist', label: 'Waist (cm)' },
                  { key: 'hips', label: 'Hips (cm)' },
                  { key: 'arms', label: 'Arms (cm)' },
                  { key: 'thighs', label: 'Thighs (cm)' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-gray-300 text-sm font-medium mb-2">{f.label}</label>
                    <input type="number" step="0.1" value={form[f.key]}
                      onChange={e => setForm({...form, [f.key]: e.target.value})}
                      placeholder="—"
                      className="input-field bg-gray-900 text-white border-gray-700" />
                  </div>
                ))}
                <div className="md:col-span-3">
                  <label className="block text-gray-300 text-sm font-medium mb-2">Notes</label>
                  <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    placeholder="How are you feeling today?"
                    className="input-field bg-gray-900 text-white border-gray-700" />
                </div>
              </div>
              <div className="flex space-x-3">
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : 'Save Measurement'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn bg-gray-700 text-gray-300 hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* History Table */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-white font-bold text-xl">Measurement History</h2>
          </div>
          {measurements.length === 0 ? (
            <div className="text-center py-16">
              <FiActivity className="text-gray-600 mx-auto mb-4" size={48} />
              <p className="text-gray-400 mb-4">No measurements logged yet</p>
              <button onClick={() => setShowForm(true)} className="btn btn-primary">Log Your First Measurement</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    {['Date', 'Weight', 'Body Fat', 'Muscle', 'Waist', 'Notes'].map(h => (
                      <th key={h} className="text-left text-gray-400 font-medium px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {measurements.map(m => (
                    <tr key={m.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{m.date}</td>
                      <td className="px-6 py-4 text-gray-300">{m.weight ? `${m.weight} kg` : '—'}</td>
                      <td className="px-6 py-4 text-gray-300">{m.body_fat_percentage ? `${m.body_fat_percentage}%` : '—'}</td>
                      <td className="px-6 py-4 text-gray-300">{m.muscle_mass ? `${m.muscle_mass} kg` : '—'}</td>
                      <td className="px-6 py-4 text-gray-300">{m.waist ? `${m.waist} cm` : '—'}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{m.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MeasurementsPage
