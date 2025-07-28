# Use Node.js 24 slim image
FROM node:24-slim

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Build project (for production)
RUN npm run build

# Expose port if needed (optional, e.g., 3000)
EXPOSE 3000

# Run app in production mode
CMD ["node", "dist/index.js"]
