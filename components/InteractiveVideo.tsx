import React, { useRef, useState, useEffect } from 'react';

interface InteractiveVideoProps {
  url: string;
  fileName: string;
  width: number;
  height: number;
}

export const InteractiveVideo: React.FC<InteractiveVideoProps> = ({ url, fileName, width, height }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
  };

  const skipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
  };

  const changePlaybackSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="relative w-full h-full bg-black group overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onPointerDown={(e) => e.stopPropagation()} // Impede interferência do TLDraw
      onPointerUp={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Vídeo */}
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-contain"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        preload="metadata"
      />
      
      {/* Overlay de controles */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Título do vídeo */}
        <div className="absolute top-0 left-0 right-0 p-3">
          <h3 className="text-white text-sm font-medium truncate">{fileName}</h3>
        </div>

        {/* Botão de play central */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="text-white p-4 rounded-full bg-white/20 hover:bg-white/30 transition-all transform hover:scale-110"
            title={isPlaying ? "Pausar" : "Reproduzir"}
          >
            {isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Controles inferiores */}
        <div className="absolute bottom-0 left-0 right-0 p-3" style={{ pointerEvents: 'auto' }}>
          {/* Barra de progresso */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={(e) => {
                e.stopPropagation();
                handleSeek(e);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              className="w-full h-2 bg-white/30 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)`
              }}
            />
          </div>
          
          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                className="hover:text-red-400 transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              
              {/* Voltar 10s */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  skipBackward();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                className="hover:text-red-400 transition-colors text-xs"
                title="Voltar 10s"
              >
                -10s
              </button>

              {/* Avançar 10s */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  skipForward();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                className="hover:text-red-400 transition-colors text-xs"
                title="Avançar 10s"
              >
                +10s
              </button>
              
              {/* Volume */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  className="hover:text-red-400 transition-colors"
                >
                  {isMuted || volume === 0 ? "🔇" : "🔊"}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleVolumeChange(e);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  className="w-16 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                />
              </div>
              
              {/* Tempo */}
              <span className="text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Velocidade de reprodução */}
              <select
                onChange={(e) => {
                  e.stopPropagation();
                  changePlaybackSpeed(parseFloat(e.target.value));
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent border border-white/30 rounded px-2 py-1 text-xs"
                defaultValue="1"
              >
                <option value="0.5" className="text-black">0.5x</option>
                <option value="0.75" className="text-black">0.75x</option>
                <option value="1" className="text-black">Normal</option>
                <option value="1.25" className="text-black">1.25x</option>
                <option value="1.5" className="text-black">1.5x</option>
                <option value="2" className="text-black">2x</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {duration === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Carregando vídeo...</p>
          </div>
        </div>
      )}
    </div>
  );
};
