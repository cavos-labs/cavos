import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR_CANDIDATES = [
  path.join(process.cwd(), 'content/blog'),
  path.join(process.cwd(), 'cavos-web/content/blog'),
];

const BLOG_DIR =
  BLOG_DIR_CANDIDATES.find((dir) => fs.existsSync(dir)) ??
  BLOG_DIR_CANDIDATES[0];

export type PostCategory = 'Release' | 'Security' | 'Deep Dive' | 'Announcement' | 'Guide';

export type PostFaqItem = {
  question: string;
  answer: string;
};

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  excerpt: string;
  category: PostCategory;
  /** Pull quote for the social card. Falls back to the excerpt. */
  ogQuote?: string;
  faq?: PostFaqItem[];
}

export interface Post {
  meta: PostMeta;
  content: string;
}

function parsePostFaq(value: unknown): PostFaqItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter(
    (item): item is PostFaqItem =>
      Boolean(item) &&
      typeof item === 'object' &&
      typeof (item as PostFaqItem).question === 'string' &&
      typeof (item as PostFaqItem).answer === 'string',
  );
  return items.length > 0 ? items : undefined;
}

function postMetaFromData(
  data: Record<string, unknown>,
  fallbackSlug: string,
): PostMeta {
  const updated =
    typeof data.updated === 'string' && data.updated
      ? data.updated
      : typeof data.dateModified === 'string' && data.dateModified
        ? data.dateModified
        : undefined;

  return {
    slug: (typeof data.slug === 'string' && data.slug) || fallbackSlug,
    title: typeof data.title === 'string' ? data.title : '',
    date: typeof data.date === 'string' ? data.date : '',
    ...(updated ? { updated } : {}),
    excerpt: typeof data.excerpt === 'string' ? data.excerpt : '',
    category: (typeof data.category === 'string'
      ? data.category
      : 'Announcement') as PostCategory,
    ...(typeof data.ogQuote === 'string' && data.ogQuote.trim()
      ? { ogQuote: data.ogQuote.trim() }
      : {}),
    faq: parsePostFaq(data.faq),
  };
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'));

  const posts = files.map((filename) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8');
    const { data } = matter(raw);
    return postMetaFromData(data, filename.replace(/\.mdx$/, ''));
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    meta: postMetaFromData(data, slug),
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
  Guide: 'bg-[#402AFF] text-white',
};
