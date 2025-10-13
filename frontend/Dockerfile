# --- Etapa 1: Build ---
FROM node:23-alpine AS build

# Directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json / pnpm-lock.yaml / yarn.lock si existen
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Generar build de producción
RUN npm run build


# --- Etapa 2: Servidor ---
FROM nginx:1.29.1-alpine-slim

# Eliminar configuración por defecto
RUN rm -rf /usr/share/nginx/html/*

# Copiar build generado desde la etapa 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar archivo de configuración de nginx si quieres personalizar rutas
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto
EXPOSE 80

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
