/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ScreenshotItem } from '../../types';
import { X, ChevronLeft, ChevronRight, Maximize2, Image as ImageIcon } from 'lucide-react';

interface ScreenshotLightboxProps {
  screenshots: ScreenshotItem[];
}

export const ScreenshotLightbox: React.FC<ScreenshotLightboxProps> = ({ screenshots }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const sorted = [...screenshots].sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % sorted.length);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + sorted.length) % sorted.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowRight') setSelectedIndex((selectedIndex + 1) % sorted.length);
      if (e.key === 'ArrowLeft') setSelectedIndex((selectedIndex - 1 + sorted.length) % sorted.length);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, sorted.length]);

  if (!sorted || sorted.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
        <ImageIcon className="w-4 h-4 text-indigo-400" />
        <span>Screenshots & Interface Preview ({sorted.length})</span>
      </div>

      {/* Thumbnails Gallery */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sorted.map((item, index) => (
          <div
            key={item.id || index}
            onClick={() => setSelectedIndex(index)}
            className="group relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500/60 cursor-pointer shadow-md transition-all"
          >
            <img
              src={item.url}
              alt={item.caption || `Screenshot ${index + 1}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-lg">
                <Maximize2 className="w-4 h-4" />
              </div>
            </div>
            {item.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur p-1 text-[10px] text-slate-300 truncate text-center">
                {item.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            id="lightbox-close-btn"
            type="button"
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white z-50 transition-all"
            aria-label="Close image lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev button */}
          {sorted.length > 1 && (
            <button
              id="lightbox-prev-btn"
              type="button"
              onClick={handlePrev}
              className="absolute left-4 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white z-50 transition-all"
              aria-label="Previous screenshot"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Current Image Container */}
          <div
            className="max-w-5xl max-h-[85vh] flex flex-col items-center justify-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={sorted[selectedIndex].url}
              alt={sorted[selectedIndex].caption || `Screenshot ${selectedIndex + 1}`}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-slate-800"
            />
            {sorted[selectedIndex].caption && (
              <p className="mt-3 text-xs sm:text-sm text-slate-300 font-medium text-center bg-slate-900/80 backdrop-blur px-4 py-1.5 rounded-full border border-slate-800">
                {sorted[selectedIndex].caption}
              </p>
            )}
            <span className="mt-2 text-[11px] text-slate-500">
              {selectedIndex + 1} of {sorted.length}
            </span>
          </div>

          {/* Next button */}
          {sorted.length > 1 && (
            <button
              id="lightbox-next-btn"
              type="button"
              onClick={handleNext}
              className="absolute right-4 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white z-50 transition-all"
              aria-label="Next screenshot"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
