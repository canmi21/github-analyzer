FROM oven/bun:latest

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY src ./

EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "index.ts" ]