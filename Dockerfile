FROM node:18-alpine
ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package.json package.json

COPY package-lock.json package-lock.json

RUN npm install --include=dev

COPY . .

CMD ["tail", "-f", "/dev/null"]