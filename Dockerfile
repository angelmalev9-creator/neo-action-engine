FROM mcr.microsoft.com/playwright:v1.42.0-jammy

WORKDIR /app

# 1️⃣ копираме само dependency файловете
COPY package.json package-lock.json* ./

# 2️⃣ инсталираме deps
RUN npm install

# 3️⃣ копираме source кода
COPY . .

# 4️⃣ build (tsc)
RUN npm run build

# 5️⃣ стартираме директно compiled JS
CMD ["node", "dist/index.js"]

