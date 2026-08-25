/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Post, Category } from '../types';
import { appCache } from './cache';

const POSTS_COLLECTION = 'posts';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface PaginatedPostsResult {
  posts: Post[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Fetch published posts with cursor pagination and optional category filter
 */
export async function getPublishedPosts(
  pageSize: number = 10,
  categorySlug?: string,
  lastDocSnap: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<PaginatedPostsResult> {
  const cacheKey = !lastDocSnap && !categorySlug ? 'homepage_posts_page_1' : null;
  if (cacheKey) {
    const cached = appCache.get<PaginatedPostsResult>(cacheKey);
    if (cached) return cached;
  }

  try {
    let constraints: any[] = [
      where('published', '==', true),
      orderBy('createdAt', 'desc')
    ];

    if (categorySlug && categorySlug !== 'all') {
      constraints = [
        where('published', '==', true),
        where('categorySlug', '==', categorySlug),
        orderBy('createdAt', 'desc')
      ];
    }

    if (lastDocSnap) {
      constraints.push(startAfter(lastDocSnap));
    }

    constraints.push(limit(pageSize));

    const q = query(collection(db, POSTS_COLLECTION), ...constraints);
    const snap = await getDocs(q);

    const posts: Post[] = [];
    snap.forEach((docSnap) => {
      posts.push({ id: docSnap.id, ...docSnap.data() } as Post);
    });

    const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    const hasMore = snap.docs.length === pageSize;

    const result: PaginatedPostsResult = {
      posts,
      lastVisible,
      hasMore
    };

    if (cacheKey) {
      appCache.set(cacheKey, result, CACHE_TTL);
    }

    return result;
  } catch (err) {
    console.error('Error fetching published posts with query:', err);
    // Fallback: If composite index is pending, fallback gracefully
    try {
      const q = query(
        collection(db, POSTS_COLLECTION),
        where('published', '==', true),
        limit(pageSize)
      );
      const snap = await getDocs(q);
      const posts: Post[] = [];
      snap.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as Post;
        if (!categorySlug || categorySlug === 'all' || data.categorySlug === categorySlug) {
          posts.push(data);
        }
      });
      posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return {
        posts: posts.slice(0, pageSize),
        lastVisible: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
        hasMore: false
      };
    } catch (fallbackErr) {
      console.error('Fallback query error:', fallbackErr);
      return { posts: [], lastVisible: null, hasMore: false };
    }
  }
}

/**
 * Fetch a single post by slug (cached for public visits)
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const cacheKey = `post_slug_${slug}`;
  const cached = appCache.get<Post>(cacheKey);
  if (cached) return cached;

  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('slug', '==', slug),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    const post = { id: docSnap.id, ...docSnap.data() } as Post;

    appCache.set(cacheKey, post, CACHE_TTL);
    return post;
  } catch (err) {
    console.error(`Error fetching post by slug (${slug}):`, err);
    return null;
  }
}

/**
 * Search posts by query string (searches title, category, tags)
 */
export async function searchPosts(searchTerm: string, limitCount: number = 20): Promise<Post[]> {
  if (!searchTerm || !searchTerm.trim()) return [];
  const term = searchTerm.toLowerCase().trim();

  try {
    // Fetch recent published posts and filter client-side / cache
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('published', '==', true),
      limit(50)
    );
    const snap = await getDocs(q);
    const matched: Post[] = [];

    snap.forEach((docSnap) => {
      const p = { id: docSnap.id, ...docSnap.data() } as Post;
      const titleMatch = p.title?.toLowerCase().includes(term);
      const descMatch = p.description?.toLowerCase().includes(term);
      const catMatch = p.categoryName?.toLowerCase().includes(term);
      const tagMatch = p.tags?.some(t => t.toLowerCase().includes(term));

      if (titleMatch || descMatch || catMatch || tagMatch) {
        matched.push(p);
      }
    });

    return matched.slice(0, limitCount);
  } catch (err) {
    console.error('Error searching posts:', err);
    return [];
  }
}

/**
 * Fetch all posts for Admin
 */
