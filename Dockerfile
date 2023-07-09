FROM node:14 AS server-build 

WORKDIR /app

COPY package*.json ./

COPY ./controllers ./controllers
COPY ./models ./models
COPY .env /app/.env

COPY index.js ./

RUN npm install

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "run", "start"]