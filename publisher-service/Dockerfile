FROM node:24-bookworm-slim
WORKDIR /app
# Copy only application code. Local credentials and account sessions stay outside the image.
COPY publisher-service/*.mjs ./publisher-service/
COPY publisher.html ./publisher.html
COPY assets/publisher.js assets/publisher.css ./assets/
WORKDIR /app/publisher-service
ENV HOST=0.0.0.0
ENV PUBLISHER_DATA_DIR=/data
ENV PUBLISHER_ADSPOWER_ONLY=1
ENV PUBLISHER_MAX_UPLOAD_BYTES=52428800
ENV PUBLISHER_USER_QUOTA_BYTES=209715200
CMD ["node", "server.mjs"]
