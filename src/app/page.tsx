"use client";

import { useEffect } from "react";
import { VideoPlayer } from "@/components/tv/player";
import { ChannelSidebar } from "@/components/tv/channel-sidebar";
import { ChannelGrid } from "@/components/tv/channel-grid";
import { AddChannelDialog } from "@/components/tv/add-channel-dialog";
import { ImportPlaylistDialog } from "@/components/tv/import-playlist-dialog";
import { useTvStore } from "@/lib/store";
import { Menu, Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { sampleChannels } from "@/lib/channels";
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

export default function TvPage() {
  const { sidebarOpen, setSidebarOpen, setCurrentChannel, addRecent, miniPlayer, channels, setChannels } =
    useTvStore();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState("");

  // Auto-select first channel on mount
  useEffect(() => {
    const first = channels[0];
    if (first && !useTvStore.getState().currentChannelId) {
      setCurrentChannel(first.id);
      addRecent(first.id);
    }
  }, []);

  const filteredForSearch = mobileSearch
    ? channels.filter((c) =>
        c.name.toLowerCase().includes(mobileSearch.toLowerCase())
      )
    : [];

  const handleResetChannels = () => {
    setChannels(sampleChannels);
    useTvStore.setState({ currentChannelId: null });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <ChannelSidebar />

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:ml-72" : ""
        }`}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-3 py-2 bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} />
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                  <polyline points="17 2 12 7 7 2" />
                </svg>
              </div>
              <span className="text-white font-bold text-sm tracking-tight">
                TV Player
              </span>
              <span className="text-white/20 text-xs">
                {channels.length} ch
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <AddChannelDialog />
            <ImportPlaylistDialog />

            {/* Mobile search */}
            <AnimatePresence>
              {mobileSearchOpen ? (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <Input
                    placeholder="Search channels..."
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-8 text-sm focus-visible:ring-orange-500/50 w-full"
                    autoFocus
                    onBlur={() => {
                      if (!mobileSearch) setMobileSearchOpen(false);
                    }}
                  />
                </motion.div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <Search size={18} />
                </Button>
              )}
            </AnimatePresence>

            {/* Reset channels */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white/30 hover:text-white/60 hover:bg-white/10"
                  title="Reset to default channels"
                >
                  <RotateCcw size={16} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Reset Channels?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/50">
                    This will remove all your custom channels and restore the original defaults. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-white/60 hover:text-white hover:bg-white/10 border-white/10">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetChannels}
                    className="bg-red-600 hover:bg-red-500 text-white"
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Mobile search results */}
        <AnimatePresence>
          {mobileSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-zinc-900/50 border-b border-white/5"
            >
              <div className="max-h-48 overflow-y-auto p-2 space-y-0.5">
                {filteredForSearch.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setCurrentChannel(ch.id);
                      addRecent(ch.id);
                      setMobileSearch("");
                      setMobileSearchOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: ch.color }}
                    >
                      {ch.number}
                    </div>
                    <div>
                      <p className="text-white/90 text-sm font-medium">
                        {ch.name}
                      </p>
                      <p className="text-white/30 text-xs">{ch.category}</p>
                    </div>
                  </button>
                ))}
                {filteredForSearch.length === 0 && (
                  <p className="text-white/30 text-sm text-center py-4">
                    No channels found
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <VideoPlayer />
        {!miniPlayer && <ChannelGrid />}
      </div>
    </div>
  );
}