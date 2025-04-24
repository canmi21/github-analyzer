FROM oven/bun:1 AS base
RUN apt-get update && apt-get install -y curl
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache bun install --production --frozen-lockfile

FROM base AS build
ARG OAUTH_CLIENT_ID
ARG VITE_HOST
ENV VITE_OAUTH_CLIENT_ID=${OAUTH_CLIENT_ID}
ENV VITE_HOST=${VITE_HOST}
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache bun install --frozen-lockfile
RUN bun run build

FROM nginx:1-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]