/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Category } from '../../types';
import { 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Gamepad2, 
  Palette, 
  Code, 
  Layers, 
  Grid 
} from 'lucide-react';

interface CategoryBarProps {
  categories: Category[];
  selectedCategorySlug: string;
  onSelectCategory: (slug: string) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategorySlug,
  onSelectCategory
}) => {
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'Monitor':
        return <Monitor className="w-3.5 h-3.5" />;
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-3.5 h-3.5" />;
      case 'Palette':
        return <Palette className="w-3.5 h-3.5" />;
      case 'Code':
        return <Code className="w-3.5 h-3.5" />;
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full border-b border-slate-800/80 bg-slate-900/40 backdrop-blur py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
          {/* "All" Category Pill */}
          <button
            id="cat-pill-all"
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              selectedCategorySlug === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500/50'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>All Posts</span>
          </button>

          {/* Dynamic Categories */}
          {categories.map((cat) => {
            const isSelected = selectedCategorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                id={`cat-pill-${cat.slug}`}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500/50'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60'
                }`}
              >
                {getIcon(cat.icon)}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
