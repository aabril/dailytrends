# dailytrends



## Changelog


- Inicializamos proyecto:
    - Usando npm init, con la node@latest (v24.4.1)

- First part: [#1 PR : feat/project_structure ](https://github.com/aabril/dailytrends/pull/1)
    - Añadimos dependencias que voy a usar 
    - Creo una estructura de directorio inicial
    - Añado un primer test (database.test.ts) para jest

- Second part: [#2 PR : feat/database_and_feed_model ](https://github.com/aabril/dailytrends/pull/2) && [#4 PR: feat/database_and_feed_model 2nd part](https://github.com/aabril/dailytrends/pull/4)
    - Añadimos `moongose` a las dependencias
    - Añado un docker-compose con mongo local (luego lo ampliaré para esta propia app)
    - Modificar el docker para tenerlo multistage y reducir el tamaño de las imagenes de contenedores
    - añadir documentación de Docker, docker-compose
    - añadir documentación de las capas de abstracción de "Feed"
    - añadir tests para la conexión con la base de datos con Mocks (el mocking aqui a veces se complica)
    - añadir primeras definiciones de Feed, empezaremos de lowerst a higher abstraction: tipo -> modelo -> repo -> servicio -> controller
    - añadir tests para FeedService & Feed.model 
    - añadir funcionamiento de feed en las diferentes capas

## Feed layer abstractions

From higher to lower:

- Layer 1: HTTP/Controller (Highest Abstraction)  
  - `FeedController.ts` : Handles HTTP requests/responses, API endpoints

- Layer 2: Business Logic/Service
  - `FeedService.ts`    : Implements business rules, validation, orchestration

- Layer 3: Data Access/Repository 
  - `FeedRepository.ts` : Abstracts database operations, CRUD methods

- Layer 4: Data Model/Schema
  - `Feed.ts`           : Mongoose schema, database validations, indexes

- Layer 5: Type Definitions (Lowest Abstraction) 
  - `Feed.ts`           : TypeScript interfaces, enums, DTOs
  - `config.ts`         : Configuration settings

## Dockerfile simple to multistage

I rebuild the Dockerfile to be multistage, since the image was heavy because all the node_modules dependencies.
The size of the image has been reduced from 717Mb to 376.

dailytrends-app-legacy    latest    96a2dfe15361   3 minutes ago   717MB
dailytrends-app-light     latest    7436142e1301   3 seconds ago   376MB


###### legacy 

```Dockerfile
FROM node:24-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

###### light

```Dockerfile
FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:24-slim AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]

```



