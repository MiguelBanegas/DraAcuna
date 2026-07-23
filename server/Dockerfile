FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm
RUN apk add --no-cache postgresql-client

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "start"]