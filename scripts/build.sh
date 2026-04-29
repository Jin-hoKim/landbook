#!/bin/bash
set -e

echo "Building viewer..."
cd "$(dirname "$0")/../viewer" && npm run build

echo "Building admin..."
cd "$(dirname "$0")/../admin" && npm run build

echo "Build complete."
