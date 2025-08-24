import React, { useState, useRef, useEffect } from 'react';

interface InteractivePDFProps {
  url: string;
  fileName: string;
  width: number;
  height: number;
}

export const InteractivePDF: React.FC<InteractivePDFProps> = ({ url, fileName, width, height }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Simulação de carregamento - em um caso real, você poderia usar PDF.js
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    controlsTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
  };

  const nextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const previousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const openInNewTab = () => {
    window.open(url, '_blank');
  };

  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
  };

  return (
    <div 
      className="relative w-full h-full bg-gray-100 group overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onPointerDown={(e) => e.stopPropagation()} // Impede interferência do TLDraw
      onPointerUp={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* PDF Viewer */}
      <div className="w-full h-full flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Carregando PDF...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-600">
              <div className="text-4xl mb-2">⚠️</div>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={`${url}#page=${currentPage}&zoom=${Math.round(scale * 100)}`}
            className="w-full h-full border-0"
            title={fileName}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              minHeight: height,
              minWidth: width
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => setError('Erro ao carregar o PDF')}
          />
        )}
      </div>

      {/* Controles overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Header com título */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-3 pointer-events-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-sm font-medium truncate">{fileName}</h3>
            <div className="flex gap-2">
              <button
                onClick={openInNewTab}
                className="bg-black/30 hover:bg-black/50 text-white px-3 py-1 rounded text-xs transition-colors"
                title="Abrir em nova aba"
              >
                🔗 Abrir
              </button>
              <button
                onClick={downloadPDF}
                className="bg-black/30 hover:bg-black/50 text-white px-3 py-1 rounded text-xs transition-colors"
                title="Download"
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>

        {/* Controles laterais - Zoom */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/30 rounded-lg p-2 pointer-events-auto">
          <div className="flex flex-col gap-2">
            <button
              onClick={zoomIn}
              className="text-white hover:text-blue-400 p-2 rounded transition-colors"
              title="Aumentar zoom"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
              </svg>
            </button>
            
            <div className="text-white text-xs text-center">
              {Math.round(scale * 100)}%
            </div>
            
            <button
              onClick={zoomOut}
              className="text-white hover:text-blue-400 p-2 rounded transition-colors"
              title="Diminuir zoom"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                <path d="M7 9v1h5V9H7z"/>
              </svg>
            </button>
            
            <button
              onClick={resetZoom}
              className="text-white hover:text-blue-400 p-2 rounded transition-colors text-xs"
              title="Zoom 100%"
            >
              100%
            </button>
          </div>
        </div>

        {/* Controles de página - Centro inferior */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/30 rounded-lg px-4 py-2 pointer-events-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={previousPage}
              disabled={currentPage === 1}
              className={`p-2 rounded transition-colors ${
                currentPage === 1 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'text-white hover:text-blue-400'
              }`}
              title="Página anterior"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  }
                }}
                className="w-16 px-2 py-1 text-center bg-white/20 text-white border border-white/30 rounded text-sm"
              />
              <span className="text-white text-sm">de {totalPages}</span>
            </div>

            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`p-2 rounded transition-colors ${
                currentPage === totalPages 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'text-white hover:text-blue-400'
              }`}
              title="Próxima página"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Controles direita - Ações adicionais */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/30 rounded-lg p-2 pointer-events-auto">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setScale(prev => prev + 0.1)}
              className="text-white hover:text-blue-400 p-2 rounded transition-colors"
              title="Ajuste fino zoom +"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
            
            <button
              onClick={() => setScale(prev => Math.max(prev - 0.1, 0.3))}
              className="text-white hover:text-blue-400 p-2 rounded transition-colors"
              title="Ajuste fino zoom -"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13H5v-2h14v2z"/>
              </svg>
            </button>

            <button
              onClick={() => {
                if (iframeRef.current) {
                  if (iframeRef.current.requestFullscreen) {
                    iframeRef.current.requestFullscreen();
                  }
                }
              }}
              className="text-white hover:text-blue-400 p-2 rounded transition-colors"
              title="Tela cheia"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5h5V3H3v7h2V5zm5 14H5v-5H3v7h7v-2zm9-14h-5V3h7v7h-2V5zm0 14v-5h2v7h-7v-2h5z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Indicador de página no canto superior direito */}
        <div className="absolute top-3 right-3 bg-black/30 text-white px-2 py-1 rounded text-xs">
          Página {currentPage}/{totalPages}
        </div>
      </div>
    </div>
  );
};
