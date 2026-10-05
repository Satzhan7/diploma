FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
# Rendered to conf.d/default.conf at start; only defined env vars are replaced.
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV CSP_CONNECT_SRC="'self' https: wss:"
# blob: shows private images (stats screenshots) fetched with the token.
ENV CSP_IMG_SRC="'self' data: blob: https:"
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
