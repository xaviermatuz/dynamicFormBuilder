# --- Etapa 1: Base ---
FROM python:3.12-slim

# Evitar buffering de logs
ENV PYTHONUNBUFFERED 1

# Crear directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    netcat-openbsd \
    curl \
    procps \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar proyecto
COPY . .

RUN mkdir -p /app/logs && chmod -R 755 /app/logs

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# Puerto para gunicorn
EXPOSE 8000
