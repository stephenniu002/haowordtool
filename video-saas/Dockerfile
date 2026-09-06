FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends chromium ffmpeg fonts-noto-cjk libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2 && rm -rf /var/lib/apt/lists/*
WORKDIR /app/video-saas
RUN npm install --global pnpm@11.19.0
COPY video-saas/package.json video-saas/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY video-saas/ ./
COPY assets/video-* /app/assets/
COPY video-studio.html /app/
COPY video-studio/ /app/video-studio/
RUN mkdir -p /data && chown -R node:node /data /app
USER node
ENV HOST=0.0.0.0 PORT=8787 DATA_DIR=/data NODE_ENV=production
EXPOSE 8787
CMD ["node", "server.mjs"]
