"use client";

import { useState, useMemo, useRef, useEffect, memo, useCallback } from "react";
import { useTvStore } from "@/lib/store";
import { Channel } from "@/lib/channels";
import {
  Search, X, Star, Clock, Tv, Trash2,
  ArrowLeft, ChevronRight, RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CHAN_PAGE = 80;

type View = "categories" | "channels";
interface ViewState {
  view: View;
  category: string | null;
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [viewState, setViewState] = useState<ViewState>({ view: "categories", category: null });
  const [catPage, setCatPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(localSearch), 200);
    return () => clearTimeout(debounceRef.current);
  }, [localSearch]);

  // Focus search input
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [showSearch]);

  // Reset page when category changes
  useEffect(() => {
    setCatPage(1);
  }, [viewState.category]);

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

  // Search results
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

  // Current category channels (for drill-down view)
  const activeCategoryChannels = useMemo(() => {
    if (!viewState.category) return [];
    if (viewState.category === "__favorites__") return favoriteChannels;
    if (viewState.category === "__recent__") return recent;
    return categoriesMap.get(viewState.category) || [];
  }, [categoriesMap, viewState.category, favoriteChannels, recent]);

  const visibleCategoryChannels = activeCategoryChannels.slice(0, catPage * CHAN_PAGE);
  const hasMoreChannels = visibleCategoryChannels.length < activeCategoryChannels.length;

  const selectChannel = useCallback((id: string) => {
    setCurrentChannel(id);
    addRecent(id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [setCurrentChannel, addRecent, setSidebarOpen]);

  const openCategory = useCallback((cat: string) => {
    setViewState({ view: "channels", category: cat });
  }, []);

  const goBack = useCallback(() => {
    setViewState({ view: "categories", category: null });
  }, []);

  const resetAll = useCallback(() => {
    const state = useTvStore.getState();
    setChannels([]);
    useTvStore.setState({ currentChannelId: null, recentChannels: [], favorites: [] });
    localStorage.removeItem("tv-channels");
    localStorage.removeItem("tv-recent");
    localStorage.removeItem("tv-favorites");
    setViewState({ view: "categories", category: null });
  }, [setChannels]);

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

  // When search is active, override view
  const isSearchActive = searchQuery.length > 0;

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-72 bg-zinc-950/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {viewState.view === "channels" && !isSearchActive ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 flex-shrink-0"
                onClick={goBack}
              >
                <ArrowLeft size={16} />
              </Button>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
                <Tv size={16} className="text-white" />
              </div>
            )}
            <div className="min-w-0">
              <span className="text-white font-bold text-lg tracking-tight block leading-tight truncate">
                {isSearchActive
                  ? "Search"
                  : viewState.view === "channels" && viewState.category
                    ? viewState.category
                    : "RajeshTV"}
              </span>
              <span className="text-white/25 text-[10px]">
                {isSearchActive
                  ? `${searchResults.length} results`
                  : viewState.view === "channels" && viewState.category
                    ? `${activeCategoryChannels.length} channels`
                    : `${channels.length} channels`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
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
        {showSearch && (
          <div className="px-4 py-3 flex-shrink-0 border-b border-white/5">
            <Input
              ref={searchInputRef}
              placeholder="Search channels..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm focus-visible:ring-orange-500/50"
            />
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {isSearchActive ? (
            /* ===== SEARCH RESULTS ===== */
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
          ) : viewState.view === "channels" && viewState.category ? (
            /* ===== DRILL-DOWN: CHANNEL LIST FOR SELECTED CATEGORY ===== */
            <div>
              {visibleCategoryChannels.map((ch) => (
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
              {hasMoreChannels && (
                <button
                  type="button"
                  onClick={() => setCatPage((p) => p + 1)}
                  className="w-full py-2.5 text-center text-white/25 hover:text-white/50 text-[11px] transition-colors"
                >
                  Load more ({Math.min(CHAN_PAGE, activeCategoryChannels.length - visibleCategoryChannels.length)} more)
                </button>
              )}
              {activeCategoryChannels.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <Tv size={24} className="mx-auto text-white/20 mb-2" />
                  <p className="text-white/30 text-sm">No channels</p>
                </div>
              )}
            </div>
          ) : (
            /* ===== CATEGORIES VIEW ===== */
            <div>
              {/* Favorites quick access */}
              {favoriteChannels.length > 0 && (
                <CategoryItem
                  icon={<Star size={13} className="text-orange-400 fill-orange-400" />}
                  name="Favorites"
                  count={favoriteChannels.length}
                  accent
                  onClick={() => {
                    setViewState({ view: "channels", category: "__favorites__" });
                  }}
                />
              )}

              {/* Recent quick access */}
              {recent.length > 0 && (
                <div className="relative">
                  <CategoryItem
                    icon={<Clock size={13} className="text-blue-400" />}
                    name="Recent"
                    count={recent.length}
                    onClick={() => {
                      setViewState({ view: "channels", category: "__recent__" });
                    }}
                    extra={
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          useTvStore.setState({ recentChannels: [] });
                        }}
                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/50 transition-opacity p-0.5"
                        title="Clear recent"
                      >
                        <Trash2 size={10} />
                      </button>
                    }
                  />
                </div>
              )}

              {/* Divider */}
              {(favoriteChannels.length > 0 || recent.length > 0) && sortedCategories.length > 0 && (
                <div className="mx-4 my-1 border-t border-white/5" />
              )}

              {/* All categories */}
              {sortedCategories.map((cat) => (
                <CategoryItem
                  key={cat}
                  name={cat}
                  count={categoriesMap.get(cat)!.length}
                  onClick={() => openCategory(cat)}
                  extra={
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteCategory(cat); }}
                      className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-opacity p-0.5"
                      title={`Delete "${cat}"`}
                    >
                      <Trash2 size={10} />
                    </button>
                  }
                />
              ))}

              {channels.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <Tv size={28} className="mx-auto text-white/15 mb-3" />
                  <p className="text-white/25 text-sm">No channels yet</p>
                  <p className="text-white/15 text-xs mt-1">Import a playlist to get started</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 flex-shrink-0 space-y-2">
          {channels.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-white/30 hover:text-red-400 hover:bg-red-400/10 text-xs gap-1.5"
                >
                  <RotateCcw size={12} />
                  Reset All Channels
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-900 border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Reset All Channels?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/50">
                    This will permanently delete all {channels.length} channels, favorites, and recent history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={resetAll}
                  >
                    Yes, Reset All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <div className="flex items-center justify-center gap-3 text-[10px] text-white/20">
            <span><kbd className="px-1 py-0.5 bg-white/5 rounded text-white/30 font-mono">F</kbd> Fullscreen</span>
            <span><kbd className="px-1 py-0.5 bg-white/5 rounded text-white/30 font-mono">M</kbd> Mute</span>
            <span><kbd className="px-1 py-0.5 bg-white/5 rounded text-white/30 font-mono">P</kbd> Mini</span>
          </div>
        </div>
      </aside>
    </>
  );
}

/* Category row item - shown in the categories view */
function CategoryItem({
  icon,
  name,
  count,
  accent,
  onClick,
  extra,
}: {
  icon?: React.ReactNode;
  name: string;
  count: number;
  accent?: boolean;
  onClick: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className="group flex items-center gap-2.5 px-4 py-2.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
      onClick={onClick}
    >
      {icon || <ChevronRight size={13} className="text-white/20 flex-shrink-0" />}
      <span className={`text-sm font-medium flex-1 truncate ${accent ? "text-white/60" : "text-white/50"}`}>
        {name}
      </span>
      <span className="text-white/20 text-[11px] font-mono flex-shrink-0">{count}</span>
      {extra}
    </div>
  );
}

/* Memoized sidebar channel item */
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
      className={`w-full flex items-center gap-3 pl-4 pr-4 py-2 text-left transition-colors group cursor-pointer ${
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