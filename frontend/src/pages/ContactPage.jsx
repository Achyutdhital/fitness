import { useState } from 'react'
import { cmsAPI } from '../services/api'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await cmsAPI.submitContact(formData)
      setSubmitted(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      })
      
      // Reset submitted message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      setError('Failed to submit contact form. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-12">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 py-24 mb-12">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/10 to-transparent blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-6">
            Command Center
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-600">Touch</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Have questions about your transformation? Our elite support team is ready to assist you.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-24">
          {/* Info Cards */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-10 flex flex-col justify-center text-center">
            <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 mx-auto mb-6">
               <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-4">Email Us</h3>
            <a href="mailto:contact@fitnessproof.com" className="text-orange-400 font-bold hover:text-orange-300 transition-colors">
              contact@fitnessproof.com
            </a>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-10 flex flex-col justify-center text-center">
            <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center text-pink-400 mx-auto mb-6">
               <span className="text-2xl">📞</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-4">Call Support</h3>
            <p className="text-slate-400 font-bold">+1 (555) 123-4567</p>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-10 flex flex-col justify-center text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mx-auto mb-6">
               <span className="text-2xl">🕒</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-4">Working Hours</h3>
            <p className="text-slate-400 text-sm">Mon-Fri: 9AM - 6PM</p>
            <p className="text-slate-400 text-sm">Weekend: Limited Support</p>
          </div>
        </div>

        {/* Contact Form Container */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800/50 rounded-[3rem] p-8 md:p-16 shadow-2xl relative">
            <h2 className="text-3xl font-black text-white mb-12 text-center">Send an Inquiry</h2>

            {submitted && (
              <div className="mb-12 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-400 text-center font-bold">
                ✓ Message transmitted. Expect a response shortly.
              </div>
            )}

            {error && (
              <div className="mb-12 p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-center font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="E.g. John Doe"
                    className="w-full bg-slate-800/50 border border-slate-700 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all placeholder-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full bg-slate-800/50 border border-slate-700 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Topic of inquiry"
                    className="w-full bg-slate-800/50 border border-slate-700 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all placeholder-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Phone (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 234 567 890"
                    className="w-full bg-slate-800/50 border border-slate-700 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Your Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder="Detail your request..."
                  className="w-full bg-slate-800/50 border border-slate-700 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all placeholder-slate-600 resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-orange-500/20"
              >
                {loading ? 'Transmitting...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
