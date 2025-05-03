#!/bin/sh
# Search parent directories for .git/config
SCRIPT_DIR=$(dirname "$0")
current_dir=$(cd "$SCRIPT_DIR" && pwd)
max_depth=7
found=0

while [ "$current_dir" != "/" ] && [ $max_depth -gt 0 ]; do
    if [ -f "$current_dir/.git/config" ]; then
        REPO_NAME=$(grep -A1 'remote "origin"]' "$current_dir/.git/config" | grep 'url' | sed -E -e 's/.*github.com[:\/]//' -e 's/\.git$//' -e 's/\/$//' -e 's/.*\///')
        found=1
        break
    fi
    current_dir=$(dirname "$current_dir")
    max_depth=$((max_depth - 1))
done

if [ $found -eq 0 ]; then
    echo "{\"error\":\"Could not find .git/config in parent directories (searched $max_depth levels)\"}" >&2
    exit 1
fi


# Ensure script fails explicitly if git is not found or URL is invalid
if [ -z "$REPO_NAME" ]; then
  echo "{\"error\":\"Failed to extract repo name from origin URL\"}" >&2
  exit 1
fi
echo "{\"repo_name\":\"$REPO_NAME\"}"