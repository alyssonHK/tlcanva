import React, { useEffect, useState, useRef } from 'react';

interface InteractiveWebPageProps {
  url: string;
  width?: number;
  height?: number;
  embed?: boolean;
}

export const InteractiveWebPage: React.FC<InteractiveWebPageProps> = ({ url, width = 600, height = 400 }) => {
  const [title, setTitle] = useState('');
  const [favicon, setFavicon] = useState('');
  const [iframeError, setIframeError] = useState(false);
  const [isSameOrigin, setIsSameOrigin] = useState(false);
  const [embedAllowed, setEmbedAllowed] = useState(false);
  const [infoResolved, setInfoResolved] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Tenta buscar título e favicon da página
  useEffect(() => {
    setTitle('');
    setFavicon('');
    setIframeError(false);
    setIsSameOrigin(false);
    // Busca favicon
    try {
      const urlObj = new URL(url);
      setFavicon(`https://www.google.com/s2/favicons?domain=${urlObj.hostname}`);
      setTitle(urlObj.hostname);
    } catch {}
  // Não buscamos mais o HTML diretamente por CORS; deixamos o proxy do backend tentar se necessário
  }, [url]);

  // Antes de renderizar o iframe, chamar o endpoint /api/proxy/info para verificar a URL final
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch(`/api/proxy/info?url=${encodeURIComponent(url)}`);
        if (!mounted) return;
        if (!resp.ok) return;
        const data = await resp.json();
        if (data && data.finalUrl) {
          try {
            const finalOrigin = new URL(data.finalUrl).origin;
            if (finalOrigin === (typeof window !== 'undefined' ? window.location.origin : '')) {
              setIsSameOrigin(true);
            }
            // Se o domínio for github.com (exemplo), permitimos embed relaxado
            const hostname = new URL(data.finalUrl).hostname.replace(/^www\./, '');
            if (['github.com'].includes(hostname)) {
              setEmbedAllowed(true);
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore failures; we'll fallback to iframe and proxy error handler
      }
  // Marca que a checagem terminou (independente do resultado)
  if (mounted) setInfoResolved(true);
    })();
    return () => {
      mounted = false;
    };
  }, [url]);

  // Handler para erro de iframe (site bloqueia)
  const handleIframeError = () => {
    setIframeError(true);
  };

  return (
    <div style={{ width, height, border: '1.5px solid #a78bfa', borderRadius: 12, overflow: 'hidden', background: '#18181b', display: 'flex', flexDirection: 'column' }}>
      {/* Header estilo Obsidian */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#23232b', padding: '6px 12px', borderBottom: '1px solid #333', gap: 8 }}>
  {favicon && <img src={favicon} alt="favicon" style={{ width: 18, height: 18, marginRight: 6, borderRadius: 3 }} />}
  <span style={{ color: '#fff', fontWeight: 500, fontSize: 14, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={title}>{title || url}</span>
  <div style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>{embedAllowed ? 'embed=allowed' : 'embed=denied'}</div>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', fontSize: 15, marginLeft: 8, textDecoration: 'none' }} title="Abrir em nova aba">🔗</a>
        <div style={{ marginLeft: 8, fontSize: 11, color: '#9ca3af' }} title="Conteúdo sem scripts para segurança">(sandboxed)</div>
      </div>
      {/* Conteúdo */}
      <div style={{ flex: 1, background: '#fff', position: 'relative' }}>
        {/* Espera a checagem do proxy/info terminar para decidir como montar o iframe */}
        { !infoResolved ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#444' }}>
            <div>Carregando pré-visualização...</div>
          </div>
        ) : (iframeError || isSameOrigin) ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#444', padding: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>{isSameOrigin ? 'Conteúdo interno — abrindo como link para evitar canvas aninhado.' : 'Este site não permite ser exibido no canvas.'}</div>
            <div style={{ fontSize: 13, color: '#888' }}>Abra em nova aba para acessar: <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa' }}>{url}</a></div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            // Usa o proxy para contornar CORS/X-Frame quando possível; embedAllowed ativa embed mais completo
            src={`/api/proxy?url=${encodeURIComponent(url)}${embedAllowed ? '&embed=1' : ''}`}
            width="100%"
            height="100%"
            style={{ border: 'none', minHeight: 120 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            // Quando embedAllowed = true, relaxamos sandbox para permitir scripts/mesma origem do iframe proxied
            sandbox={embedAllowed ? 'allow-scripts allow-same-origin allow-forms allow-popups' : 'allow-forms allow-popups'}
            title={title || url}
            onError={handleIframeError}
          />
        )}
      </div>
    </div>
  );
};
