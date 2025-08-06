FROM php:8.2-fpm-alpine

# Install essential system dependencies
RUN apk add --no-cache \
    curl \
    postgresql-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && pecl install redis \
    && docker-php-ext-enable redis

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Set permissions
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache

# Expose port 9000 and start php-fpm server
EXPOSE 9000
CMD ["php-fpm"]