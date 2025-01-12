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

# Expose port 3005
EXPOSE 3005

# Start the server
CMD ["http-server", "dist", "-p", "3005", "--cors"]