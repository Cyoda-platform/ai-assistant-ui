ARG IMAGE_VERSION=stable-alpine
ARG IMAGE_HASH=62cabd934cbeae6195e986831e4f745ee1646c1738dbd609b1368d38c10c5519
FROM nginx:${IMAGE_VERSION}@sha256:${IMAGE_HASH}

COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /entrypoint.sh

RUN mkdir /app
COPY ./dist /app
RUN chmod +x entrypoint.sh
RUN chown -R nginx:nginx /app && chmod -R 775 /app
RUN mkdir -p /var/cache/nginx && chown -R nginx:nginx /var/cache/nginx && \
    mkdir -p /var/log/nginx  && chown -R nginx:nginx /var/log/nginx && \
    mkdir -p /var/lib/nginx  && chown -R nginx:nginx /var/lib/nginx && \
    touch /run/nginx.pid && chown -R nginx:nginx /run/nginx.pid && \
    mkdir -p /etc/nginx/templates /etc/nginx/ssl/certs && \
    chown -R nginx:nginx /etc/nginx && \
    chmod -R 775 /etc/nginx/conf.d

USER nginx
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
