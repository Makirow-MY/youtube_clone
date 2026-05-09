'use client';

import { cn } from '@/lib/utils';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import React, { useState } from 'react';

interface VideoDescriptionProps {
  description?: string | null;
  compactViews: string;
  compactDate: string;
  expandedViews: string;
  expandedDate: string;
  /** Pass this from your video player so timestamps actually seek the video */
  onSeek?: (seconds: number) => void;
}

export function VideoDescription({
  description,
  compactViews,
  compactDate,
  expandedViews,
  expandedDate,
  onSeek,
}: VideoDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper: convert "1:23", "12:34:56", etc. → total seconds
  const timestampToSeconds = (timestamp: string): number => {
    const parts = timestamp.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return parts[0] || 0;
  };

  // Full YouTube-style parser: turns plain text into rich React nodes
  const renderParsedDescription = (text: string): React.ReactNode => {
    if (!text) return text;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Regex captures:
    // 1 = full URL (http/https)
    // 2 = www. URL
    // 3 = timestamp (1:23, 12:34, 1:23:45, etc.)
    // 4 = #hashtag
    // 5 = @mention
    const regex =
      /((https?:\/\/[^\s<>"']+)|(www\.[^\s<>"']+)|(\b\d{1,2}(?::\d{2}){1,2}\b)|(#\S+)|(@\S+))/gi;

    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // Text before this match
      const textBefore = text.slice(lastIndex, match.index);
      if (textBefore) {
        // Preserve newlines as <br />
        const lines = textBefore.split('\n');
        lines.forEach((line, i) => {
          if (i > 0) elements.push(<br key={`br-${lastIndex}-${i}`} />);
          if (line.length > 0) elements.push(line);
        });
      }

      const fullMatch = match[0];

      if (match[1] || match[2]) {
        // URL
        const href = match[2] ? `https://${fullMatch}` : fullMatch;
        elements.push(
          <a
            key={`url-${match.index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline break-all"
          >
            {fullMatch}
          </a>
        );
      } else if (match[3]) {
        // TIMESTAMP
        const seconds = timestampToSeconds(fullMatch);
        elements.push(
          <span
            key={`ts-${match.index}`}
            className={cn(
              'text-blue-500 hover:underline',
              onSeek && 'cursor-pointer'
            )}
            onClick={(e) => {
              e.stopPropagation(); // prevent triggering expand
              onSeek?.(seconds);
            }}
          >
            {fullMatch}
          </span>
        );
      } else if (match[4]) {
        // HASHTAG
        elements.push(
          <a
            key={`tag-${match.index}`}
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
              fullMatch
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {fullMatch}
          </a>
        );
      } else if (match[5]) {
        // MENTION
        elements.push(
          <a
            key={`mention-${match.index}`}
            href={`https://www.youtube.com/${fullMatch}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {fullMatch}
          </a>
        );
      }

      lastIndex = regex.lastIndex;
    }

    // Remaining text after last match
    const remaining = text.slice(lastIndex);
    if (remaining) {
      const lines = remaining.split('\n');
      lines.forEach((line, i) => {
        if (i > 0) elements.push(<br key={`br-end-${i}`} />);
        if (line.length > 0) elements.push(line);
      });
    }

    return elements;
  };

  return (
    <div className="bg-secondary p-4 rounded-xl hover:bg-secondary/70 transition-colors">
      {/* Views & Date (YouTube style) */}
      <div className="flex gap-2 text-sm mb-3">
        <span className="font-semibold">
          {isExpanded ? expandedViews : compactViews} views
        </span>
        <span className="font-semibold">
          {isExpanded ? expandedDate : compactDate}
        </span>
      </div>

      {/* Parsed Description */}
      <div className="relative">
        <p
          className={cn(
            'text-sm leading-relaxed whitespace-pre-wrap break-words',
            !isExpanded && 'line-clamp-2'
          )}
        >
          {description
            ? renderParsedDescription(description)
            : 'No description available'}
        </p>

        {/* Show more / Show less (only this toggles) */}
        {description && (
          <div
            onClick={() => setIsExpanded((prev) => !prev)}
            className="mt-3 flex items-center gap-1 text-sm font-semibold text-blue-500 hover:text-blue-600 cursor-pointer select-none"
          >
            {isExpanded ? (
              <>
                Show less
                <ChevronUpIcon className="size-4" />
              </>
            ) : (
              <>
                Show more
                <ChevronDownIcon className="size-4" />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}