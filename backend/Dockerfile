# Utilise une image Node.js stable
FROM node:22

# Installe git
RUN apt-get update && apt-get install -y git && apt-get clean && rm -rf /var/lib/apt/lists/*

# Crée le répertoire de travail
WORKDIR /usr/src/app

# Copie les fichiers de dépendances
COPY package*.json ./

# Installation propre avec npm ci pour plus de fiabilité en CI/CD
RUN npm ci

# Copie du code
COPY . .

# Expose le port de l'app
EXPOSE 3000

# Lance l'application
CMD ["npm", "start"]
