# Use Node.js LTS version
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the plugin
RUN npm run build

# Install http-server globally
RUN npm install -g http-server

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["http-server", "dist", "-p", "3000", "--cors"]