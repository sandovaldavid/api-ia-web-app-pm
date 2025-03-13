FROM node:16-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci --production

# Copy app source
COPY . .

# Create required directories
RUN mkdir -p logs uploads

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start the application
CMD [ "node", "src/server.js" ]
