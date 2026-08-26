/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Post, Category, ScreenshotItem } from '../../types';
import { createPost, updatePost, generateSlug } from '../../lib/posts';
import { 
  Save, 
  ArrowLeft, 
  Sparkles, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Link, 
  Tag, 
  FileText, 
  Check, 
  AlertCircle,
  Eye,
  Tv,
  Download
} from 'lucide-react';

interface AdminPostEditorProps {
  post: Post | null; // null for creating new
  categories: Category[];
  onSave: () => void;
  onCancel: () => void;
}

export const AdminPostEditor: React.FC<AdminPostEditorProps> = ({
  post,
  categories,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [description, setDescription] = useState(post?.description || '');
  const [content, setContent] = useState(post?.content || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(post?.thumbnailUrl || '');
  const [categoryId, setCategoryId] = useState(post?.categoryId || (categories[0]?.id || ''));
  const [tagsInput, setTagsInput] = useState(post?.tags?.join(', ') || '');
  const [downloadUrl, setDownloadUrl] = useState(post?.downloadUrl || '');
  const [requiredAds, setRequiredAds] = useState<number>(post?.requiredAds ?? 2);
  const [published, setPublished] = useState<boolean>(post?.published ?? true);
  const [featured, setFeatured] = useState<boolean>(post?.featured ?? false);
  const [publishDate, setPublishDate] = useState(post?.publishDate || new Date().toISOString().split('T')[0]);
  
  // Screenshots state
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>(post?.screenshots || []);
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');
  const [newScreenshotCaption, setNewScreenshotCaption] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto generate slug if creating new
  useEffect(() => {
    if (!post && title && !slug) {
      setSlug(generateSlug(title));
    }
  }, [title, post, slug]);

  const handleAddScreenshot = () => {
    if (!newScreenshotUrl.trim()) return;
    const newItem: ScreenshotItem = {
      id: Date.now().toString(),
      url: newScreenshotUrl.trim(),
      caption: newScreenshotCaption.trim() || '',
      order: screenshots.length + 1
    };
    setScreenshots(prev => [...prev, newItem]);
    setNewScreenshotUrl('');
    setNewScreenshotCaption('');
  };

  const handleRemoveScreenshot = (id: string) => {
    setScreenshots(prev => prev.filter(s => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !downloadUrl.trim()) {
      setError('Please provide at least a post Title and a Download File URL.');
      return;
    }

    const selectedCategory = categories.find(c => c.id === categoryId);
    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const postPayload = {
      title: title.trim(),
      slug: slug.trim() || generateSlug(title),
      description: description.trim(),
      content: content.trim() || '',
      thumbnailUrl: thumbnailUrl.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
      categoryId: categoryId || (categories[0]?.id || 'cat_general'),
      categorySlug: selectedCategory?.slug || 'general',
      categoryName: selectedCategory?.name || 'General',
      tags: parsedTags,
      downloadUrl: downloadUrl.trim(),
      requiredAds: Number(requiredAds) || 0,
      screenshots: screenshots.map(s => ({
        id: s.id,
        url: s.url,
        order: s.order,
        caption: s.caption || ''
      })),
      published: Boolean(published),
      publishDate: publishDate || new Date().toISOString().split('T')[0],
      featured: Boolean(featured)
    };

    setSaving(true);
    setError(null);

    try {
      if (post) {
        await updatePost(post.id, postPayload);
      } else {
        await createPost(postPayload);
      }
      onSave();
    } catch (err: any) {
      console.error('Failed to save post:', err);
      setError(err.message || 'Error saving post to Firestore.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          id="editor-back-btn"
          type="button"
          onClick={onCancel}
          className="py-2 px-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel & Back</span>
        </button>

        <h2 className="text-lg font-bold text-slate-100">
          {post ? `Editing Post: ${post.title}` : 'Create New Dynamic Post'}
        </h2>

        <button
          id="editor-save-btn"
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{post ? 'Update Post' : 'Publish Post'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Fields Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider text-xs text-indigo-400">
            Primary Metadata
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Post Title *</label>
              <input
                id="post-title-input"
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. NeuralStudio Pro 2026 - AI Audio Enhancer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SEO URL Slug *</label>
              <div className="flex gap-2">
                <input
                  id="post-slug-input"
                  type="text"
                  required
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="neuralstudio-pro-2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setSlug(generateSlug(title))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
                >
                  Generate
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
              <select
                id="post-category-select"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Short Description *</label>
              <textarea
                id="post-description-input"
                required
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief summary displayed on homepage cards..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Main Thumbnail Image URL</label>
              <input
                id="post-thumbnail-input"
                type="url"
                value={thumbnailUrl}
                onChange={e => setThumbnailUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Content & Instructions (Markdown)</label>
              <textarea
                id="post-content-input"
                rows={5}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Full markdown article, installation steps, system requirements..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (Comma Separated)</label>
              <input
                id="post-tags-input"
                type="text"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="android, tool, premium, 4k"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Publish Date</label>
              <input
                id="post-date-input"
                type="date"
                value={publishDate}
                onChange={e => setPublishDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Download & Ad Reward Configuration */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider text-xs text-indigo-400 flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Download & Monetization Rules</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Download File URL *</label>
              <input
                id="post-download-url-input"
                type="url"
                required
                value={downloadUrl}
                onChange={e => setDownloadUrl(e.target.value)}
                placeholder="https://example.com/downloads/app-v1.0.zip"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                The direct or temporary file link provided after user finishes the required ad steps.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Required Rewarded Ads Count ({requiredAds})
              </label>
              <select
                id="post-required-ads-select"
                value={requiredAds}
                onChange={e => setRequiredAds(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              >
                <option value={0}>0 Ads (Instant Direct Download)</option>
                <option value={1}>1 Rewarded Ad Step</option>
                <option value={2}>2 Rewarded Ad Steps</option>
                <option value={3}>3 Rewarded Ad Steps</option>
                <option value={4}>4 Rewarded Ad Steps</option>
                <option value={5}>5 Rewarded Ad Steps</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Users must complete exactly this many rewarded ads before downloading.
              </p>
            </div>

            <div className="flex items-center gap-6 pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="post-published-checkbox"
                  type="checkbox"
                  checked={published}
                  onChange={e => setPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
                />
                <span className="text-xs font-semibold text-slate-200">Published Live</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="post-featured-checkbox"
                  type="checkbox"
                  checked={featured}
                  onChange={e => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
                />
                <span className="text-xs font-semibold text-slate-200">Featured Badge</span>
              </label>
            </div>
          </div>
        </div>

        {/* Screenshots Manager */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider text-xs text-indigo-400 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span>Screenshots Gallery ({screenshots.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              id="new-screenshot-url"
              type="url"
              value={newScreenshotUrl}
              onChange={e => setNewScreenshotUrl(e.target.value)}
              placeholder="Screenshot Image URL"
              className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
            <input
              id="new-screenshot-caption"
              type="text"
              value={newScreenshotCaption}
              onChange={e => setNewScreenshotCaption(e.target.value)}
              placeholder="Caption (Optional)"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>
          <button
            id="add-screenshot-btn"
            type="button"
            onClick={handleAddScreenshot}
            className="py-1.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Screenshot</span>
          </button>

          {screenshots.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {screenshots.map((s, idx) => (
                <div key={s.id || idx} className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden group">
                  <img src={s.url} alt={s.caption || 'Screenshot'} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveScreenshot(s.id)}
                    className="absolute top-1 right-1 p-1 rounded-md bg-rose-600/80 hover:bg-rose-600 text-white shadow"
                    title="Remove Screenshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {s.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 p-1 text-[10px] text-slate-300 truncate text-center">
                      {s.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
