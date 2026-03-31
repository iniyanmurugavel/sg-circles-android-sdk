#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LIBS_DIR="$ROOT_DIR/app/libs"
EXPO_REPO_DIR="$ROOT_DIR/../common-rn-expo"

mkdir -p "$LIBS_DIR"
rm -f "$LIBS_DIR"/*.aar

copy_aar() {
  local source_path="$1"
  if [[ ! -f "$source_path" ]]; then
    echo "Missing AAR: $source_path" >&2
    exit 1
  fi
  cp "$source_path" "$LIBS_DIR/"
}

copy_aar "$HOME/.m2/repository/com/circles/telco/circles-travel-pass-sdk/1.0.0/circles-travel-pass-sdk-1.0.0.aar"

echo "Synced AARs into $LIBS_DIR"
ls -1 "$LIBS_DIR"
