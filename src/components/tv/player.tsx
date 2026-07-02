"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Hls from "hls.js";
import { useTvStore } from "@/lib/store";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Minimize2,
  Heart,
  PictureInPicture2,
  Tv,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();

  const {
    currentChannelId,
    setCurrentChannel,
    toggleFavorite,
    isFavorite,
    sidebarOpen,
    miniPlayer,
    setMiniPlayer,
    volume,
    setVolume,
    muted,
    setMuted,
    addRecent,
    channels,
  } = useTvStore();

  const currentChannel = channels.find((c) => c.id === currentChannelId);
  const isFav = currentChannelId ? isFavorite(currentChannelId) : false;

  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNumberOverlay, setShowNumberOverlay] = useState(false);
  const [numberBuffer, setNumberBuffer] = useState("");

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle channel number input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setMuted(!muted);
      }
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setMiniPlayer(!miniPlayer);
      }
      if (e.key === "Escape") {
        if (miniPlayer) setMiniPlayer(false);
        if (isFullscreen) document.exitFullscreen();
      }

      if (/^[0-9]$/.test(e.key)) {
        setShowNumberOverlay(true);
        setNumberBuffer((prev) => (prev + e.key).slice(-3));
        clearTimeout(controlsTimer.current);
        controlsTimer.current = setTimeout(() => {
          const num = parseInt(numberBuffer + e.key, 10);
          const ch = channels.find((c) => c.number === num);
          if (ch) {
            setCurrentChannel(ch.id);
            addRecent(ch.id);
          }
          setNumberBuffer("");
          setShowNumberOverlay(false);
        }, 1500);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [muted, miniPlayer, numberBuffer, channels, setCurrentChannel, addRecent, setMuted, setMiniPlayer]);

  // Load HLS stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentChannel) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    queueMicrotask(() => {
      if (error) setError(null);
      setIsLoading(true);
    });

    // Route through proxy to bypass CORS and mixed-content issues
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(currentChannel.url)}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        xhrSetup: (xhr) => {
          // All segment requests already go through rewritten m3u8 URLs
        },
      });
      hlsRef.current = hls;
      hls.loadSource(proxyUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError("Stream load failed. Check the m3u8 URL.");
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = proxyUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentChannelId, channels]);

  // Sync volume
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = muted;
    }
  }, [volume, muted]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrentTime(video.currentTime);
    const onDuration = () => setDuration(video.duration || 0);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("durationchange", onDuration);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("progress", onProgress);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("durationchange", onDuration);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("progress", onProgress);
    };
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP not supported
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setMuted(false);
  };

  const formatTime = (t: number) => {
    if (!t || !isFinite(t)) return "LIVE";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Mini player mode
  if (miniPlayer && currentChannel) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 100 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 100 }}
        className="fixed bottom-4 right-4 z-50 w-80 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black cursor-pointer group"
        onClick={() => setMiniPlayer(false)}
      >
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            autoPlay
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
            <span className="text-white text-xs font-medium truncate">
              {currentChannel.name}
            </span>
          </div>
          <div className="absolute top-2 left-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-900">
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="text-white/70 hover:text-white"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <span className="text-white/50 text-[10px]">Click to expand</span>
          <button
            onClick={(e) => { e.stopPropagation(); setMiniPlayer(false); }}
            className="text-white/70 hover:text-white"
          >
            <Maximize size={14} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden group select-none ${
        miniPlayer ? "hidden" : ""
      } ${sidebarOpen ? "lg:ml-72" : ""} transition-all duration-300`}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
      style={{
        height: miniPlayer ? undefined : "56.25vw",
        maxHeight: miniPlayer ? undefined : "80vh",
        minHeight: miniPlayer ? undefined : "200px",
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
      />

      {/* Loading spinner */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40"
          >
            <div className="w-12 h-12 border-3 border-white/20 border-t-white rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center p-4">
            <Tv size={48} className="mx-auto text-red-500 mb-3" />
            <p className="text-white/80 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* No channel */}
      {!currentChannel && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-white/10">
              <Tv size={36} className="text-orange-400" />
            </div>
            <h2 className="text-white/90 text-xl font-semibold mb-2">
              Select a Channel
            </h2>
            <p className="text-white/40 text-sm">
              Choose a channel below or add your own m3u8 streams
            </p>
          </motion.div>
        </div>
      )}

      {/* Channel number overlay */}
      <AnimatePresence>
        {showNumberOverlay && numberBuffer && (
          <motion.div
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-6 left-6 bg-black/70 backdrop-blur-md rounded-xl px-6 py-4 border border-white/10"
          >
            <span className="text-white font-mono text-4xl font-bold tracking-wider">
              {numberBuffer}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIVE badge */}
      {currentChannel && (
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <div className="flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm px-2.5 py-1 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-white text-[10px] font-bold tracking-wider uppercase">
              Live
            </span>
          </div>
          <div className="bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-md">
            <span className="text-white/70 text-[10px] font-mono">
              CH {currentChannel.number}
            </span>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && currentChannel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 z-20"
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: currentChannel.color }}
                >
                  {currentChannel.number}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    {currentChannel.name}
                  </h3>
                  <p className="text-white/40 text-[11px]">
                    {currentChannel.category}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={togglePiP}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Picture-in-Picture"
                >
                  <PictureInPicture2 size={18} />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Fullscreen (F)"
                >
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize size={18} />}
                </button>
                <button
                  onClick={() => setMiniPlayer(true)}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Mini Player (P)"
                >
                  <Minimize size={18} />
                </button>
              </div>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {duration > 0 && isFinite(duration) && (
                <div
                  className="h-1 bg-white/10 rounded-full mb-3 cursor-pointer group/progress hover:h-1.5 transition-all"
                  onClick={seek}
                >
                  <div className="relative h-full">
                    <div
                      className="absolute left-0 top-0 h-full bg-white/20 rounded-full"
                      style={{ width: `${(buffered / duration) * 100}%` }}
                    />
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-100"
                      style={{
                        width: `${(currentTime / duration) * 100}%`,
                        backgroundColor: currentChannel.color,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <div className="flex items-center gap-1 group/vol">
                    <button
                      onClick={() => setMuted(!muted)}
                      className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={muted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-white h-1 cursor-pointer"
                    />
                  </div>
                  <span className="text-white/40 text-[11px] font-mono ml-2">
                    {formatTime(currentTime)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      currentChannel &&
                      toggleFavorite({ id: currentChannel.id, name: currentChannel.name })
                    }
                    className={`p-2 rounded-lg transition-colors ${
                      isFav
                        ? "text-red-400 hover:text-red-300"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click to play/pause - only active when controls are hidden */}
      {currentChannel && !error && !showControls && (
        <div
          className="absolute inset-0 z-10"
          onDoubleClick={toggleFullscreen}
          onClick={() => {
            togglePlay();
            resetControlsTimer();
          }}
        />
      )}
    </div>
  );
}