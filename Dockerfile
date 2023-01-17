FROM node:16

# Create app directory
WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package.json ./
COPY yarn.lock ./
COPY prisma ./prisma/

# Install app dependencies
RUN yarn install
COPY . .
RUN npx prisma generate
RUN yarn run build
COPY . .

# install hasura cli
RUN curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash

EXPOSE 3000
CMD [ "yarn", "run", "start" ]