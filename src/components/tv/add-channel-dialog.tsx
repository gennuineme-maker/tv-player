"use client";

import { useState } from "react";
import { useTvStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AddChannelDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Entertainment");
  const [loading, setLoading] = useState(false);

  const addChannel = useTvStore((s) => s.addChannel);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    // Validate URL
    if (!url.startsWith("http")) {
      toast.error("Invalid URL. Must start with http:// or https://");
      return;
    }

    setLoading(true);
    try {
      addChannel({ name: name.trim(), url: url.trim(), category: category.trim() || "Entertainment" });
      toast.success(`"${name.trim()}" added!`);
      setName("");
      setUrl("");
      setCategory("Entertainment");
      setOpen(false);
    } catch {
      toast.error("Failed to add channel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-1.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-xs h-8 px-3 shadow-lg shadow-orange-500/20"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Add Channel</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Plus size={16} className="text-white" />
            </div>
            Add New Channel
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-white/70 text-sm">Channel Name</Label>
            <Input
              placeholder="e.g. Kantipur HD"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-orange-500/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70 text-sm">M3U8 Stream URL</Label>
            <Input
              placeholder="https://example.com/stream.m3u8"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-orange-500/50 font-mono text-xs"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70 text-sm">Category</Label>
            <Input
              placeholder="e.g. News, Sports, Entertainment"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-orange-500/50"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white hover:bg-white/10 flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || !url.trim()}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Add Channel"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}