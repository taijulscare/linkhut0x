/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Post, Category } from '../../types';
import { getAllPostsForAdmin, deletePost, updatePost } from '../../lib/posts';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  ThumbsUp, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Layers, 
  ExternalLink,
  Tv,
  RefreshCw
} from 'lucide-react';

interface AdminPostsManagerProps {
  categories: Category[];
  onCreatePost: () => void;
  onEditPost: (post: Post) => void;
}

export const AdminPostsManager: React.FC<AdminPostsManagerProps> = ({
  categories,
  onCreatePost,
  onEditPost
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getAllPostsForAdmin();
      setPosts(data);
    } catch (err) {
      console.error('Error fetching admin posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleTogglePublish = async (post: Post) => {
    setActionLoadingId(post.id);
    try {
      const newStatus = !post.published;
      await updatePost(post.id, { published: newStatus });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, published: newStatus } : p));
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (post: Post) => {
    if (!window.confirm(`Are you sure you want to delete post "${post.title}"?`)) return;
    setActionLoadingId(post.id);
    try {
      await deletePost(post.id, post.slug);
      setPosts(prev => prev.filter(p => p.id !== post.id));
    } catch (err) {
      console.error('Failed to delete post:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredPosts = posts.filter(p => {
    const matchSearch = searchTerm ? (
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : true;

    const matchCat = filterCategory === 'all' || p.categoryId === filterCategory || p.categorySlug === filterCategory;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'published' ? p.published : !p.published);

    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Posts & Downloads Manager</h2>
          <p className="text-xs text-slate-400">
            Create, publish, edit ad requirements, and organize download catalog.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="refresh-posts-btn"
            type="button"
            onClick={fetchPosts}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="admin-create-post-btn"
            type="button"
            onClick={onCreatePost}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Post</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            id="admin-posts-search"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by title or tags..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            id="admin-posts-category-filter"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            id="admin-posts-status-filter"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="p-4">Post & Thumbnail</th>
                <th className="p-4">Category</th>
                <th className="p-4">Ad Steps</th>
                <th className="p-4">Engagement</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading posts from Firestore...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No posts matched the current filters.
                  </td>
                </tr>
              ) : (
                filteredPosts.map(post => (
                  <tr key={post.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80'}
                          alt={post.title}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                        />
                        <div className="max-w-xs sm:max-w-md">
                          <h4 className="font-bold text-slate-100 line-clamp-1">{post.title}</h4>
                          <span className="text-[11px] text-slate-500 font-mono">/post/{post.slug}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold text-[11px]">
                        {post.categoryName || 'General'}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        post.requiredAds > 0 
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}>
                        {post.requiredAds > 0 ? `${post.requiredAds} Ad(s)` : 'Direct (0)'}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3 text-slate-400">
                        <span className="flex items-center gap-1" title="Views">
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          {(post.views || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1" title="Likes">
                          <ThumbsUp className="w-3.5 h-3.5 text-rose-400" />
                          {(post.likes || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(post)}
                        disabled={actionLoadingId === post.id}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                          post.published
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {post.published ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Live</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-500" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditPost(post)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Edit Post"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(post)}
                          disabled={actionLoadingId === post.id}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
