#!/usr/bin/env sh
set -e

if [ ! -f .env ]; then
  cp .env.example .env
fi

npm install
npm run prisma:generate
npm run prisma:push
npm run seed
npm run build

echo "Cape Compass is ready. Run: npm run start"
