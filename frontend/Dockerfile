# Étape 1 : Build Angular
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build --configuration=production

# Étape 2 : Serve avec NGINX
FROM nginx:alpine

COPY --from=builder /app/dist/front /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
