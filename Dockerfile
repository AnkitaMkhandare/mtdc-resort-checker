FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY check_resort.js ./

CMD ["node", "check_resort.js"]