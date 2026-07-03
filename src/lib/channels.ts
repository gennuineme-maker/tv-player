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

export const sampleChannels: Channel[] = [];


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