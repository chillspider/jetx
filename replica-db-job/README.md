# Replica Database Job

- This project facilitates the synchronization of databases between a source and a target. It is designed to automate the process of dumping a source database and restoring it to a target database, ensuring that data is consistently updated.

## Prerequisites

- Docker
- Docker Compose

## Usage

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd <repository-directory>
    ```

2. Create a `.env` file based on the [template.env](http://_vscodecontentref_/1) file and fill in the required environment variables:
    ```sh
    cp template.env .env
    # Edit .env to set the required environment variables
    ```

3. Build and run the Docker containers:
    ```sh
    docker-compose up -d --build --force-recreate
    ```

4. To manually trigger the sync script:
    ```sh
    docker-compose exec sync sh run.sh
    ```

## Environment Variables

The following environment variables need to be set in the `.env` file:

- `SCHEDULE`: Cron schedule for running the sync script (e.g., `0 */12 * * *` for every 12 hours)
- `SOURCE_DATABASE`: Name of the source database
- `SOURCE_HOST`: Host of the source database
- `SOURCE_PORT`: Port of the source database
- `SOURCE_USER`: User for the source database
- `SOURCE_PASSWORD`: Password for the source database
- `TARGET_DATABASE`: Name of the target database
- `TARGET_HOST`: Host of the target database
- `TARGET_PORT`: Port of the target database
- `TARGET_USER`: User for the target database
- `TARGET_PASSWORD`: Password for the target database

## Docker Workflow

The project includes a GitHub Actions workflow to build and push Docker images. The workflow is defined in [build-and-push-images.yml](http://_vscodecontentref_/2).

