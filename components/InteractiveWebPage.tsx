import React, { useEffect, useState, useRef } from 'react';

interface InteractiveWebPageProps {
  url: string;
  width?: number;
  height?: number;
}

export const InteractiveWebPage: React.FC<InteractiveWebPageProps> = ({ url, width = 600, height = 400 }) => {
  const [title, setTitle] = useState('');
  const [favicon, setFavicon] = useState('');
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Tenta buscar título e favicon da página
  useEffect(() => {
    setTitle('');
    setFavicon('');
    setIframeError(false);
    // Busca favicon
    try {
      const urlObj = new URL(url);
      setFavicon(`https://www.google.com/s2/favicons?domain=${urlObj.hostname}`);
      setTitle(urlObj.hostname);
    } catch {}
    // Opcional: fetch para tentar obter <title> (pode falhar por CORS)
    fetch(url)
      .then(resp => resp.text())
      .then(html => {
        const match = html.match(/<title>(.*?)<\/title>/i);
        if (match && match[1]) setTitle(match[1]);
      })
      .catch(() => {});
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
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', fontSize: 15, marginLeft: 8, textDecoration: 'none' }} title="Abrir em nova aba">🔗</a>
      </div>
      {/* Conteúdo */}
      <div style={{ flex: 1, background: '#fff', position: 'relative' }}>
        {!iframeError ? (
          <iframe
            ref={iframeRef}
            src={url}
            width="100%"
            height="100%"
            style={{ border: 'none', minHeight: 120 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title={title || url}
            onError={handleIframeError}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#444', padding: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Este site não permite ser exibido no canvas.</div>
            <div style={{ fontSize: 13, color: '#888' }}>Abra em nova aba para acessar: <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa' }}>{url}</a></div>
          </div>
        )}
      </div>
    </div>
  );
};
