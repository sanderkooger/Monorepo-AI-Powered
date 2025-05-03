#!/bin/sh
# Search parent directories for .terraform/environment
current_dir=$(pwd)
max_depth=7
found=0

while [ "$current_dir" != "/" ] && [ $max_depth -gt 0 ]; do
    if [ -f "$current_dir/.terraform/environment" ]; then
        WORKSPACE_NAME=$(cat "$current_dir/.terraform/environment" | tr -d '[:space:]')
        found=1
        break
    fi
    current_dir=$(dirname "$current_dir")
    max_depth=$((max_depth - 1))
done

if [ $found -eq 0 ]; then
    echo "{\"error\":\"Could not find .terraform/environment in parent directories (searched $max_depth levels)\"}" >&2
    exit 1
fi

if [ -z "$WORKSPACE_NAME" ]; then
    echo "{\"error\":\"Workspace name is empty in .terraform/environment\"}" >&2
    exit 1
fi

echo "{\"workspace_name\":\"$WORKSPACE_NAME\"}"