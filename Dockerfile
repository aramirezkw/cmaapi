# KWIQ CMA prototype: static files + ULS proxy. No dependencies beyond Node.
FROM node:24-alpine
WORKDIR /app
COPY index.html server.js ./
COPY css ./css
COPY js ./js
COPY vendor ./vendor
COPY assets ./assets
ENV HOST=0.0.0.0 PORT=8080 NODE_ENV=production
EXPOSE 8080
USER node
CMD ["node", "server.js"]
