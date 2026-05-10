"use client";

import { Button } from '@/components/ui/button';
import { APP_URL } from '@/constants';
import { ListVideo, SearchIcon, XIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useTRPC } from '@/trpc/client';
import { useDebounce } from 'use-debounce';
import { useQuery } from '@tanstack/react-query';   // ← Import this
import { THUMBNAIL_FALLBACK } from '@/modules/videos/constants';
import { UserAvatar } from '@/components/user-avatar';
import { PlaylistVideoThumnail } from '@/modules/playlist/ui/components/playlist-video-thumbnail';

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trpc = useTRPC();

  const [value, setValue] = useState(searchParams.get("query") || "");
  const [debouncedValue] = useDebounce(value, 250);

  const [showSuggestions, setShowSuggestions] = useState(false);

  // ✅ Correct way to fetch suggestions in new tRPC setup
  const suggestionsQuery = useQuery(
    trpc.search.suggestions.queryOptions({
      query: value,
      limit: 8,
    })
  );

  const suggestions = suggestionsQuery.data ?? [];
console.log("Suggestions:", suggestions);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    const url = new URL("/search", APP_URL);
    url.searchParams.set("query", trimmed);
    router.push(url.toString());
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (item: any) => {
 setValue(item.title);
    setShowSuggestions(false);

    if (item.type === 'video') {
      router.push(`/videos/${item.id}`);
    } else if (item.type === 'channel') {
      router.push(`/user/${item.id}`);
    } else if (item.type === 'playlist') {
      router.push(`/playlist/${item.id}`);
    } else {
      // Fallback to search page
      const url = new URL("/search", APP_URL);
      url.searchParams.set("query", item.title);
      router.push(url.toString());
    }
  };

  return (
    <div className="relative w-full max-w-[600px]">
      <form onSubmit={handleSubmit} className="flex">
        <div className="relative flex items-center flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search"
            className="w-full rounded-l-full bg-primary-foreground border text-sm pl-4 py-2  pr-12 focus:outline-none focus:border-blue-500"
          />

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setValue("")}
              className="absolute right-2 top-1/2-translate-y-1/2 rounded-full"
            >
              <XIcon className="size-4" />
            </Button>
          )}
        </div>

        <Button type="submit" variant="secondary" className="rounded-r-full py-5  px-6">
          <SearchIcon className="size-5" />
        </Button>
      </form>

      {/* Suggestions Dropdown */}
     {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-primary-foreground border rounded-xl shadow-xl z-50 max-h-[420px] overflow-auto">
          {suggestions.map((item: any, index: number) => (
            <div
              key={`${item.type}-${item.id}-${index}`}
              onClick={() => handleSuggestionClick(item)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
            >
              {item.type === 'video' && (
                <SearchIcon
                  className="size-5 "
                />
              )}

              {item.type === 'channel' && (
                   <UserAvatar size={"sm"} imageUrl={item.thumbnailUrl  || `https://ui-avatars.com/api/?name=${item.title}&background=random`} name={item.title || 'User'} /> 
              )}

              {item.type === 'playlist' && (
                <PlaylistVideoThumnail videoCount={item.viewCount} className='w-12 h-10' title={item.title} imageUrl={item.thumbnailUrl  || THUMBNAIL_FALLBACK} />
               
              )}

              <div className="flex-1 min-w-0">
                <p className="line-clamp-1 text-sm">{item.title}</p>
                
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}