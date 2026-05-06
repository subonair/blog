#!/usr/bin/env python3
"""Парсер событий iron-star.com/event/ → .md файлы в src/content/events/"""

import re, os, sys
from datetime import datetime

import requests
from bs4 import BeautifulSoup

def parse_event_text(text: str) -> dict | None:
    """Парсит строку карточки события в структуру (пошаговый разбор)."""
    text = text.strip()

    # 1. Находим дату — разделитель между названием и остальным
    date_pattern = re.compile(r'\d{2}\.\d{2}\.\d{4}')
    date_m = date_pattern.search(text)
    if not date_m:
        print(f'  SKIP (no date): {text[:80]}', file=sys.stderr)
        return None

    name = text[:date_m.start()].strip()
    date = datetime.strptime(date_m.group(), '%d.%m.%Y')
    after_date = text[date_m.end():].strip()

    # 2. Ищем статус
    status_map = {
        'осталось мало слотов': 'low',
        'продано': 'sold_out',
        'лист ожидания': 'waitlist',
    }
    status_keywords = list(status_map.keys())
    status_pattern = re.compile('|'.join(re.escape(k) for k in status_keywords), re.IGNORECASE)

    status = 'open'
    status_m = status_pattern.search(after_date)

    if status_m:
        # Всё до статуса: "ГОРОД НАЗВАНИЕ"
        before_status = after_date[:status_m.start()].strip()
        # Всё после статуса: дистанции
        distances_str = after_date[status_m.end():].strip()
        status = status_map[status_m.group().lower()]
    else:
        # Нет статуса — after_date = "ГОРОД НАЗВАНИЕ ДИСТАНЦИИ"
        before_status = after_date
        distances_str = ''

    # 3. Отделяем город: «before_status» кончается на название события
    # Находим последнее вхождение названия
    name_pos = before_status.rfind(name)
    if name_pos >= 0:
        city = before_status[:name_pos].strip()
        # Убираем название + возможные повторы дистанций (если нет статуса)
        rest = before_status[name_pos + len(name):].strip()
        if rest and not distances_str:
            # rest = возможные дистанции
            distances_str = rest
    else:
        # Название не нашлось (редкий случай, например разный регистр)
        # Берём первое слово после даты как город
        parts = before_status.split()
        city = parts[0] if parts else before_status

    # 4. Парсим дистанции
    dist_re = re.compile(r'([\d,]+)\s*км')
    if not distances_str:
        # Ищем дистанции во всей строке после даты (fallback)
        distances_str = after_date
    distances = [float(d.replace(',', '.')) for d in dist_re.findall(distances_str)]

    if not distances:
        print(f'  SKIP (no distances): {text[:80]}', file=sys.stderr)
        return None

    # 5. Определяем sportType по количеству и порядку дистанций + названию
    name_upper = name.upper()
    if len(distances) == 1:
        if any(kw in name_upper for kw in ['SWIM', 'ПЛАВ']):
            sport_type = 'swim'
            mapped = {'swim': distances[0]}
        else:
            sport_type = 'run'
            mapped = {'run': distances[0]}
    elif len(distances) == 2:
        if 'SWIMRUN' in name_upper or 'СВИМРАН' in name_upper:
            sport_type = 'swimrun'
            mapped = {'swim': distances[0], 'run': distances[1]}
        elif 'AQUATHLON' in name_upper or 'АКВАТЛОН' in name_upper:
            sport_type = 'aquathlon'
            mapped = {'swim': distances[0], 'run': distances[1]}
        else:
            sport_type = 'aquathlon'
            mapped = {'swim': distances[0], 'run': distances[1]}
    elif len(distances) == 3:
        sport_type = 'triathlon'
        mapped = {'swim': distances[0], 'bike': distances[1], 'run': distances[2]}
    else:
        print(f'  SKIP: unexpected distance count {len(distances)}: {text[:80]}', file=sys.stderr)
        return None

    return {
        'title': name,
        'date': date,
        'city': city,
        'sportType': sport_type,
        'status': status,
        'distances': mapped,
    }


def fetch_events() -> list[str]:
    """Получает список текстов карточек событий с iron-star.com/event/"""
    url = 'https://iron-star.com/event/'
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; PlanExBot/1.0; +https://dimino.me)',
    }
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, 'html.parser')

    # Ищем ссылки, содержащие дату в тексте
    date_pattern = re.compile(r'\d{2}\.\d{2}\.\d{4}')

    events = []
    seen = set()
    for a in soup.find_all('a', href=True):
        text = a.get_text(separator=' ', strip=True)
        if not text:
            continue
        # Пропускаем кнопки и системные ссылки
        if text.lower() in ('регистрация', 'подробнее', 'лист ожидания', 'eng', 'rus',
                            'фильтр соревнований', 'личный кабинет', 'архив результатов',
                            'помощь', 'подписаться на рассылку'):
            continue
        # Пропускаем дубликаты
        if text in seen:
            continue
        # Проверяем, что текст содержит дату и "км"
        if date_pattern.search(text) and 'км' in text.lower():
            seen.add(text)
            events.append(text)

    return events


def slugify(title: str, date: datetime) -> str:
    """Генерирует slug для имени файла."""
    name_slug = re.sub(r'[^a-zа-яё0-9]+', '-', title.lower()).strip('-')
    date_slug = date.strftime('%Y-%m-%d')
    return f'{date_slug}-{name_slug}'


def generate_md(event: dict) -> str:
    """Генерирует содержимое .md файла."""
    distances = event['distances']
    dist_lines = '\n'.join(f'    {k}: {v}' for k, v in distances.items())

    # Формируем тело без заголовка h1 (данные уже в frontmatter)
    body = ''
    for k, v in distances.items():
        label = {'swim': '🏊 Плавание', 'bike': '🚴 Вело', 'run': '🏃 Бег'}.get(k, k)
        body += f'- {label}: {v} км\n'

    return f'''---
title: "{event['title']}"
date: {event['date'].strftime('%Y-%m-%d')}
city: "{event['city']}"
sportType: {event['sportType']}
status: {event['status']}
distances:
{dist_lines}
---

**Дата:** {event['date'].strftime('%d.%m.%Y')}  
**Город:** {event['city']}  
**Тип:** {event['sportType']}  
**Статус слотов:** {event['status']}

## Дистанции

{body}
[Регистрация на iron-star.com](https://iron-star.com/event/)
'''


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    events_dir = os.path.join(project_dir, 'src', 'content', 'events')

    os.makedirs(events_dir, exist_ok=True)

    print('Fetching events from iron-star.com/event/ ...')
    texts = fetch_events()
    print(f'Found {len(texts)} event cards')

    parsed = 0
    saved = 0

    for text in texts:
        event = parse_event_text(text)
        if not event:
            continue
        parsed += 1

        slug = slugify(event['title'], event['date'])
        md_content = generate_md(event)
        filepath = os.path.join(events_dir, f'{slug}.md')

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(md_content)
        print(f'  ✓ {slug}.md')
        saved += 1

    print(f'\nDone: {parsed} parsed, {saved} saved to {events_dir}')


if __name__ == '__main__':
    main()
