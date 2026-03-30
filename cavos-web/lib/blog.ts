import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export type PostCategory = 'Release' | 'Security' | 'Deep Dive' | 'Announcement';

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  category: PostCategory;
}

export interface Post {
  meta: PostMeta;
  content: string;
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'));

  const posts = files.map((filename) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8');
    const { data } = matter(raw);
    return {
      slug: data.slug ?? filename.replace(/\.mdx$/, ''),
      title: data.title ?? '',
      date: data.date ?? '',
      excerpt: data.excerpt ?? '',
      category: (data.category ?? 'Announcement') as PostCategory,
    };
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    meta: {
      slug: data.slug ?? slug,
      title: data.title ?? '',
      date: data.date ?? '',
      excerpt: data.excerpt ?? '',
      category: (data.category ?? 'Announcement') as PostCategory,
    },
    content,
  };
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const CATEGORY_COLORS: Record<PostCategory, string> = {
  Release: 'bg-[#E8F2E8] text-[#2D6A2D]',
  Security: 'bg-[#FFF0E8] text-[#A84A00]',
  'Deep Dive': 'bg-[#EAE5DC] text-[#5C4F3A]',
  Announcement: 'bg-[#E8EEF7] text-[#1E3A6B]',
};
