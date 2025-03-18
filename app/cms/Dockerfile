FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install -g npm@10.8.2
RUN npm i
COPY . .
EXPOSE 1337
CMD ["npm", "run", "develop"]