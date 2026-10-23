FROM node:20-alpine

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Vite dev server runs on port 3000 inside the container
EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "--port", "3000"]
