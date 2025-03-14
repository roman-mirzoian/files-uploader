# File Uploader with Google Drive Integration

This project is built with NestJS and integrates with Google Drive for uploading files via HTTP requests. It provides APIs to upload files to Google Drive and retrieve the list of uploaded files with their Google Drive URLs. Additionally, the infrastructure is containerized using Docker and Docker Compose.

## Features

- **File Upload**: Upload an array of file URLs and store them on Google Drive.
- **File List**: Retrieve a list of files with links to their respective Google Drive locations.
- **Google Drive Integration**: Direct interaction with Google Drive API for uploading and managing files.
- **Database**: Uses PostgreSQL for storing metadata about the uploaded files.
- **Dockerized**: The project uses Docker Compose to set up the entire infrastructure.

## Requirements

- **Node.js** (v22 or later)
- **NestJS** (v8 or later)
- **Docker & Docker Compose**
- **Google Cloud Account** with Drive API enabled
- **PostgreSQL or MySQL** (PostgreSQL is the default for this project)

## API Endpoints

### 1. Create and save files from URLs

- **URL:** `/files`
- **Method:** `POST`
- **Body:** `urls` (array of file URLs to upload)
- **Response:** A list of saved files with their metadata.

### Request Example:

```json
{
  "urls": [
    "https://docs.google.com/spreadsheets/d/exampleId1",
    "https://docs.google.com/spreadsheets/d/exampleId2"
  ]
}
```

### Success Response:

```json
[
  {
    "id": 1,
    "googleId": "abc123",
    "fileUrl": "https://drive.google.com/file/d/abc123/view",
    "fileName": "12345_document",
    "createdAt": "2025-03-14T00:38:45.086Z"
  },
  {
    "id": 2,
    "googleId": "xyz456",
    "fileUrl": "https://drive.google.com/file/d/xyz456/view",
    "fileName": "6789_document",
    "createdAt": "2025-03-14T00:38:45.086Z"
  }
]
```

### 2. Get File List

- **URL:** `/files`
- **Method:** `GET`
- **Query Parameters:** `page, limit, order` (default values are page=1, limit=10, order=ASC)
- **Response:** A paginated list of files with their metadata.

### Success Response:

```json
{
  "total": 2,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "data": [
    {
      "id": 1,
      "googleId": "abc123",
      "fileUrl": "https://drive.google.com/file/d/abc123/view",
      "fileName": "12345_document",
      "createdAt": "2025-03-14T00:38:45.086Z"
    },
    {
      "id": 2,
      "googleId": "xyz456",
      "fileUrl": "https://drive.google.com/file/d/xyz456/view",
      "fileName": "6789_document",
      "createdAt": "2025-03-14T00:38:45.086Z"
    }
  ]
}
```

### 3. Delete File

- **URL:** `/files/:id`
- **Method:** `DELETE`
- **Response:** A confirmation message.

### Success Response:

```json
{
  "result": "File with id:1 has been deleted"
}
```

### 4. Get file by ID

- **URL:** `/files/:id`
- **Method:** `GET`
- **Response:** Full file information.

### Success Response:

```json
{
  "id": 2,
  "googleId": "xyz456",
  "fileUrl": "https://drive.google.com/file/d/xyz456/view",
  "fileName": "6789_document",
  "createdAt": "2025-03-14T00:38:45.086Z"
}
```

### 5. Update file by ID

- **URL:** `/files/:id`
- **Method:** `PATCH`
- **Response:** Update file name by ID.

### Request Example:

```json
{
  "newName": "new-name"
}
```

### Success Response:

```json
{
  "id": 2,
  "googleId": "xyz456",
  "fileUrl": "https://drive.google.com/file/d/xyz456/view",
  "fileName": "new-name",
  "createdAt": "2025-03-14T00:38:45.086Z"
}
```

### 6. Get auth URL

- **URL:** `/google/auth`
- **Method:** `GET`
- **Response:** Get url for open google auth window.

### Success Response:

```json
https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&include_granted_scopes=true&response_type=code&client_id=3&redirect_uri=httpcallback
```
