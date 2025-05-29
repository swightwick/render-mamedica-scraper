# Use official Playwright image with all dependencies
FROM mcr.microsoft.com/playwright:v1.52.0-jammy

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the project
COPY . .

# Expose the app's port
EXPOSE 3000

# Start the scraper server
CMD ["node", "index.js"]
