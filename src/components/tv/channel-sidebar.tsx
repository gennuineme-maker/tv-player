"use client";

import { useState, useMemo } from "react";
import { useTvStore } from "@/lib/store";
import { Channel, defaultCategories } from "@/lib/channels";
import { Search, X, Star, Clock, ChevronRight, Tv, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function ChannelSidebar() {
  const {
    channels,
    sidebarOpen,
    setSidebarOpen,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    currentChannelId,
    setCurrentChannel,
    addRecent,
    favorites,
    toggleFavorite,
    isFavorite,
    recentChannels,
    removeChannel,
  } = useTvStore();

  const [showSearch, setShowSearch] = useState(false);

  // Dynamic categories from all channels
  const allCategories = useMemo(() => {
    const cats = new Set(channels.map((c) => c.category));
    return ["All", ...Array.from(cats).sort()];
  }, [channels]);

  const filteredChannels = useMemo(() => {
    let chs = channels;
    if (activeCategory !== "All") {
      chs = chs.filter((c) => c.category === activeCategory);
    }
    if (searchQuery) {
      chs = chs.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return chs;
  }, [channels, activeCategory, searchQuery]);

  const favoriteChannels = useMemo(
    () => channels.filter((c) => isFavorite(c.id)),
    [channels, isFavorite]
  );

  const recent = useMemo(
    () =>
      recentChannels
        .map((id) => channels.find((c) => c.id === id))
        .filter(Boolean) as Channel[],
    [channels, recentChannels]
  );

  const selectChannel = (id: string) => {
    setCurrentChannel(id);
    addRecent(id);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -288 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 bottom-0 w-72 bg-zinc-950/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Tv size={16} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight block leading-tight">
                TV Player
              </span>
              <span className="text-white/25 text-[10px]">{channels.length} channels</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
              onClick={() => setShowSearch(!showSearch)}
            >
              {showSearch ? <X size={16} /> : <Search size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3">
                <Input
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm focus-visible:ring-orange-500/50"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories */}
        <div className="px-4 py-2 flex flex-wrap gap-1.5">
          {allCategories.map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? "default" : "secondary"}
              className={`cursor-pointer text-[11px] px-2.5 py-0.5 transition-all ${
                activeCategory === cat
                  ? "bg-orange-600 hover:bg-orange-500 text-white"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border-0"
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>

        <Separator className="bg-white/5" />

        {/* Channel list */}
        <ScrollArea className="flex-1">
          {favoriteChannels.length > 0 && !searchQuery && (
            <div className="mb-2">
              <div className="flex items-center gap-2 px-4 py-2">
                <Star size={12} className="text-orange-400 fill-orange-400" />
                <span className="text-white/40 text-[11px] font-semibold uppercase tracking-wider">
                  Favorites
                </span>
              </div>
              {favoriteChannels.map((ch) => (
                <ChannelItem
                  key={ch.id}
                  channel={ch}
                  isActive={currentChannelId === ch.id}
                  isFav
                  onSelect={() => selectChannel(ch.id)}
                  onToggleFav={() => toggleFavorite({ id: ch.id, name: ch.name })}
                  canDelete={ch.id.startsWith("custom_") || ch.id.startsWith("import_")}
                  onDelete={() => removeChannel(ch.id)}
                />
              ))}
              <Separator className="bg-white/5 my-1" />
            </div>
          )}

          {recent.length > 0 && !searchQuery && (
            <div className="mb-2">
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-blue-400" />
                  <span className="text-white/40 text-[11px] font-semibold uppercase tracking-wider">
                    Recent
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-white/20 hover:text-white/50"
                  onClick={() => useTvStore.setState({ recentChannels: [] })}
                >
                  <Trash2 size={10} />
                </Button>
              </div>
              {recent.slice(0, 5).map((ch) => (
                <ChannelItem
                  key={ch.id}
                  channel={ch}
                  isActive={currentChannelId === ch.id}
                  isFav={isFavorite(ch.id)}
                  onSelect={() => selectChannel(ch.id)}
                  onToggleFav={() => toggleFavorite({ id: ch.id, name: ch.name })}
                />
              ))}
              <Separator className="bg-white/5 my-1" />
            </div>
          )}

          <div className="mb-2">
            <div className="px-4 py-2">
              <span className="text-white/40 text-[11px] font-semibold uppercase tracking-wider">
                {searchQuery
                  ? `Results (${filteredChannels.length})`
                  : activeCategory !== "All"
                  ? `${activeCategory} (${filteredChannels.length})`
                  : `All Channels (${filteredChannels.length})`}
              </span>
            </div>
            {filteredChannels.map((ch) => (
              <ChannelItem
                key={ch.id}
                channel={ch}
                isActive={currentChannelId === ch.id}
                isFav={isFavorite(ch.id)}
                onSelect={() => selectChannel(ch.id)}
                onToggleFav={() => toggleFavorite({ id: ch.id, name: ch.name })}
                canDelete={ch.id.startsWith("custom_") || ch.id.startsWith("import_")}
                onDelete={() => removeChannel(ch.id)}
              />
            ))}
            {filteredChannels.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Search size={24} className="mx-auto text-white/20 mb-2" />
                <p className="text-white/30 text-sm">No channels found</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer shortcuts */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center justify-center gap-3 text-[10px] text-white/20">
            <span>
              <kbd className="px-1 py-0.5 bg-white/5 rounded text-white/30 font-mono">F</kbd> Fullscreen
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white/5 rounded text-white/30 font-mono">M</kbd> Mute
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white/5 rounded text-white/30 font-mono">P</kbd> Mini
            </span>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function ChannelItem({
  channel,
  isActive,
  isFav,
  onSelect,
  onToggleFav,
  canDelete,
  onDelete,
}: {
  channel: Channel;
  isActive: boolean;
  isFav: boolean;
  onSelect: () => void;
  onToggleFav: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={() => {
        if (confirmDelete) return;
        onSelect();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group cursor-pointer ${
        isActive ? "bg-white/5 border-r-2" : "hover:bg-white/[0.03]"
      }`}
      style={isActive ? { borderRightColor: channel.color } : undefined}
    >
      {channel.logo ? (
        <img
          src={channel.logo}
          alt={channel.name}
          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "flex";
          }}
        />
      ) : null}
      <div
        className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
        style={{
          backgroundColor: isActive ? channel.color : `${channel.color}30`,
          display: channel.logo ? "none" : "flex",
        }}
      >
        {channel.number}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-medium truncate ${
            isActive ? "text-white" : "text-white/70 group-hover:text-white/90"
          }`}
        >
          {channel.name}
        </div>
        <div className="text-[11px] text-white/30 truncate">
          {channel.category}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {isActive && (
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: channel.color }} />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav();
          }}
          className={`p-1 rounded transition-colors ${
            isFav
              ? "text-orange-400"
              : "text-transparent group-hover:text-white/30 hover:!text-white/60"
          }`}
        >
          <Star size={12} fill={isFav ? "currentColor" : "none"} />
        </button>
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirmDelete) {
                onDelete?.();
                setConfirmDelete(false);
              } else {
                setConfirmDelete(true);
                setTimeout(() => setConfirmDelete(false), 2000);
              }
            }}
            className={`p-1 rounded transition-colors ${
              confirmDelete
                ? "text-red-400"
                : "text-transparent group-hover:text-white/20 hover:!text-red-400/60"
            }`}
            title={confirmDelete ? "Click again to delete" : "Delete channel"}
          >
            <Trash2 size={11} />
          </button>
        )}
        <ChevronRight
          size={14}
          className={`transition-colors ${
            isActive ? "text-white/40" : "text-transparent group-hover:text-white/20"
          }`}
        />
      </div>
    </motion.div>
  );
}