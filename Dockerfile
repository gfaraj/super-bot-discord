FROM node:12.14.1-alpine3.11

ENV NODE_ENV production

RUN apk add --no-cache \
    build-base \
    g++ \
    git \
    openssh \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    bash

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

RUN npm install --production && mv node_modules ../

COPY . .

EXPOSE 3003

CMD npm start