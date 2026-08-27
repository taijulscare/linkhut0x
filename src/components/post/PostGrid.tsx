/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Post, AdUnit } from '../../types';
import { PostCard } from './PostCard';
import { AdSlot } from '../common/AdSlot';

interface PostGridProps {
  posts: Post[];
  adUnits: AdUnit[];
  adFrequency?: number;
  onSelectPost: (slug: string) => void;
}

export const PostGrid: React.FC<PostGridProps> = ({
  posts,
  adUnits,
  adFrequency = 4,
  onSelectPost
}) => {
  if (posts.length === 0) {
    return (
      <div className="py-16 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-8">
        <p className="text-slate-400 text-sm font-medium">
          No published posts found in this category.
        </p>
      </div>
    );
  }

  // Interleave ads between posts based on frequency
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post, index) => {
          const showAdAfter = adFrequency > 0 && (index + 1) % adFrequency === 0 && index !== posts.length - 1;

          return (
            <React.Fragment key={post.id}>
              <PostCard post={post} onClick={() => onSelectPost(post.slug)} />

              {/* Interleaved Adsterra Between-Post Banner */}
              {showAdAfter && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 my-2">
                  <AdSlot placement="homepage_between" adUnits={adUnits} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
