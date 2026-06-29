const ALLOWED_ORIGINS = [
  'https://petite-boutik-solidaire.pages.dev',
  'http://localhost:5173',
  'http://localhost:4173',
]

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : 'https://petite-boutik-solidaire.pages.dev'
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    // Requis pour les pages avec Cross-Origin-Embedder-Policy: require-corp (ONNX WASM)
    'Cross-Origin-Resource-Policy': 'cross-origin',
  }
}

function errorResponse(status, message, origin) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

const MIME_TO_EXT = {
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'image/jpeg': 'jpg',
}

const ALLOWED_MIME_TYPES = new Set(Object.keys(MIME_TO_EXT))

async function storeImage(env, buffer, contentType, originalName) {
  const mime = (contentType || '').split(';')[0].trim().toLowerCase()
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    throw new Error(`Type de fichier non autorisé : ${mime || 'inconnu'}`)
  }
  const ext = MIME_TO_EXT[mime] || 'jpg'
  const key = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  await env.PETITE_BOUTIK_IMAGES.put(key, buffer, {
    metadata: { contentType: mime, originalName },
  })
  return key
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') || ''
    const method = request.method

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) })
    }

    if (method === 'POST' && url.pathname === '/upload') {
      try {
        const formData = await request.formData()
        const file = formData.get('file')
        if (!file) return errorResponse(400, 'Missing file', origin)

        const buffer = await file.arrayBuffer()
        const key = await storeImage(env, buffer, file.type, file.name)
        const publicUrl = `${url.origin}/files/${key}`
        return new Response(JSON.stringify({ url: publicUrl, key }), {
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        })
      } catch (e) {
        return errorResponse(500, e.message, origin)
      }
    }

    if (method === 'GET' && url.pathname.startsWith('/files/')) {
      const key = url.pathname.slice(7)
      if (!key) return errorResponse(400, 'Missing key', origin)

      const result = await env.PETITE_BOUTIK_IMAGES.getWithMetadata(key, 'arrayBuffer')
      if (result.value === null) return errorResponse(404, 'Not found', origin)

      const contentType = result.metadata?.contentType || 'application/octet-stream'
      return new Response(result.value, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          ...corsHeaders(origin),
        },
      })
    }

    if (method === 'DELETE' && url.pathname.startsWith('/files/')) {
      const key = url.pathname.slice(7)
      if (!key) return errorResponse(400, 'Missing key', origin)

      await env.PETITE_BOUTIK_IMAGES.delete(key)
      return new Response(JSON.stringify({ deleted: true }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      })
    }

    if (method === 'POST' && url.pathname === '/suggest') {
      try {
        if (!env.AI) return errorResponse(500, 'AI binding not configured', origin)
        const { imageUrl } = await request.json()
        if (!imageUrl) return errorResponse(400, 'Missing imageUrl', origin)

        // Lire l'image depuis le KV si c'est une URL locale, sinon fetch externe
        let imgBytes
        try {
          const urlObj = new URL(imageUrl)
          if (urlObj.pathname.startsWith('/files/')) {
            const key = urlObj.pathname.slice(7)
            const buf = await env.PETITE_BOUTIK_IMAGES.get(key, 'arrayBuffer')
            if (!buf) return errorResponse(404, 'Image not found in KV', origin)
            imgBytes = [...new Uint8Array(buf)]
          } else {
            const imgRes = await fetch(imageUrl)
            if (!imgRes.ok) return errorResponse(400, 'Cannot fetch image', origin)
            imgBytes = [...new Uint8Array(await imgRes.arrayBuffer())]
          }
        } catch (e) {
          return errorResponse(400, 'Cannot load image: ' + e.message, origin)
        }

        // Deux questions simples — le modèle LLaVA ne suit pas bien les formats JSON
        const [descRes, tagRes] = await Promise.all([
          env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
            image: imgBytes,
            prompt: "Décris ce vêtement en une courte phrase en français (maximum 60 caractères). Réponds uniquement avec la phrase, rien d'autre.",
            max_tokens: 60,
          }),
          env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
            image: imgBytes,
            prompt: "Liste 4 mots-clés en français qui décrivent ce vêtement, séparés par des virgules. Juste les mots, rien d'autre.",
            max_tokens: 40,
          }),
        ])

        const description = (descRes?.description || '').replace(/^["'\s]+|["'\s]+$/g, '').slice(0, 80)
        const tagsRaw = tagRes?.description || ''
        const tags = tagsRaw.split(/[,;、\n]+/).map(t => t.trim().toLowerCase().replace(/^["'.\s]+|["'.\s]+$/g, '')).filter(Boolean).slice(0, 5)

        return new Response(JSON.stringify({ description, tags }), {
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        })
      } catch (e) {
        return errorResponse(500, e.message, origin)
      }
    }

    return errorResponse(404, 'Not found', origin)
  },
}
