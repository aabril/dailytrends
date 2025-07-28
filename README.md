# dailytrends


## Tareas a realizar
- [*]  Crea un proyecto TypeScript con una arquitectura de ficheros que consideres apropiada.

- [*] | Crea un modelo Feed y define sus atributos. 
      | El origen de datos tiene que ser MongoDB, por lo que puedes usar algún ODM.

- [*] | Define los diferentes endpoints para gestionar los servicios CRUD del modelo Feed. 
      | Intenta desacoplar las capas del API lo máximo posible.

- [ ] | Crea un “servicio de lectura de feeds” que extraiga por web scraping (no lectura de fuentes RSS) 
      | en cada uno de los periódicos sus noticias de portada y que las guarde como Feeds. 
      | Esta es la parte donde más conceptos de orientación a objetos puedes usar y la más “compleja”, ponle especial atención.

> Otros detalles
- Representa en un dibujo la arquitectura y las capas de la aplicación.
- Usa todas las buenas prácticas que conozcas.
- Demuestra conocimientos en programación orientada a objetos: 
  - abstracción, encapsulamiento, herencia y polimorfismo.
  - Haz los tests que consideres necesarios.

## Changelog

- Inicializamos proyecto:
    - Usando npm init, con la node@latest (v24.4.1)

- First part: [#1 PR : feat/project_structure ](https://github.com/aabril/dailytrends/pull/1)
    - Crea un proyecto TypeScript con una arquitectura de ficheros que consideres apropiada.
      - Añadimos dependencias que voy a usar 
      - Creo una estructura de directorio inicial
      - Añado un primer test (database.test.ts) para jest

- Second part: [#2 PR : feat/database_and_feed_model ](https://github.com/aabril/dailytrends/pull/2) && [#4 PR: feat/database_and_feed_model 2nd part](https://github.com/aabril/dailytrends/pull/4)
  - Crea un modelo Feed y define sus atributos. El origen de datos tiene que ser MongoDB, por lo que puedes usar algún ODM.
    - Añadimos `moongose` a las dependencias
    - Añado un docker-compose con mongo local (luego lo ampliaré para esta propia app)
    - Modificar el docker para tenerlo multistage y reducir el tamaño de las imagenes de contenedores
    - añadir documentación de Docker, docker-compose
    - añadir documentación de las capas de abstracción de "Feed"
    - añadir tests para la conexión con la base de datos con Mocks (el mocking aqui a veces se complica)
    - añadir primeras definiciones de Feed, empezaremos de lowerst a higher abstraction: tipo -> modelo -> repo -> servicio -> controller
    - añadir tests para FeedService & Feed.model 
    - añadir funcionamiento de feed en las diferentes capas

- Third part: [#5 PR : feat/add_endpoints ](https://github.com/aabril/dailytrends/pull/5)
  - Define los diferentes endpoints para gestionar los servicios CRUD del modelo Feed. Intenta desacoplar las capas del API lo máximo posible.
    - reemplazar index por server.ts
    - implement a basic server.ts in server.ts
    - implement endpoints and their tests
    - troubleshooting: update jest.config and tsconfig to allow test use dependencies

- Fourth part: [#6 PR : feat/scraper](https://github.com/aabril/dailytrends/pull/6)
  - Crea un “servicio de lectura de feeds” que extraiga por web scraping 
    - we are going to be implementing a Factory for the scraper, since we are going to input values and then will build our custom class

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
The size of the image has been reduced from **717 Mb** to **376 Mb**.

```bash
dailytrends-app-legacy    latest    96a2dfe15361   3 minutes ago   717MB
dailytrends-app-light     latest    7436142e1301   3 seconds ago   376MB
```

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
