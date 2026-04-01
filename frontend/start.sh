#!/bin/bash
set -e

# Default PORT to 3000 if not set
export PORT=${PORT:-3000}

# Start the Next.js server
exec node /app/server.js
