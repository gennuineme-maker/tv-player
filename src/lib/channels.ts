export interface Channel {
  id: string;
  name: string;
  url: string;
  category: string;
  logo?: string;
  color: string;
  number: number;
}

export const defaultCategories = [
  "All",
  "News",
  "Entertainment",
  "Sports",
  "Music",
  "Kids",
  "Religious",
  "International",
] as const;

export type Category = (typeof defaultCategories)[number];

const DEMO_STREAM = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

export const sampleChannels: Channel[] = [
  // News
  { id: "c1", name: "Kantipur HD", url: DEMO_STREAM, category: "News", color: "#ef4444", number: 1 },
  { id: "c2", name: "AP1 HD", url: DEMO_STREAM, category: "News", color: "#f97316", number: 2 },
  { id: "c3", name: "Himalaya TV", url: DEMO_STREAM, category: "News", color: "#eab308", number: 3 },
  { id: "c4", name: "Nepal TV", url: DEMO_STREAM, category: "News", color: "#22c55e", number: 4 },
  { id: "c5", name: "NTV News", url: DEMO_STREAM, category: "News", color: "#06b6d4", number: 5 },
  { id: "c6", name: "News 24", url: DEMO_STREAM, category: "News", color: "#8b5cf6", number: 6 },
  { id: "c7", name: "ABC News", url: DEMO_STREAM, category: "News", color: "#ec4899", number: 7 },
  { id: "c8", name: "Avenues TV", url: DEMO_STREAM, category: "News", color: "#14b8a6", number: 8 },

  // Entertainment
  { id: "c9", name: "Galaxy 4K", url: DEMO_STREAM, category: "Entertainment", color: "#a855f7", number: 9 },
  { id: "c10", name: "Kantipur Max", url: DEMO_STREAM, category: "Entertainment", color: "#f43f5e", number: 10 },
  { id: "c11", name: "Mountain TV", url: DEMO_STREAM, category: "Entertainment", color: "#0ea5e9", number: 11 },
  { id: "c12", name: "Image HD", url: DEMO_STREAM, category: "Entertainment", color: "#d946ef", number: 12 },
  { id: "c13", name: "Mega TV", url: DEMO_STREAM, category: "Entertainment", color: "#6366f1", number: 13 },
  { id: "c14", name: "Life OK Nepal", url: DEMO_STREAM, category: "Entertainment", color: "#10b981", number: 14 },

  // Sports
  { id: "c15", name: "Sports TV", url: DEMO_STREAM, category: "Sports", color: "#16a34a", number: 15 },
  { id: "c16", name: "NPL Live", url: DEMO_STREAM, category: "Sports", color: "#dc2626", number: 16 },

  // Music
  { id: "c17", name: "Music Nepal", url: DEMO_STREAM, category: "Music", color: "#e11d48", number: 17 },
  { id: "c18", name: "Yo TV", url: DEMO_STREAM, category: "Music", color: "#7c3aed", number: 18 },

  // Kids
  { id: "c19", name: "Kids Zone", url: DEMO_STREAM, category: "Kids", color: "#f59e0b", number: 19 },

  // Religious
  { id: "c20", name: "Bodhi TV", url: DEMO_STREAM, category: "Religious", color: "#ca8a04", number: 20 },
  { id: "c21", name: "Shikhar TV", url: DEMO_STREAM, category: "Religious", color: "#b45309", number: 21 },

  // International
  { id: "c22", name: "BBC World", url: DEMO_STREAM, category: "International", color: "#991b1b", number: 22 },
  { id: "c23", name: "CNN", url: DEMO_STREAM, category: "International", color: "#1e40af", number: 23 },
  { id: "c24", name: "Al Jazeera", url: DEMO_STREAM, category: "International", color: "#854d0e", number: 24 },
];

// ---- M3U Playlist Parser ----
export function parseM3U(content: string): { name: string; url: string; logo?: string; group?: string }[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const channels: { name: string; url: string; logo?: string; group?: string }[] = [];

  let currentName = "";
  let currentLogo: string | undefined;
  let currentGroup: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("#EXTINF:")) {
      // Parse name from tvg-name or after the last comma
      const nameMatch = line.match(/tvg-name="([^"]*)"/i);
      const commaMatch = line.match(/,(.+)$/);
      currentName = nameMatch?.[1] || commaMatch?.[1]?.trim() || "Unknown";

      // Parse logo
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      currentLogo = logoMatch?.[1] || undefined;

      // Parse group/category
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      currentGroup = groupMatch?.[1] || undefined;
    } else if (line.startsWith("#EXTVLCOPT:") || line.startsWith("#KODIPROP:") || line.startsWith("#EXTGRP:")) {
      if (line.startsWith("#EXTGRP:")) {
        currentGroup = line.replace("#EXTGRP:", "").trim();
      }
    } else if (!line.startsWith("#") && (line.startsWith("http") || line.startsWith("/"))) {
      if (currentName) {
        channels.push({
          name: currentName,
          url: line,
          logo: currentLogo,
          group: currentGroup,
        });
      }
      currentName = "";
      currentLogo = undefined;
      currentGroup = undefined;
    }
  }

  return channels;
}