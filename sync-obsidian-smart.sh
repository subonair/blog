#!/usr/bin/env bash
# sync-obsidian-smart.sh — умная синхронизация Obsidian → dimino_me
# Копирует только заметки со статусом 'review', с учётом publish-to.
# Создаёт Git-коммит при изменениях, триггерит деплой.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OBSIDIAN_DIR="${OBSIDIAN_DIR:-/root/projects/obsidian}"
CHERNO_DIR="$OBSIDIAN_DIR/Заметки/Черновики заметок"
TG_DEST="$SCRIPT_DIR/src/content/tg-posts"
SITE_DEST="$SCRIPT_DIR/src/content/site-posts"
LOG_FILE="$SCRIPT_DIR/sync-smart.log"

log() { local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"; echo "$msg" >> "$LOG_FILE"; echo "$msg"; }

log "=== Смарт-синхронизация Obsidian ==="

CHANGES=false
SYNCED_TG=0
SYNCED_SITE=0

for src_file in "$CHERNO_DIR"/*.md; do
    [[ -f "$src_file" ]] || continue
    fname=$(basename "$src_file")

    # Парсим frontmatter
    status=$(sed -n '/^---$/,/^---$/p' "$src_file" | sed -n 's/^status:[[:space:]]*//p')
    publish_to=$(sed -n '/^---$/,/^---$/p' "$src_file" | sed -n 's/^publish_to:[[:space:]]*//p')

    # Пропускаем служебные
    [[ "$status" == "reference" ]] && continue

    # Интересуют только status=review
    if [[ "$status" != "review" ]]; then
        continue
    fi

    # Копируем в tg-posts
    if echo "$publish_to" | grep -q 'telegram'; then
        mkdir -p "$TG_DEST"
        if ! diff -q "$src_file" "$TG_DEST/$fname" &>/dev/null 2>&1; then
            cp "$src_file" "$TG_DEST/$fname"
            log "  TG ← $fname"
            ((SYNCED_TG++)) || true
            CHANGES=true
        fi
    fi

    # Копируем в site-posts
    if echo "$publish_to" | grep -q 'site'; then
        mkdir -p "$SITE_DEST"
        if ! diff -q "$src_file" "$SITE_DEST/$fname" &>/dev/null 2>&1; then
            cp "$src_file" "$SITE_DEST/$fname"
            log "  SITE ← $fname"
            ((SYNCED_SITE++)) || true
            CHANGES=true
        fi
    fi
done

if [[ "$CHANGES" == "false" ]]; then
    log "Нет изменений для синхронизации."
    exit 0
fi

log "Синхронизировано: $SYNCED_TG в tg-posts, $SYNCED_SITE в site-posts"

# Git commit + push (если есть доступ к GitHub)
cd "$SCRIPT_DIR"
if git diff --quiet && git diff --cached --quiet; then
    git add src/content/tg-posts/ src/content/site-posts/ 2>/dev/null || true
    if ! git diff --cached --quiet; then
        git commit -m "sync: Obsidian review-заметки → tg-posts/site-posts ($SYNCED_TG TG + $SYNCED_SITE site)"
        log "Коммит создан."
        # Только коммитим, Бендер сам запушит и задеплоит
    fi
fi

log "=== Готово ==="
