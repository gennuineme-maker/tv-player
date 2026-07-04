import { create } from "zustand";
import { Channel } from "./channels";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e", "#a855f7",
  "#d946ef", "#6366f1", "#10b981", "#0ea5e9", "#dc2626",
  "#7c3aed", "#e11d48", "#b45309", "#ca8a04", "#854d0e",
];

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

interface Favorite {
  id: string;
  name: string;
}

interface TvStore {
  // All channels (sample + user-added)
  channels: Channel[];
  setChannels: (ch: Channel[]) => void;

  // Channel CRUD
  addChannel: (ch: Omit<Channel, "id" | "number" | "color">) => void;
  removeChannel: (id: string) => void;
  editChannel: (id: string, updates: Partial<Channel>) => void;
  importChannels: (channels: Omit<Channel, "id" | "number" | "color">[]) => void;

  // Current channel
  currentChannelId: string | null;
  setCurrentChannel: (id: string) => void;

  // Favorites
  favorites: Favorite[];
  toggleFavorite: (channel: { id: string; name: string }) => void;
  isFavorite: (id: string) => boolean;

  // Recently watched
  recentChannels: string[];
  addRecent: (id: string) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Category filter
  activeCategory: string;
  setActiveCategory: (cat: string) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Mini player
  miniPlayer: boolean;
  setMiniPlayer: (mini: boolean) => void;

  // Volume
  volume: number;
  setVolume: (v: number) => void;

  // Muted
  muted: boolean;
  setMuted: (m: boolean) => void;
}

// ---- localStorage helpers ----
const loadJSON = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const saveJSON = (key: string, val: unknown) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
};

export const useTvStore = create<TvStore>((set, get) => ({
  // ---- Channels ----
  channels: [] as Channel[],
  setChannels: (ch) => { set({ channels: ch }); saveJSON("tv-channels", ch); },

  addChannel: (ch) => {
    const { channels } = get();
    const maxNum = channels.reduce((m, c) => Math.max(m, c.number), 0);
    const newCh: Channel = {
      ...ch,
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      number: maxNum + 1,
      color: ch.color || randomColor(),
    };
    const next = [...channels, newCh];
    saveJSON("tv-channels", next);
    set({ channels: next });
  },

  removeChannel: (id) => {
    const { channels } = get();
    const next = channels.filter((c) => c.id !== id);
    saveJSON("tv-channels", next);
    set({ channels: next });
  },

  editChannel: (id, updates) => {
    const { channels } = get();
    const next = channels.map((c) => (c.id === id ? { ...c, ...updates } : c));
    saveJSON("tv-channels", next);
    set({ channels: next });
  },

  importChannels: (newChannels) => {
    const { channels } = get();
    const maxNum = channels.reduce((m, c) => Math.max(m, c.number), 0);
    const imported: Channel[] = newChannels.map((ch, i) => ({
      ...ch,
      id: `import_${Date.now()}_${i}`,
      number: maxNum + i + 1,
      color: ch.color || randomColor(),
    }));
    const next = [...channels, ...imported];
    saveJSON("tv-channels", next);
    set({ channels: next });
  },

  // ---- Current channel ----
  currentChannelId: null,
  setCurrentChannel: (id) => set({ currentChannelId: id }),

  // ---- Favorites ----
  favorites: [],
  toggleFavorite: (channel) => {
    const { favorites } = get();
    const exists = favorites.some((f) => f.id === channel.id);
    const next = exists
      ? favorites.filter((f) => f.id !== channel.id)
      : [...favorites, channel];
    saveJSON("tv-favorites", next);
    set({ favorites: next });
  },
  isFavorite: (id) => get().favorites.some((f) => f.id === id),

  // ---- Recent ----
  recentChannels: [],
  addRecent: (id) => {
    const { recentChannels } = get();
    const next = [id, ...recentChannels.filter((c) => c !== id)];
    saveJSON("tv-recent", next.slice(0, 30));
    set({ recentChannels: next });
  },

  // ---- Search ----
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  // ---- Category ----
  activeCategory: "All",
  setActiveCategory: (cat) => set({ activeCategory: cat }),

  // ---- Sidebar ----
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // ---- Mini player ----
  miniPlayer: false,
  setMiniPlayer: (mini) => set({ miniPlayer: mini }),

  // ---- Volume ----
  volume: 0.8,
  setVolume: (v) => set({ volume: v }),

  muted: false,
  setMuted: (m) => set({ muted: m }),
}));

// Hydrate from localStorage on client
if (typeof window !== "undefined") {
  const channels = loadJSON<Channel[]>("tv-channels", null);
  const favs = loadJSON<Favorite[]>("tv-favorites", []);
  const recent = loadJSON<string[]>("tv-recent", []);
  useTvStore.setState({
    channels: channels ?? [],
    favorites: favs,
    recentChannels: recent,
  });

  // Auto-load default playlist on first visit (no channels in localStorage)
  if (channels === null) {
    fetch("/channels.m3u")
      .then((r) => r.text())
      .then(async (text) => {
        const { parseM3U } = await import("./channels");
        const parsed = parseM3U(text);
        if (parsed.length === 0) return;
        const COLORS = [
          "#ef4444","#f97316","#eab308","#22c55e","#06b6d4",
          "#8b5cf6","#ec4899","#14b8a6","#f43f5e","#a855f7",
        ];
        const newChannels: Channel[] = parsed.map((ch, i) => ({
          id: `default_${i}`,
          name: ch.name,
          url: ch.url,
          category: ch.group || "Other",
          logo: ch.logo,
          color: COLORS[i % COLORS.length],
          number: i + 1,
        }));
        saveJSON("tv-channels", newChannels);
        useTvStore.setState({ channels: newChannels });
      })
      .catch(() => {});
  }
}