FROM ghcr.io/puppeteer/puppeteer:latest  as base

WORKDIR /usr/app
COPY ./src ./src
COPY ./package.json ./
COPY ./.env ./
RUN yarn install
CMD [ "yarn", "dev" ]
