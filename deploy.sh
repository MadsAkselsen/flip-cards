#!/bin/bash

echo "Building frontend..."
npm run build

echo "Uploading to server..."
rsync -avz --delete dist/ root@64.225.104.15:/var/www/flipcards/

echo "Restarting nginx..."
ssh root@64.225.104.15 "systemctl restart nginx"

echo "Deployment complete 🚀"