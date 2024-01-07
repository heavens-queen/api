FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

RUN npm install --verbose

COPY . .
# Build the TypeScript code
RUN npm run build

EXPOSE 8080
RUN chown -R node /usr/src/app
USER node
CMD ["npm", "start"]
