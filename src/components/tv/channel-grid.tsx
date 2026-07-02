"use client";

import { useTvStore } from "@/lib/store";
import { Channel } from "@/lib/channels";
import { Star, Tv, Play, Heart, Zap, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function ChannelGrid() {
  const {
    channels,
    currentChannelId,
    setCurrentChannel,
    addRecent,
    isFavorite,
    recentChannels,
    miniPlayer,
    removeChannel,
  } = useTvStore();

  const selectChannel = (id: string) => {
    setCurrentChannel(id);
    addRecent(id);
  };

  const favoriteChannels = channels.filter((c) => isFavorite(c.id));
  const recent = recentChannels
    .map((id) => channels.find((c) => c.id === id))
    .filter(Boolean) as Channel[];

  if (miniPlayer) return null;

  return (
    <div className="bg-zinc-950 border-t border-white/5">
      {currentChannelId && <NowPlayingBar />}

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
        {favoriteChannels.length > 0 && (
          <ChannelRow
            title="Favorites"
            icon={<Star size={14} className="text-orange-400 fill-orange-400" />}
            channels={favoriteChannels}
            currentChannelId={currentChannelId}
            isFavorite={isFavorite}
            onSelect={selectChannel}
            accent
          />
        )}

        {recent.length > 0 && (
          <ChannelRow
            title="Recently Watched"
            icon={<Zap size={14} className="text-blue-400" />}
            channels={recent.slice(0, 10)}
            currentChannelId={currentChannelId}
            isFavorite={isFavorite}
            onSelect={selectChannel}
          />
        )}

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tv size={14} className="text-white/40" />
            <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
              All Channels ({channels.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {channels.map((ch, i) => (
              <ChannelCard
                key={ch.id}
                channel={ch}
                index={i}
                isActive={currentChannelId === ch.id}
                isFav={isFavorite(ch.id)}
                onSelect={() => selectChannel(ch.id)}
                onDelete={() => removeChannel(ch.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelRow({
  title,
  icon,
  channels,
  currentChannelId,
  isFavorite,
  onSelect,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  channels: Channel[];
  currentChannelId: string | null;
  isFavorite: (id: string) => boolean;
  onSelect: (id: string) => void;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {channels.map((ch, i) => (
            <ChannelCard
              key={ch.id}
              channel={ch}
              index={i}
              isActive={currentChannelId === ch.id}
              isFav={isFavorite(ch.id)}
              onSelect={() => onSelect(ch.id)}
              compact
              accent={accent}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>
    </div>
  );
}

function ChannelCard({
  channel,
  index,
  isActive,
  isFav,
  onSelect,
  onDelete,
  compact,
  accent,
}: {
  channel: Channel;
  index: number;
  isActive: boolean;
  isFav: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  compact?: boolean;
  accent?: boolean;
}) {
  const isCustom = channel.id.startsWith("custom_") || channel.id.startsWith("import_");

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); }}}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`group relative rounded-xl overflow-hidden text-left transition-all ${
        compact ? "w-36 flex-shrink-0" : ""
      } ${
        isActive
          ? "ring-2 ring-offset-1 ring-offset-zinc-950"
          : "hover:ring-1 hover:ring-white/10"
      }`}
      style={isActive ? { ringColor: channel.color } : undefined}
    >
      <div
        className={`h-1 w-full ${compact ? "h-0.5" : ""}`}
        style={{ backgroundColor: channel.color }}
      />

      <div
        className={`${
          compact ? "p-2.5" : "p-3"
        } bg-zinc-900/80 group-hover:bg-zinc-800/80 transition-colors`}
      >
        <div className="flex items-center gap-2">
          {channel.logo ? (
            <img
              src={channel.logo}
              alt={channel.name}
              className={`${compact ? "w-8 h-8" : "w-10 h-10"} rounded-lg object-cover flex-shrink-0`}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div
            className={`${compact ? "w-8 h-8" : "w-10 h-10"} rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 ${channel.logo ? "hidden" : ""}`}
            style={{
              backgroundColor: isActive ? channel.color : `${channel.color}25`,
              fontSize: compact ? "11px" : "13px",
            }}
          >
            {channel.number}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`font-medium truncate ${
                compact ? "text-xs" : "text-sm"
              } ${
                isActive
                  ? "text-white"
                  : "text-white/70 group-hover:text-white/90"
              }`}
            >
              {channel.name}
            </p>
            <p className="text-[10px] text-white/30 truncate">
              {channel.category}
              {isCustom && " • Custom"}
            </p>
          </div>
        </div>

        {/* Play indicator on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play size={14} className="text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
          {isActive && (
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: channel.color }}
            />
          )}
          {isFav && (
            <Heart size={10} className="text-orange-400" fill="currentColor" />
          )}
          {isCustom && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400"
              title="Remove channel"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function NowPlayingBar() {
  const { currentChannelId, miniPlayer, channels } = useTvStore();
  const channel = channels.find((c) => c.id === currentChannelId);
  if (!channel || miniPlayer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-2.5 bg-zinc-900/50 border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: channel.color }}
          />
          <span className="text-white/30 text-[11px] font-semibold uppercase tracking-wider">
            Now Playing
          </span>
        </div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold"
            style={{ backgroundColor: channel.color }}
          >
            {channel.number}
          </div>
          <span className="text-white/80 text-sm font-medium">
            {channel.name}
          </span>
        </div>
        <span className="text-white/20 text-xs">|</span>
        <span className="text-white/30 text-xs">{channel.category}</span>
      </div>
    </motion.div>
  );
}