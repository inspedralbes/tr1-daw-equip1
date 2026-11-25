FROM node:24.13.0-bookworm-slim

WORKDIR /app

COPY package*.json ./

#Install dependencies directly from package-lock.json
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]