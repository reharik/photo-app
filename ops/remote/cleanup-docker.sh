#!/usr/bin/env bash
set -euo pipefail

echo "Starting Docker cleanup at $(date)"

# Remove dangling images (untagged images from previous builds)
echo "Removing dangling images..."
docker image prune -f

# Remove unused images (not associated with any container)
echo "Removing unused images..."
docker image prune -a -f --filter "until=24h"

# Remove stopped containers older than 24 hours
echo "Removing old stopped containers..."
docker container prune -f --filter "until=24h"

# Remove unused volumes
echo "Removing unused volumes..."
docker volume prune -f

# Remove unused networks
echo "Removing unused networks..."
docker network prune -f

# Show current disk usage
echo ""
echo "Current Docker disk usage:"
docker system df

echo ""
echo "Docker cleanup complete at $(date)"
