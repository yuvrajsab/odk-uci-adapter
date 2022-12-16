FROM node:16 AS builder

# Create app directory
WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package.json ./
COPY yarn.lock ./
COPY prisma ./prisma/
COPY hasura ./hasura/

# Install app dependencies
RUN yarn install
# Required if not done in postinstall
# RUN npx prisma generate

COPY . .

RUN npx prisma generate

RUN yarn run build

FROM node:16

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/hasura ./hasura

EXPOSE 3000
CMD [ "npm", "run", "start:prod" ]