import { useEffect } from 'react'

export interface PageMetaProps {
  title: string
  description: string
}

/** Gestiona declarativamente document.title y <meta name="description"> de cada Página Contenedora. */
export default function PageMeta({ title, description }: PageMetaProps) {
  useEffect(() => {
    const appName = import.meta.env.VITE_APP_NAME || 'RiesgoTI'
    document.title = `${title} | ${appName}`

    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', description)
  }, [title, description])

  return null
}

export { PageMeta }
