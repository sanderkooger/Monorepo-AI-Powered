#!/bin/sh
REPO_NAME=$(git remote get-url origin | sed -E -e 's/.*github.com(:|\/)//' -e 's/\.git$//' -e 's/\/$//' -e 's/.*\///')
echo "{\"repo_name\":\"$REPO_NAME\"}"