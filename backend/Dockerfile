FROM node:24-alpine AS development

WORKDIR /usr/src/app
COPY package*.json ./
# vendor/ holds local packages that package.json "overrides" point at.
COPY vendor ./vendor
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS production

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
COPY vendor ./vendor
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=development /usr/src/app/dist ./dist

# /data/uploads is the mount point of the uploads volume; a new named volume
# copies this directory's owner, so the app user can write to it.
RUN addgroup -S nestjs && adduser -S nestjs -G nestjs \
  && chown -R nestjs:nestjs /usr/src/app \
  && mkdir -p /data/uploads && chown nestjs:nestjs /data/uploads && chmod 700 /data/uploads
USER nestjs

EXPOSE 3005
CMD ["node", "dist/main"]
