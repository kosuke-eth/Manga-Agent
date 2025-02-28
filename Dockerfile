FROM node:20-alpine

WORKDIR /usr/src/app

ENV PORT 8080

COPY package*.json ./

RUN npm install
COPY . ./

RUN npm run build
CMD [ "npm", "start" ]