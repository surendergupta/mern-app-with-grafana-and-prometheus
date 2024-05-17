#Dockerfile for the backend service
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy remaining source code
COPY . .

# Expose port
EXPOSE 3001

# Command to run the application
CMD ["npm", "start"]
