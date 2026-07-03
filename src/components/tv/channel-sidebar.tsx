"use client";

import { useState, useMemo, useRef, useEffect, memo, useCallback } from "react";
import { useTvStore } from "@/lib/store";
import { Channel } from "@/lib/channels";
import {
  Search, X, Star, Clock, ChevronDown, ChevronRight,
  Tv, Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CAT_PAGE = 80;

export function ChannelSidebar() {
  const {
    channels,
    sidebarOpen,
    setSidebarOpen,
    currentChannelId,
    setCurrentChannel,
    addRecent,
    toggleFavorite,
    isFavorite,
    recentChannels,
    removeChannel,
    setChannels,
  } = useTvStore();

  const [showSearch, setShowSearch] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [expandedFavs, setExpandedFavs] = useState(true);
  const [expandedRecent, setExpandedRecent] = useState(true);
  const [catPage, setCatPage] = useState<Record<string, number>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(localSearch), 200);
    return () => clearTimeout(debounceRef.current);
  }, [localSearch]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [showSearch]);

  // Group channels by category
  const categoriesMap = useMemo(() => {
    const map = new Map<string, Channel[]>();
    for (const ch of channels) {
      const cat = ch.category || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(ch);
    }
    return map;
  }, [channels]);

  const sortedCategories = useMemo(
    () => Array.from(categoriesMap.keys()).sort(),
    [categoriesMap]
  );

  // Search results (flat)
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return channels.filter((c) => c.name.toLowerCase().includes(q));
  }, [channels, searchQuery]);

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

  const selectChannel = useCallback((id: string) => {
    setCurrentChannel(id);
    addRecent(id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [setCurrentChannel, addRecent, setSidebarOpen]);

  const toggleCat = useCallback((cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const loadMoreCat = useCallback((cat: string) => {
    setCatPage((prev) => ({ ...prev, [cat]: (prev[cat] || 1) + 1 }));
  }, []);

  const deleteCategory = useCallback((cat: string) => {
    const state = useTvStore.getState();
    const ids = state.channels.filter((c) => c.category === cat).map((c) => c.id);
    if (!ids.length) return;
    setChannels(state.channels.filter((c) => c.category !== cat));
    if (ids.includes(state.currentChannelId)) {
      useTvStore.setState({ currentChannelId: null });
    }
  }, [setChannels]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    setShowSearch(false);
    setLocalSearch("");
    setSearchQuery("");
  }, [setSidebarOpen]);

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -288 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 bottom-0 w-72 bg-zinc-950/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Tv size={16} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight block leading-tight">TV Player</span>
              <span className="text-white/25 text-[10px]">{channels.length} channels</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
              onClick={() => {
                const next = !showSearch;
                setShowSearch(next);
                if (!next) { setLocalSearch(""); setSearchQuery(""); }
              }}
            >
              {showSearch ? <X size={16} /> : <Search size={16} />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
              onClick={closeSidebar}
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
              className="overflow-hidden flex-shrink-0"
            >
              <div className="px-4 py-3">
                <Input
                  ref={searchInputRef}
                  placeholder="Search channels..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm focus-visible:ring-orange-500/50"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">

          {/* Search results mode */}
          {searchQuery ? (
            <div>
              <div className="px-4 py-2">
                <span className="text-white/40 text-[11px] font-semibold uppercase tracking-wider">
                  Results ({searchResults.length})
                </span>
              </div>
              {searchResults.slice(0, 100).map((ch) => (
                <ChannelItem
                  key={ch.id}
                  channel={ch}
                  isActive={currentChannelId === ch.id}
                  isFav={isFavorite(ch.id)}
                  onSelect={() => selectChannel(ch.id)}
                  onToggleFav={() => toggleFavorite({ id: ch.id, name: ch.name })}
                  canDelete
                  onDelete={() => removeChannel(ch.id)}
                />
              ))}
              {searchResults.length > 100 && (
                <p className="text-white/20 text-[11px] text-center py-3">
                  Showing 100 of {searchResults.length}
                </p>
              )}
              {searchResults.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <Search size={24} className="mx-auto text-white/20 mb-2" />
                  <p className="text-white/30 text-sm">No channels found</p>
                </div>
              )}
            </div>
          ) : (
            /* Normal category accordion mode */
            <>
              {/* Favorites */}
              {favoriteChannels.length > 0 && (
                <CategorySection
                  title="Favorites"
                  icon={<Star size={12} className="text-orange-400 fill-orange-400" />}
                  count={favoriteChannels.length}
                  expanded={expandedFavs}
                  onToggle={() => setExpandedFavs(!expandedFavs)}
                  accent
                >
                  {favoriteChannels.slice(0, 30).map((ch) => (
                    <ChannelItem
                      key={ch.id}
                      channel={ch}
                      isActive={currentChannelId === ch.id}
                      isFav
                      onSelect={() => selectChannel(ch.id)}
                      onToggleFav={() => toggleFavorite({ id: ch.id, name: ch.name })}
                      canDelete
                      onDelete={() => removeChannel(ch.id)}
                    />
                  ))}
                </CategorySection>
              )}

              {/* Recent */}
              {recent.length > 0 && (
                <CategorySection
                  title="Recent"
                  icon={<Clock size={12} className="text-blue-400" />}
                  count={recent.length}
                  expanded={expandedRecent}
                  onToggle={() => setExpandedRecent(!expandedRecent)}
                  extra={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 text-white/20 hover:text-white/50"
                      onClick={(e) => { e.stopPropagation(); useTvStore.setState({ recentChannels: [] }); }}
                    >
                      <Trash2 size={9} />
                    </Button>
                  }
                >
                  {recent.slice(0, 10).map((ch) => (
                    <ChannelItem
                      key={ch.id}
                      channel={ch}
                      isActive={currentChannelId === ch.id}
                      isFav={isFavorite(ch.id)}
                      onSelect={() => selectChannel(ch.id)}
                      onToggleFav={() => toggleFavorite({ id: ch.id, name: ch.name })}
                      canDelete
                      onDelete={() => removeChannel(ch.id)}
                    />
                  ))}
                </CategorySection>
              )}

              {/* Category groups */}
              {sortedCategories.map((cat) => {
                const catChannels = categoriesMap.get(cat)!;
                const isExpanded = expandedCats.has(cat);
                const page = catPage[cat] || 1;
                const visible = catChannels.slice(0, page * CAT_PAGE);
                const hasMore = visible.length < catChannels.length;

                return (
                  <div key={cat}>
                    <div
                      className="flex items-center gap-2 px-4 py-2.5 cursor-pointer group/cat hover:bg-white/[0.02] transition-colors"
                      onClick={() => toggleCat(cat)}
                    >
                      <div className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                        <ChevronRight size={12} className="text-white/25" />
                      </div>
                      <span className="text-white/50 text-xs font-medium flex-1 truncate">{cat}</span>
                      <span className="text-white/20 text-[10px] font-mono">{catChannels.length}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteCategory(cat); }}
                        className="opacity-0 group-hover/cat:opacity-100 text-white/20 hover:text-red-400 transition-opacity p-0.5"
                        title={`Delete "${cat}"`}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          {visible.map((ch) => (
                            <ChannelItem
                              key={ch.id}
                              channel={ch}
                              isActive={currentChannelId === ch.id}
                              isFav={isFavorite(ch.id)}
                              onSelect={() => selectChannel(ch.id)}
                              onToggleFav={() => toggleFavorite({ id: ch.id, name: ch.name })}
                              canDelete
                              onDelete={() => removeChannel(ch.id)}
                            />
                          ))}
                          {hasMore && (
                            <button
                              type="button"
                              onClick={() => loadMoreCat(cat)}
                              className="w-full py-2 text-center text-white/25 hover:text-white/50 text-[11px] transition-colors"
                            >
                              Show more ({catChannels.length - visible.length} remaining)
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 flex-shrink-0">
          <div className="flex items-center justify-center gap-3 text-[10px] text-white/20">
            <span><kbd className="px-1 py-0.5 bg-white/5 rounded text-white/30 font-mono">F</kbd> Fullscreen</span>
            <span><kbd className="px-1 py-0.5 bg-white/5 rounded text-white/30 font-mono">M</kbd> Mute</span>
            <span><kbd className="px-1 py-0.5 bg-white/5 rounded text-white/30 font-mono">P</kbd> Mini</span>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

/* Collapsible section with header */
function CategorySection({
  title,
  icon,
  count,
  expanded,
  onToggle,
  accent,
  extra,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  accent?: boolean;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="flex items-center gap-2 px-4 py-2.5 cursor-pointer group/cat hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}>
          <ChevronRight size={12} className={accent ? "text-orange-400" : "text-white/25"} />
        </div>
        {icon}
        <span className={`text-xs font-medium flex-1 ${accent ? "text-white/50" : "text-white/40"}`}>
          {title}
        </span>
        <span className="text-white/20 text-[10px] font-mono">{count}</span>
        {extra}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Memoized sidebar item */
const ChannelItem = memo(function ChannelItem({
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
    <div
      onClick={() => { if (!confirmDelete) onSelect(); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      className={`w-full flex items-center gap-3 pl-10 pr-4 py-2 text-left transition-colors group cursor-pointer ${
        isActive ? "bg-white/5 border-r-2" : "hover:bg-white/[0.03]"
      }`}
      style={isActive ? { borderRightColor: channel.color } : undefined}
    >
      <div className="w-7 h-7 rounded flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
        style={{ backgroundColor: isActive ? channel.color : `${channel.color}30` }}
      >
        {channel.number}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-white/60 group-hover:text-white/90"}`}>
          {channel.name}
        </div>
      </div>

      <div className="flex items-center gap-0.5 flex-shrink-0">
        {isActive && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: channel.color }} />}
        <button type="button" onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
          className={`p-1 rounded transition-colors ${isFav ? "text-orange-400" : "text-transparent group-hover:text-white/30 hover:!text-white/60"}`}>
          <Star size={11} fill={isFav ? "currentColor" : "none"} />
        </button>
        {canDelete && (
          <button type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirmDelete) { onDelete?.(); setConfirmDelete(false); }
              else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 2000); }
            }}
            className={`p-1 rounded transition-colors ${confirmDelete ? "text-red-400" : "text-transparent group-hover:text-white/20 hover:!text-red-400/60"}`}
            title={confirmDelete ? "Click again to delete" : "Delete"}>
            <Trash2 size={10} />
          </button>
        )}
      </div>
    </div>
  );
});