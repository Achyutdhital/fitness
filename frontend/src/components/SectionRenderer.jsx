import React from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiCheck } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

/**
 * SectionRenderer Component
 * Dynamically renders different section types based on the section_type field
 * Supports 11 different section layouts managed via admin panel
 */
const SectionRenderer = ({ section }) => {
  const { isAuthenticated } = useAuth()

  if (!section) return null

  const baseClasses = {
    section: 'section',
    container: 'container',
    heading: 'text-4xl font-bold mb-12',
    card: 'card p-6',
  }

  const getBackgroundStyle = (section) => {
    const style = {}
    if (section.background_color) {
      style.backgroundColor = section.background_color
    }
    if (section.text_color) {
      style.color = section.text_color
    }
    return style
  }

  const getTextStyle = (section) => {
    return section.text_color ? { color: section.text_color } : {}
  }

  // Hero Section
  if (section.section_type === 'hero') {
    return (
      <section
        className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white py-20"
        style={getBackgroundStyle(section)}
      >
        <div className={baseClasses.container}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={getTextStyle(section)}>
                {section.title}
              </h1>
              <p className="text-xl text-gray-300 mb-8">{section.description}</p>
              <div className="flex space-x-4">
                {section.cta_text && section.cta_url && (
                  <Link
                    to={section.cta_url}
                    className={`btn ${
                      section.cta_style === 'primary' ? 'btn-primary' : 'btn-outline'
                    } text-lg px-8 py-3 flex items-center space-x-2`}
                  >
                    <span>{section.cta_text}</span>
                    <FiArrowRight />
                  </Link>
                )}
              </div>
            </div>
            {section.image_url && (
              <div className="relative">
                <img
                  src={section.image_url}
                  alt={section.title}
                  className="w-full h-96 object-cover rounded-lg shadow-2xl"
                />
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Features Section
  if (section.section_type === 'features') {
    const colsClass =
      section.columns === 2
        ? 'lg:grid-cols-2'
        : section.columns === 4
          ? 'lg:grid-cols-4'
          : 'lg:grid-cols-3'

    return (
      <section className={`${baseClasses.section} bg-white`} style={getBackgroundStyle(section)}>
        <div className={baseClasses.container}>
          <h2 className={`${baseClasses.heading} text-center`} style={getTextStyle(section)}>
            {section.title}
          </h2>
          {section.description && (
            <p className="text-center text-gray-600 mb-12 text-lg" style={getTextStyle(section)}>
              {section.description}
            </p>
          )}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${colsClass} gap-8`}>
            {section.section_items &&
              section.section_items.map((item) => (
                <div key={item.id} className={`${baseClasses.card} text-center`}>
                  {item.icon && <div className="text-4xl mb-4">{item.icon}</div>}
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover mb-4 rounded" />
                  )}
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
          </div>
        </div>
      </section>
    )
  }

  // Pricing Section
  if (section.section_type === 'pricing') {
    return (
      <section className={`${baseClasses.section} bg-gray-50`} style={getBackgroundStyle(section)}>
        <div className={baseClasses.container}>
          <h2 className={`${baseClasses.heading} text-center`} style={getTextStyle(section)}>
            {section.title}
          </h2>
          {section.description && (
            <p className="text-center text-gray-600 mb-12 text-lg" style={getTextStyle(section)}>
              {section.description}
            </p>
          )}

          <div className={`grid grid-cols-1 md:grid-cols-${section.columns || 3} gap-8`}>
            {section.section_items &&
              section.section_items.map((pkg) => (
                <div
                  key={plan.id}
                  className={`card p-8 relative transition-transform duration-300 hover:scale-105 ${
                    plan.is_highlighted ? 'ring-2 ring-red-500 shadow-xl' : ''
                  }`}
                >
                  {plan.is_highlighted && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-2xl font-bold mb-2">{plan.title}</h3>
                  {plan.price && (
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-red-500">${plan.price}</span>
                      <span className="text-gray-600">/{plan.price_period || 'month'}</span>
                    </div>
                  )}

                  {plan.button_text && plan.button_url && (
                    <button className={`w-full btn mb-8 ${plan.is_highlighted ? 'btn-primary' : 'btn-outline'}`}>
                      {plan.button_text}
                    </button>
                  )}

                  {plan.features && plan.features.length > 0 && (
                    <ul className="space-y-4">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center space-x-3">
                          <FiCheck className="text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
          </div>
        </div>
      </section>
    )
  }

  // Testimonials Section
  if (section.section_type === 'testimonials') {
    return (
      <section className={`${baseClasses.section} bg-white`} style={getBackgroundStyle(section)}>
        <div className={baseClasses.container}>
          <h2 className={`${baseClasses.heading} text-center`} style={getTextStyle(section)}>
            {section.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {section.section_items &&
              section.section_items.map((testimonial) => (
                <div key={testimonial.id} className={`${baseClasses.card}`}>
                  <div className="flex items-center mb-4">
                    {testimonial.image_url && (
                      <img
                        src={testimonial.image_url}
                        alt={testimonial.title}
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      />
                    )}
                    <div>
                      <h4 className="font-bold">{testimonial.title}</h4>
                      {testimonial.metadata?.role && <p className="text-sm text-gray-500">{testimonial.metadata.role}</p>}
                    </div>
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.description}"</p>
                </div>
              ))}
          </div>
        </div>
      </section>
    )
  }

  // CTA Section
  if (section.section_type === 'cta') {
    return (
      <section className="bg-red-500 text-white py-16" style={getBackgroundStyle(section)}>
        <div className={`${baseClasses.container} text-center`}>
          <h2 className="text-4xl font-bold mb-6">{section.title}</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">{section.description}</p>
          {section.cta_text && section.cta_url && (
            <Link
              to={section.cta_url}
              className={`btn ${
                section.cta_style === 'primary' ? 'btn-primary' : 'btn-outline'
              } text-lg px-8 py-3 inline-flex items-center space-x-2`}
            >
              <span>{section.cta_text}</span>
              <FiArrowRight />
            </Link>
          )}
        </div>
      </section>
    )
  }

  // Text Section
  if (section.section_type === 'text') {
    return (
      <section className={`${baseClasses.section} bg-white`} style={getBackgroundStyle(section)}>
        <div className={baseClasses.container}>
          <h2 className="text-4xl font-bold mb-6">{section.title}</h2>
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed">{section.description}</p>
          </div>
        </div>
      </section>
    )
  }

  // Gallery Section
  if (section.section_type === 'gallery') {
    return (
      <section className={`${baseClasses.section} bg-gray-50`} style={getBackgroundStyle(section)}>
        <div className={baseClasses.container}>
          <h2 className={`${baseClasses.heading} text-center`} style={getTextStyle(section)}>
            {section.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {section.section_items &&
              section.section_items.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-shadow">
                  <img src={item.image_url} alt={item.title} className="w-full h-64 object-cover hover:scale-110 transition-transform" />
                </div>
              ))}
          </div>
        </div>
      </section>
    )
  }

  // Team Section
  if (section.section_type === 'team') {
    return (
      <section className={`${baseClasses.section} bg-white`} style={getBackgroundStyle(section)}>
        <div className={baseClasses.container}>
          <h2 className={`${baseClasses.heading} text-center`} style={getTextStyle(section)}>
            {section.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {section.section_items &&
              section.section_items.map((member) => (
                <div key={member.id} className={`${baseClasses.card} text-center`}>
                  {member.image_url && (
                    <img src={member.image_url} alt={member.title} className="w-full h-64 object-cover rounded mb-4" />
                  )}
                  <h3 className="text-xl font-bold mb-2">{member.title}</h3>
                  {member.metadata?.role && <p className="text-red-500 font-semibold mb-2">{member.metadata.role}</p>}
                  <p className="text-gray-600 text-sm">{member.description}</p>
                </div>
              ))}
          </div>
        </div>
      </section>
    )
  }

  // FAQ Section
  if (section.section_type === 'faq') {
    return (
      <section className={`${baseClasses.section} bg-gray-50`} style={getBackgroundStyle(section)}>
        <div className={baseClasses.container}>
          <h2 className={`${baseClasses.heading} text-center`} style={getTextStyle(section)}>
            {section.title}
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {section.section_items &&
              section.section_items.map((faq) => (
                <details key={faq.id} className="card p-6 cursor-pointer group">
                  <summary className="font-bold text-lg flex justify-between items-center">
                    {faq.title}
                    <span className="transform group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-gray-700 mt-4">{faq.description}</p>
                </details>
              ))}
          </div>
        </div>
      </section>
    )
  }

  // Banner Section
  if (section.section_type === 'banner') {
    return (
      <section className="bg-gradient-to-r from-red-500 to-red-700 text-white py-12" style={getBackgroundStyle(section)}>
        <div className={`${baseClasses.container} flex items-center justify-between`}>
          <div>
            <h2 className="text-3xl font-bold mb-2">{section.title}</h2>
            <p className="text-lg">{section.description}</p>
          </div>
          {section.cta_text && section.cta_url && (
            <Link to={section.cta_url} className="btn btn-primary px-8 py-3 ml-4 whitespace-nowrap">
              {section.cta_text}
            </Link>
          )}
        </div>
      </section>
    )
  }

  // Custom HTML Section
  if (section.section_type === 'custom_html') {
    return (
      <section className={`${baseClasses.section}`} style={getBackgroundStyle(section)}>
        <style>{section.custom_css}</style>
        <div
          className={baseClasses.container}
          dangerouslySetInnerHTML={{ __html: section.custom_html }}
        />
      </section>
    )
  }

  // Fallback for unknown section types
  return null
}

export default SectionRenderer
