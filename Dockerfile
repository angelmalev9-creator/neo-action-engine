FROM mcr.microsoft.com/playwright:v1.42.0-jammy

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "start"]

