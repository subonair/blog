#!/usr/bin/env bash
# sync-obsidian.sh — синхронизация Obsidian vault → src/content/blog/
# Идемпотентен: не перезаписывает существующие файлы без --force

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST_DIR="$SCRIPT_DIR/src/content/blog"
LOG_FILE="$SCRIPT_DIR/sync.log"
FORCE=false
VAULT_DIR=""

# ─── Аргументы ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)   FORCE=true; shift ;;
    --vault)   VAULT_DIR="$2"; shift 2 ;;
    --help)
      echo "Использование: ./sync-obsidian.sh --vault /path/to/vault [--force]"
      echo "  --vault DIR   Путь к Obsidian vault (обязательно)"
      echo "  --force       Перезаписывать существующие файлы"
      exit 0
      ;;
    *) echo "Неизвестный аргумент: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$VAULT_DIR" ]]; then
  echo "Ошибка: укажи --vault /path/to/vault" >&2
  exit 1
fi

if [[ ! -d "$VAULT_DIR" ]]; then
  echo "Ошибка: vault не найден: $VAULT_DIR" >&2
  exit 1
fi

# ─── Лог-функция ──────────────────────────────────────────────────────────────
log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

# ─── Конвертация frontmatter ───────────────────────────────────────────────────
# Принимает содержимое файла, нормализует поля frontmatter.
# Поддерживаемые поля: title, description, date, category, image
convert_frontmatter() {
  local content="$1"

  # Убедимся что есть обязательные поля с дефолтами
  # (если поля уже есть — оставляем как есть)
  if ! echo "$content" | grep -qE '^date:'; then
    content=$(echo "$content" | sed '/^---$/,/^---$/ s/^---$/---\ndate: '"$(date '+%Y-%m-%d')"'/')
  fi

  if ! echo "$content" | grep -qE '^category:'; then
    content=$(echo "$content" | sed '/^---$/,/^---$/ s/^---$/---\ncategory: iai/')
  fi

  if ! echo "$content" | grep -qE '^image:'; then
    content=$(echo "$content" | sed '/^---$/,/^---$/ s/^---$/---\nimage: \/images\/placeholder.jpg/')
  fi

  echo "$content"
}

# ─── Основной цикл ────────────────────────────────────────────────────────────
log "=== Старт синхронизации ==="
log "Vault: $VAULT_DIR"
log "Dest:  $DEST_DIR"
log "Force: $FORCE"

COPIED=0
SKIPPED=0
ERRORS=0

# Ищем все .md файлы в vault, пропускаем системные папки Obsidian
while IFS= read -r -d '' src_file; do
  # Относительный путь от vault
  rel_path="${src_file#$VAULT_DIR/}"

  # Определяем категорию из первой директории пути,
  # либо из frontmatter поля category
  first_dir=$(echo "$rel_path" | cut -d'/' -f1)

  # Если файл в корне vault — читаем category из frontmatter
  if [[ "$rel_path" != */* ]]; then
    category=$(grep -m1 '^category:' "$src_file" 2>/dev/null | sed 's/^category:[[:space:]]*//' | tr -d '"' || true)
    category="${category:-iai}"
  else
    category="$first_dir"
  fi

  # Имя файла назначения
  filename=$(basename "$rel_path")
  dest_file="$DEST_DIR/$category/$filename"

  # Создаём директорию категории если нет
  mkdir -p "$DEST_DIR/$category"

  # Проверка идемпотентности
  if [[ -f "$dest_file" ]] && [[ "$FORCE" == "false" ]]; then
    log "ПРОПУСК (уже есть): $category/$filename"
    ((SKIPPED++)) || true
    continue
  fi

  # Читаем и конвертируем
  content=$(cat "$src_file")
  converted=$(convert_frontmatter "$content")

  if echo "$converted" > "$dest_file"; then
    if [[ -f "$dest_file" ]] && [[ "$FORCE" == "true" ]]; then
      log "ОБНОВЛЕНО: $category/$filename"
    else
      log "СКОПИРОВАНО: $category/$filename"
    fi
    ((COPIED++)) || true
  else
    log "ОШИБКА при копировании: $rel_path"
    ((ERRORS++)) || true
  fi

done < <(find "$VAULT_DIR" \
  -name ".obsidian" -prune -o \
  -name ".trash" -prune -o \
  -name "*.md" -print0)

log "=== Итог: скопировано=$COPIED, пропущено=$SKIPPED, ошибок=$ERRORS ==="
log ""