export async function getAllPostsForAdmin(): Promise<Post[]> {
  try {
    const q = query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const posts: Post[] = [];
    snap.forEach((docSnap) => {
      posts.push({ id: docSnap.id, ...docSnap.data() } as Post);
    });
    return posts;
  } catch (err) {
    console.error('Error fetching admin posts:', err);
    // Fallback without orderBy
    try {
      const snap = await getDocs(collection(db, POSTS_COLLECTION));
      const posts: Post[] = [];
      snap.forEach((docSnap) => {
        posts.push({ id: docSnap.id, ...docSnap.data() } as Post);
      });
      posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return posts;
    } catch (e) {
      return [];
    }
  }
}

/**
 * Create a new Post
 */
export async function createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes'>): Promise<Post> {
  const newRef = doc(collection(db, POSTS_COLLECTION));
  const newPost: Post = {
    ...postData,
    id: newRef.id,
    views: 0,
    likes: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(newRef, {
    ...newPost,
    serverCreatedAt: serverTimestamp(),
    serverUpdatedAt: serverTimestamp()
  });

  // Invalidate cache
  appCache.invalidatePrefix('post_slug_');
  appCache.invalidate('homepage_posts_page_1');
  return newPost;
}

/**
 * Update an existing Post
 */
export async function updatePost(id: string, updates: Partial<Post>): Promise<void> {
  const postRef = doc(db, POSTS_COLLECTION, id);
  await updateDoc(postRef, {
    ...updates,
    updatedAt: Date.now(),
    serverUpdatedAt: serverTimestamp()
  });

  // Invalidate cache
  if (updates.slug) {
    appCache.invalidate(`post_slug_${updates.slug}`);
  }
  appCache.invalidatePrefix('post_slug_');
  appCache.invalidate('homepage_posts_page_1');
}

/**
 * Delete a Post
 */
export async function deletePost(id: string, slug?: string): Promise<void> {
  const postRef = doc(db, POSTS_COLLECTION, id);
  await deleteDoc(postRef);

  if (slug) {
    appCache.invalidate(`post_slug_${slug}`);
  }
  appCache.invalidatePrefix('post_slug_');
  appCache.invalidate('homepage_posts_page_1');
}

/**
 * Helper to generate SEO URL slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Seed initial categories, sample posts, and ad units for testing
 */
