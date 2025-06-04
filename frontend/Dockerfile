# syntax=docker/dockerfile:1

# --- Build Stage ---
ARG NODE_VERSION=22.13.1
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
COPY --link package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    npm ci
COPY --link . .
RUN --mount=type=cache,target=/root/.npm \
    npm run build

# --- Production Stage ---
FROM nginx:alpine AS final

# 1) Crear directorio para PID y darle permiso a nginx
RUN mkdir -p /var/run/nginx \
    && chown -R nginx:nginx /var/run/nginx

# 2) Crear y dar permisos a los temp paths en /tmp
RUN mkdir -p /tmp/client_temp \
             /tmp/proxy_temp \
             /tmp/fastcgi_temp \
             /tmp/uwsgi_temp \
             /tmp/scgi_temp \
    && chmod -R 1777 /tmp

# 3) Copiar configuración y build
COPY --link nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/build /usr/share/nginx/html

# 4) Asegurar propiedad de los estáticos
RUN chown -R nginx:nginx /usr/share/nginx/html

# 5) Ejecutar como nginx (no-root)
USER nginx

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
