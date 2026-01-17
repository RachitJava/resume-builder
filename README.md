# Resume Builder

A minimal full-stack resume builder application with custom templates and PDF export.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Spring Boot REST API
- **Database:** H2 (file-based)

## Features

- ✅ Create, update, and delete resumes
- ✅ Real-time preview while editing
- ✅ 3 professional templates (Modern, Classic, Minimal)
- ✅ Export resume as PDF
- ✅ Persistent storage with H2 database
- ✅ Responsive design

## Project Structure

```
resume-builder/
├── backend/                    # Spring Boot API
│   ├── src/main/java/com/resumebuilder/
│   │   ├── config/            # CORS configuration
│   │   ├── controller/        # REST controllers
│   │   ├── dto/               # Data transfer objects
│   │   ├── entity/            # JPA entities
│   │   ├── exception/         # Global exception handler
│   │   ├── repository/        # JPA repositories
│   │   └── service/           # Business logic & PDF generation
│   └── pom.xml
│
└── frontend/                   # React + Vite app
    ├── src/
    │   ├── api/               # API client
    │   ├── components/        # Reusable components
    │   └── pages/             # Page components
    ├── package.json
    └── vite.config.js
```

## Quick Start

### Prerequisites

- Java 17+
- Node.js 18+
- Maven 3.6+

### Backend Setup

```bash
cd resume-builder/backend

# Install dependencies and run
./mvnw spring-boot:run
```

The API will start at `http://localhost:8080`

### Frontend Setup

```bash
cd resume-builder/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resumes` | Get all resumes |
| GET | `/api/resumes/{id}` | Get resume by ID |
| POST | `/api/resumes` | Create new resume |
| PUT | `/api/resumes/{id}` | Update resume |
| DELETE | `/api/resumes/{id}` | Delete resume |
| GET | `/api/resumes/{id}/pdf?template=` | Export resume as PDF |

## Templates

1. **Modern** - Clean, professional design with blue accents
2. **Classic** - Traditional serif font layout with borders
3. **Minimal** - Ultra-clean design with minimal styling

## Resume Sections

- Personal Information (name, contact, links)
- Professional Summary
- Work Experience
- Education
- Skills
- Projects
- Certifications

## H2 Console

Access the H2 database console at `http://localhost:8080/h2-console`

- JDBC URL: `jdbc:h2:file:./data/resumedb`
- Username: `sa`
- Password: (empty)

## License

MIT

