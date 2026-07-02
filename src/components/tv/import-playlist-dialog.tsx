"use client";

import { useState, useRef, useCallback } from "react";
import { useTvStore } from "@/lib/store";
import { parseM3U } from "@/lib/channels";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ImportPlaylistDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ name: string; url: string; group?: string }[] | null>(null);
  const [step, setStep] = useState<"input" | "preview">("input");
  const fileRef = useRef<HTMLInputElement>(null);

  const importChannels = useTvStore((s) => s.importChannels);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setContent(text);
      const parsed = parseM3U(text);
      if (parsed.length > 0) {
        setPreview(parsed);
        setStep("preview");
        toast.success(`Found ${parsed.length} channels in file`);
      } else {
        toast.error("No valid channels found in the file");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleUrlFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(url.trim());
      const text = await res.text();
      setContent(text);
      const parsed = parseM3U(text);
      if (parsed.length > 0) {
        setPreview(parsed);
        setStep("preview");
        toast.success(`Found ${parsed.length} channels`);
      } else {
        toast.error("No valid channels found. Make sure it's a valid M3U playlist.");
      }
    } catch {
      toast.error("Failed to fetch playlist. Check the URL and try CORS-free sources.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = () => {
    if (!content.trim()) return;
    const parsed = parseM3U(content);
    if (parsed.length > 0) {
      setPreview(parsed);
      setStep("preview");
      toast.success(`Found ${parsed.length} channels`);
    } else {
      toast.error("No valid channels found. Paste a valid M3U playlist.");
    }
  };

  const handleImport = () => {
    if (!preview) return;
    const toImport = preview.map((ch) => ({
      name: ch.name,
      url: ch.url,
      category: ch.group || "Imported",
      logo: undefined,
    }));
    importChannels(toImport);
    toast.success(`${toImport.length} channels imported successfully!`);
    setOpen(false);
    reset();
  };

  const reset = () => {
    setContent("");
    setUrl("");
    setPreview(null);
    setStep("input");
  };

  const handleClose = (val: boolean) => {
    setOpen(val);
    if (!val) reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs h-8 px-3"
        >
          <Upload size={14} />
          <span className="hidden sm:inline">Import M3U</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-zinc-900 border-white/10 text-white max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Upload size={16} className="text-white" />
            </div>
            Import M3U Playlist
          </DialogTitle>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4 mt-2 flex-1 overflow-y-auto">
            {/* File upload */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/10 hover:border-white/25 rounded-xl p-6 text-center cursor-pointer transition-colors group"
            >
              <FileText
                size={32}
                className="mx-auto text-white/20 group-hover:text-white/40 transition-colors mb-2"
              />
              <p className="text-white/50 text-sm">Click to upload .m3u file</p>
              <p className="text-white/25 text-xs mt-1">
                Supports M3U / M3U8 playlist files
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".m3u,.m3u8,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/20 text-xs">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* URL fetch */}
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Playlist URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/playlist.m3u"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500/50 font-mono text-xs flex-1"
                />
                <Button
                  onClick={handleUrlFetch}
                  disabled={loading || !url.trim()}
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : "Fetch"}
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/20 text-xs">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Paste content */}
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Paste M3U Content</Label>
              <Textarea
                placeholder="#EXTM3U&#10;#EXTINF:-1,Kantipur HD&#10;https://example.com/kantipur.m3u8&#10;..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-violet-500/50 font-mono text-xs resize-none"
              />
              <Button
                onClick={handlePaste}
                disabled={!content.trim()}
                variant="outline"
                className="w-full border-white/10 text-white/70 hover:text-white hover:bg-white/10"
              >
                Parse Playlist
              </Button>
            </div>
          </div>
        ) : (
          /* Preview step */
          <div className="mt-2 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-400" />
                <span className="text-white/70 text-sm font-medium">
                  {preview?.length} channels found
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("input")}
                className="text-white/40 hover:text-white text-xs h-7"
              >
                Back
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-lg border border-white/10 bg-black/30 max-h-64">
              {preview?.map((ch, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 border-b border-white/5 last:border-0"
                >
                  <span className="text-white/20 text-xs font-mono w-6 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm truncate">{ch.name}</p>
                    {ch.group && (
                      <p className="text-white/30 text-[10px] truncate">
                        {ch.group}
                      </p>
                    )}
                  </div>
                  <AlertCircle
                    size={12}
                    className={
                      ch.url.startsWith("http") ? "text-green-500/50" : "text-yellow-500/50"
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="ghost"
                onClick={() => handleClose(false)}
                className="text-white/60 hover:text-white hover:bg-white/10 flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white"
              >
                Import All ({preview?.length})
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}