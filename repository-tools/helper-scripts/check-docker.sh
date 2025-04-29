#!/bin/sh

detect_os() {
    case "$(uname -sr)" in
        *Microsoft*|*WSL*) echo "wsl" ;;
        Darwin*) echo "macos" ;;
        Linux*)  echo "linux" ;;
        *)       echo "unknown" ;;
    esac
}

check_docker() {
    case $1 in
        wsl)
            [ -S /var/run/docker.sock ]
            ;;
        macos)
            docker info >/dev/null 2>&1
            ;;
        linux)
            systemctl is-active docker >/dev/null 2>&1
            ;;
    esac
}

start_docker() {
    case $1 in
        wsl)
            /mnt/c/Program\ Files/Docker/Docker/Docker\ Desktop.exe &
            ;;
        macos)
            open -a Docker
            ;;
        linux)
            sudo systemctl start docker
            ;;
    esac
}

wait_for_docker() {
    local os=$1
    local max_retries=10
    local count=0
    
    while [ $count -lt $max_retries ]; do
        if check_docker "$os"; then
            return 0
        fi
        sleep 3
        count=$((count + 1))
    done
    return 1
}

OS=$(detect_os)
if check_docker "$OS"; then
    echo "✓ Docker is running"
    exit 0
else
    echo "Docker is not running. Attempting to start..."
    if start_docker "$OS"; then
        start_docker "$OS"
        echo "Starting Docker..."
        if wait_for_docker "$OS"; then
            echo "✓ Docker started successfully"
            exit 0
        else
            echo "⚠️ Failed to start Docker after 30 seconds"
            exit 1
        fi
    else
        exit 1
    fi
fi