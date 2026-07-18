FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY apps/gateway/package*.json ./
RUN npm install
COPY apps/gateway/. .
COPY proto ./proto
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/proto ./proto
CMD ["node", "dist/main"]
