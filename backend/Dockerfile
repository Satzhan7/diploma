FROM node:18-alpine AS development

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=development /usr/src/app/dist ./dist

RUN addgroup -S nestjs && adduser -S nestjs -G nestjs \
  && chown -R nestjs:nestjs /usr/src/app
USER nestjs

EXPOSE 3005
CMD ["node", "dist/main"]
