# Base image
FROM node:18-bullseye-slim AS build

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY --chown=node:node . .

# Clean npm cache
RUN npm cache clean --force

# Install app dependencies
RUN npm ci

# Build the app
RUN npm run build

# Change user to "node"
USER node

# Launch step
FROM node:18-bullseye-slim AS launch

# Copy the bundle from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/ .

# Expose port
EXPOSE 3000

# Start the app using the build
CMD [ "npm", "start" ]
