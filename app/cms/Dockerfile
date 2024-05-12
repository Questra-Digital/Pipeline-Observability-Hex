FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install -g npm@latest
RUN npm i
COPY . .
EXPOSE 1337
CMD ["npm", "run", "develop"]