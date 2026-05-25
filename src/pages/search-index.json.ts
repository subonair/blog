import { getCollection } from 'astro:content';

export const prerender = true;

const categoryLabels: Record<string, string> = {
  ai: 'ИИ',
  it: 'IT',
  triatlon: 'Триатлон',
};

const sportLabels: Record<string, string> = {
  aquathlon: 'Акватлон',
  bike: 'Вело',
  duathlon: 'Дуатлон',
  nordic_walking: 'Скандинавская ходьба',
  run: 'Бег',
  swim: 'Плавание',
  swimrun: 'Swimrun',
  triathlon: 'Триатлон',
};

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[#>*_~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET() {
  const [posts, events] = await Promise.all([getCollection('blog'), getCollection('events')]);

  const postItems = posts.map((post) => {
    const category = post.data.category;
    const url = `/${post.id.replace(/\.md$/, '')}/`;

    return {
      type: 'post',
      scope: category,
      title: post.data.title,
      description: post.data.description,
      category,
      categoryLabel: categoryLabels[category] ?? category,
      date: post.data.date.toISOString(),
      url,
      text: stripMarkdown(`${post.data.title} ${post.data.description} ${post.body ?? ''}`),
    };
  });

  const eventItems = events.map((event) => {
    const sportType = event.data.sportType;
    const distances = [
      event.data.distances.swim ? `плавание ${event.data.distances.swim} м` : '',
      event.data.distances.bike ? `вело ${event.data.distances.bike} км` : '',
      event.data.distances.run ? `бег ${event.data.distances.run} км` : '',
    ]
      .filter(Boolean)
      .join(', ');

    return {
      type: 'event',
      scope: 'events',
      title: event.data.title,
      description: [event.data.city, sportLabels[sportType], event.data.distanceLabel, distances]
        .filter(Boolean)
        .join(' · '),
      category: sportType,
      categoryLabel: sportLabels[sportType] ?? sportType,
      date: event.data.date.toISOString(),
      url: `/events/?type=${encodeURIComponent(sportType)}`,
      text: stripMarkdown(
        `${event.data.title} ${event.data.city} ${sportLabels[sportType] ?? sportType} ${event.data.distanceLabel} ${distances} ${event.body ?? ''}`,
      ),
    };
  });

  return new Response(JSON.stringify([...postItems, ...eventItems]), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
