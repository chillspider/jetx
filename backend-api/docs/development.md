# Setup and development

- [Setup and development](#setup-and-development)
  - [First-time setup](#first-time-setup)
  - [Installation](#installation)
    - [Database](#database)
    - [Configuration](#configuration)
      - [MySQL](#mysql)
    - [Dev server](#dev-server)
  - [Generators](#generators)
  - [Docker](#docker)
    - [Docker installation](#docker-installation)
    - [Docker-compose installation](#docker-compose-installation)
    - [Run](#run)

## First-time setup

Make sure you have the following installed:

- [Node](https://nodejs.org/en/) (at least the latest LTS)

## Installation

```bash
# Install dependencies from package.json
npm install
```

> Note: don't delete package-lock.lock before installation

### Database

> Note: uses [TypeORM](https://github.com/typeorm/typeorm) with Data Mapper pattern.

### Configuration

Before start install PostgreSQL and fill correct configurations in `.env` file

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=wash24-api
```

Some helper script to work with database

```bash
# To create new migration file
npm run migration:create --name="migration_name"

# Truncate full database (note: it isn't deleting the database)
npm run schema:drop

# Generate migration from update of entities
npm run migration:generate --name="migration_name"
```

#### MySQL

If you need to use MySQL / MariaDB instead of PostgreSQL, follow the steps below:
> (assuming you have installed mysql in your system and it is running on port 3306)
1. Make the following entries in the #DB section in `.env` file

```env
#== DB
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=mysql
DB_PASSWORD=mysql
DB_DATABASE=wash24-api
DB_ROOT_PASSWORD=mysql
DB_ALLOW_EMPTY_PASSWORD=yes
```
2. Change the DB in TypeORM to MySQL. You can do that by heading over to the file `ormconfig.ts`.
```
...
export const dataSource = new DataSource({
  type: 'mysql', // <-- Just write mysql here
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  namingStrategy: new SnakeNamingStrategy(),
  subscribers: [UserSubscriber],
  entities: [
    'src/modules/**/*.entity{.ts,.js}',
    'src/modules/**/*.view-entity{.ts,.js}',
  ],
  migrations: ['src/database/migrations/*{.ts,.js}'],
});
```
1. Delete all the files in migrations folder (`src/database/migrations`)
2. Run the following commands in the root folder of the project, to regenerate the migrations:
```
npm run migration:generate ./src/database/migrations/MySQLMigrations
```

These steps may work for [other databases](https://typeorm.io/#features) supported by TypeORM. If they work, let us know and we'll add it to the docs!

### Dev server

> Note: If you're on Linux and see an `ENOSPC` error when running the commands below, you must [increase the number of available file watchers](https://stackoverflow.com/questions/22475849/node-js-error-enospc#answer-32600959).

```bash
# Launch the dev server
npm run start:dev

# Launch the dev server with file watcher
npm run watch:dev

# Launch the dev server and enable remote debugger with file watcher
npm run debug:dev
```

## Generators

This project includes generators to speed up common development tasks. Commands include:

> Note: Make sure you already have the nest-cli globally installed

```bash
# Install nest-cli globally
npm install -g @nestjs/cli

# Generate a new service
nest generate service users

# Generate a new class
nest g class users

```
> Note: if you love generators then you can find full list of command in official [Nest-cli Docs](https://docs.nestjs.com/cli/usages#generate-alias-g).

## Docker

if you are familiar with [docker](https://www.docker.com/) and [docker-compose](https://docs.docker.com/compose) then you can run built in docker-compose file, which will install and configure application and database for you.

### Docker installation

Download docker from Official website

- Mac <https://docs.docker.com/docker-for-mac/install/>
- Windows <https://docs.docker.com/docker-for-windows/install/>
- Ubuntu <https://docs.docker.com/install/linux/docker-ce/ubuntu/>

### Docker-compose installation

Download docker from [Official website](https://docs.docker.com/compose/install)

### Run

Open terminal and navigate to project directory and run the following command.

```bash
PORT=3000 docker-compose up
```

> Note: application will run on port 3000 (<http://localhost:3000>)

Navigate to <http://localhost:8080> and connect to you database with the following configurations

```text
host: postgres
user: postgres
pass: postgres
```

create database `wash24-api` and your application fully is ready to use.
