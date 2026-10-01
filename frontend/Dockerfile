FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
# Rendered to conf.d/default.conf at start; only defined env vars are replaced.
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV CSP_CONNECT_SRC="'self' https: wss:"
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
