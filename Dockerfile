FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy & install dependencies
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the project
COPY . .

# Expose port used by the proxy
EXPOSE 3420

# Run the proxy server
CMD ["pnpm", "start"]
