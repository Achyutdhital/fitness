import React from 'react'
import { Helmet } from 'react-helmet-async'

const SEO = ({ title, description, keywords, image, url, type = 'website' }) => {
  const siteName = 'FitCoachPro'
  const fullTitle = title ? `${title} | ${siteName}` : siteName
  const defaultDesc = 'Transform your body and mind with FitCoachPro - The ultimate fitness subscription platform.'
  const defaultKeywords = 'fitness, workout, diet pkg, coach, personal trainer, health'

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={description || defaultDesc} />
      <meta name='keywords' content={keywords || defaultKeywords} />

      {/* Open Graph / Facebook */}
      <meta property='og:type' content={type} />
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={description || defaultDesc} />
      {image && <meta property='og:image' content={image} />}
      {url && <meta property='og:url' content={url} />}
      <meta property='og:site_name' content={siteName} />

      {/* Twitter */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={fullTitle} />
      <meta name='twitter:description' content={description || defaultDesc} />
      {image && <meta name='twitter:image' content={image} />}

      {/* Canonical URL */}
      {url && <link rel='canonical' href={url} />}
    </Helmet>
  )
}

export default SEO
