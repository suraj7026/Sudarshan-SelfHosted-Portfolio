FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/tsconfig.json ./
ENV REACT_APP_API_URL="" REACT_APP_BASE_URL=https://sudarshanrajagopalan.one
RUN npm run build

FROM nginxinc/nginx-unprivileged@sha256:e2a8fca8aa356d66159aaf8a877a9c126773635adf210503eefaaeaffeed6ad7
COPY --from=builder /app/build /usr/share/nginx/html
COPY deploy/publication/frontend.conf /etc/nginx/conf.d/default.conf
USER 101:101
EXPOSE 8080
