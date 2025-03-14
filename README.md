# Cloud Native Application

This project is a backend web application designed to be cloud-native, leveraging Node.js and PostgreSQL. It includes a health check API to monitor the health of the application in a cloud environment.

## Prerequisites

Before setting up the project, ensure you have the following installed:
- **Node.js**: Node.js 16.x or later. [Download Node.js](https://nodejs.org/en/download/)
- **PostgreSQL**: PostgreSQL 12.x or later. [Download PostgreSQL](https://www.postgresql.org/download/)
- **Git**: [Install Git](https://git-scm.com/downloads) for version control.

### Install Dependencies

Navigate to the project directory and install dependencies:

```bash
npm install
```

### Database Setup

Ensure PostgreSQL is running, and create a database for the application:

```bash
psql -U postgres -c "CREATE DATABASE your_database_name;"
```

### Configure Environment Variables

Create a `.env` file in the root of your project directory and specify your database and server settings:

```
DB_NAME=your_database_name
DB_USER=your_database_username
DB_PASS=your_database_password
DB_HOST=localhost
PORT=8080
```

## Running the Application

To start the server, run:

```bash
node app.js
```

This will launch the server on `http://localhost:8080`. The health check API is accessible at `http://localhost:8080/healthz`.

## Testing the Application

To test the health check endpoint, use:

```bash
curl -vvvv http://localhost:8080/healthz
```

This should return HTTP 200 OK if the server and database are running properly, and HTTP 503 Service Unavailable if there is an issue.

```bash
curl -vvvv -XPUT http://localhost:8080/healthz
curl -vvvv -XPOST http://localhost:8080/healthz
curl -vvvv -XPATCH http://localhost:8080/healthz
curl -vvvv -XDELETE http://localhost:8080/healthz
curl -vvvv -XOPTIONS http://localhost:8080/healthz

```

This should return HTTP 405 Method Not Allowed

## Contribution Guidelines

To contribute to this project:

1. **Fork the repository** - Create a fork of the main repository and clone it locally.
2. **Create a new branch** - Make changes in a new branch in your forked repository.
3. **Commit Changes** - Use clear and descriptive commit messages.
4. **Submit a Pull Request** - Open a pull request from your branch to the main repository.



Assignment Review-4 testing