export async function seedInitialSampleData(): Promise<{ categoriesCount: number; postsCount: number; adsCount: number }> {
  // 1. Initial Categories
  const defaultCategories = [
    { name: 'Android Apps', slug: 'android-apps', order: 1, enabled: true, icon: 'Smartphone' },
    { name: 'PC Software', slug: 'pc-software', order: 2, enabled: true, icon: 'Monitor' },
    { name: 'AI & Machine Learning', slug: 'ai-tools', order: 3, enabled: true, icon: 'Sparkles' },
    { name: 'Games & Emulators', slug: 'games', order: 4, enabled: true, icon: 'Gamepad2' },
    { name: 'Graphic Assets', slug: 'design-assets', order: 5, enabled: true, icon: 'Palette' },
    { name: 'Developer Tools', slug: 'developer-tools', order: 6, enabled: true, icon: 'Code' }
  ];

  const categoryMap = new Map<string, Category>();

  for (const cat of defaultCategories) {
    const existingQ = query(collection(db, 'categories'), where('slug', '==', cat.slug));
    const snap = await getDocs(existingQ);
    if (snap.empty) {
      const docRef = doc(collection(db, 'categories'));
      const catObj: Category = {
        id: docRef.id,
        name: cat.name,
        slug: cat.slug,
        order: cat.order,
        enabled: cat.enabled,
        icon: cat.icon,
        postCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(docRef, catObj);
      categoryMap.set(cat.slug, catObj);
    } else {
      categoryMap.set(cat.slug, { id: snap.docs[0].id, ...snap.docs[0].data() } as Category);
    }
  }

  // 2. Initial Sample Posts
  const samplePosts = [
    {
      title: 'NeuralStudio Pro 2026 - AI Audio & Video Enhancer',
      slug: 'neuralstudio-pro-2026',
      description: 'Next-generation AI-driven video upscaler and crystal-clear audio vocal isolator with real-time neural processing filters.',
      content: `### About NeuralStudio Pro
NeuralStudio Pro 2026 is a powerhouse suite engineered for modern media creators, podcasters, and filmmakers. It utilizes advanced GPU neural acceleration to achieve ultra-sharp 4K upscaling, motion vector stabilization, and studio-grade audio noise reduction.

#### Key Features:
- **Neural Video Upscaling**: Enhance standard 1080p footage up to 4K 60FPS with zero halo artifacts.
- **Vocal Isolation & De-Reverb**: Extract pristine acapella stems or strip background noise instantly.
- **Batch Processing**: Queue hundreds of audio/video files with automated preset rendering.
- **Hardware Acceleration**: Full support for RTX, Apple Silicon, and Intel Arc hardware encoders.

#### Installation Instructions:
1. Download the installer archive using the unlocked button below.
2. Extract the package using 7-Zip or WinRAR.
3. Run \`Setup.exe\` with administrator privileges and complete the step-by-step wizard.`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
      categorySlug: 'ai-tools',
      tags: ['ai', 'video-editor', 'audio', 'productivity'],
      downloadUrl: 'https://github.com/google-deepmind/materials/releases/download/v1.0.0/NeuralStudio-Pro-v2.6.zip',
      requiredAds: 3,
      screenshots: [
        { id: '1', url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=80', order: 1, caption: 'Neural audio workspace & multi-track timeline' },
        { id: '2', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80', order: 2, caption: 'Hardware neural GPU acceleration settings' },
        { id: '3', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80', order: 3, caption: 'Batch processing export monitor' }
      ],
      published: true,
      publishDate: '2026-08-25',
      views: 1420,
      likes: 89,
      featured: true
    },
    {
      title: 'RetroArcade Ultimate Edition for Android (APK)',
      slug: 'retroarcade-ultimate-android-apk',
      description: 'The smoothest retro console emulator for Android smartphones with Bluetooth game controller support and cloud save sync.',
      content: `### Experience Classic Games on Android
RetroArcade Ultimate delivers full speed emulation for 16-bit and 32-bit consoles with custom shaders, fast-forward capability, and zero latency touch controls.

#### Features:
- Universal game save state management with Google Drive sync.
- 4K CRT and scanline visual filters.
- Seamless multiplayer over local Wi-Fi.`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
      categorySlug: 'android-apps',
      tags: ['android', 'apk', 'emulator', 'gaming'],
      downloadUrl: 'https://raw.githubusercontent.com/example/files/master/RetroArcade-v4.2.apk',
      requiredAds: 2,
      screenshots: [
        { id: '1', url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1000&q=80', order: 1, caption: 'In-game CRT shader showcase' },
        { id: '2', url: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=1000&q=80', order: 2, caption: 'Touch controller layout customization' }
      ],
      published: true,
      publishDate: '2026-08-24',
      views: 2890,
      likes: 215,
      featured: true
    },
    {
      title: 'DevForge Terminal IDE & Docker Orchestrator',
      slug: 'devforge-terminal-ide',
      description: 'Lightning-fast lightweight terminal IDE with AI code assistant, Git branch visualizer, and container sandbox preview.',
      content: `### Modern Developer Terminal
DevForge combines the raw speed of a terminal editor with the smart refactoring capabilities of modern IDEs.`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80',
      categorySlug: 'developer-tools',
      tags: ['developer', 'terminal', 'docker', 'ide'],
      downloadUrl: 'https://github.com/example/devforge/releases/download/v3.0.1/devforge-cli.tar.gz',
      requiredAds: 1,
      screenshots: [
        { id: '1', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1000&q=80', order: 1, caption: 'Integrated Docker container dashboard' }
      ],
      published: true,
      publishDate: '2026-08-23',
      views: 940,
      likes: 64,
      featured: false
    },
    {
      title: 'CyberVapor 3D Asset Pack & Vector Shaders',
      slug: 'cybervapor-3d-assets-shaders',
      description: 'Over 250 high-poly cyberpunk and futuristic UI vector 3D models with pre-baked 8K textures for Blender and Unreal Engine 5.',
      content: `### High-Fidelity 3D Assets
Ready-to-use props, glowing neon signs, cybernetic vehicles, and architectural modules.`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1000&q=80',
      categorySlug: 'design-assets',
      tags: ['3d-models', 'blender', 'unreal-engine', 'textures'],
      downloadUrl: 'https://example.com/assets/CyberVapor-Assets-v1.zip',
      requiredAds: 0, // Instant download without ads!
      screenshots: [
        { id: '1', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80', order: 1, caption: 'Neon city architectural set' }
      ],
      published: true,
      publishDate: '2026-08-22',
      views: 3120,
      likes: 310,
      featured: true
    }
  ];

  let postsAdded = 0;

  for (const post of samplePosts) {
    const existingQ = query(collection(db, 'posts'), where('slug', '==', post.slug));
    const snap = await getDocs(existingQ);
    if (snap.empty) {
      const cat = categoryMap.get(post.categorySlug);
      const postRef = doc(collection(db, 'posts'));
      await setDoc(postRef, {
        id: postRef.id,
        title: post.title,
        slug: post.slug,
        description: post.description,
        content: post.content,
        thumbnailUrl: post.thumbnailUrl,
        categoryId: cat ? cat.id : 'cat_general',
        categorySlug: post.categorySlug,
        categoryName: cat ? cat.name : 'General',
        tags: post.tags,
        downloadUrl: post.downloadUrl,
        requiredAds: post.requiredAds,
        screenshots: post.screenshots,
        published: post.published,
        publishDate: post.publishDate,
        views: post.views,
        likes: post.likes,
        featured: post.featured,
        createdAt: Date.now() - Math.floor(Math.random() * 5 * 86400000),
        updatedAt: Date.now()
      });
      postsAdded++;
    }
  }

  // 3. Initial Adsterra / Monetag Ad Units
  const defaultAds = [
    {
      title: 'Homepage Top Banner (728x90 / Responsive)',
      provider: 'adsterra' as const,
      placement: 'homepage_top' as const,
      code: '<div style="background: linear-gradient(135deg, #1e1b4b, #0f172a); border: 1px dashed #6366f1; border-radius: 12px; padding: 16px; text-align: center; color: #a5b4fc; font-size: 13px; font-weight: 600;">⚡ Sponsored Banner • Adsterra Placement Slot (728x90 Native Display)</div>',
      active: true,
      frequency: 1
    },
    {
      title: 'Between Posts Native Stream',
      provider: 'adsterra' as const,
      placement: 'homepage_between' as const,
      code: '<div style="background: rgba(30, 27, 75, 0.5); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 16px; padding: 20px; text-align: center; color: #c7d2fe; font-size: 13px;">🎁 Sponsored Promotion • Premium Tool of the Week</div>',
      active: true,
      frequency: 3
    },
    {
      title: 'Post Details Top Ad',
      provider: 'adsterra' as const,
      placement: 'post_top' as const,
      code: '<div style="background: #0f172a; border: 1px dashed #475569; border-radius: 12px; padding: 14px; text-align: center; color: #94a3b8; font-size: 12px;">Advertisement • High Speed Cloud Hosting Deals</div>',
      active: true,
      frequency: 1
    }
  ];

  let adsAdded = 0;
  for (const ad of defaultAds) {
    const existingQ = query(collection(db, 'ads'), where('title', '==', ad.title));
    const snap = await getDocs(existingQ);
    if (snap.empty) {
      const adRef = doc(collection(db, 'ads'));
      await setDoc(adRef, {
        id: adRef.id,
        ...ad,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      adsAdded++;
    }
  }

  appCache.clear();
  return { categoriesCount: defaultCategories.length, postsCount: postsAdded, adsCount: adsAdded };
}
