FROM node:22-alpine
WORKDIR /app
COPY app/package.json app/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY app ./
ENV VITE_API_URL=http://localhost:8000
ENV VITE_USE_MOCKS=false
RUN pnpm build && mkdir -p node_modules/.vite-temp && chown node:node node_modules/.vite-temp
USER node
EXPOSE 5173
CMD ["node", "node_modules/vite/bin/vite.js", "preview", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
