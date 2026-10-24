import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '@/config/site';
import { getContent } from '@/lib/content/load';
import { latestPosts } from '@/lib/content/navigation';

export async function GET(context: APIContext) {
  const { library } = await getContent();
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? '',
    items: latestPosts(library, library.posts.size).map((post) => ({
      title: post.title,
      description: post.summary,
      pubDate: post.date,
      link: post.url,
    })),
  });
}
