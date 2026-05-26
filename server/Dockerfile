FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
COPY sql ./sql
COPY public ./public

EXPOSE 3000

CMD ["node", "src/index.js"]