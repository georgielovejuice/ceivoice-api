# CeiVoice Complete API

A comprehensive ticket management and request handling system with AI-powered draft generation capabilities.

## Overview

CeiVoice Complete API is a backend service that processes user requests, generates AI-assisted ticket drafts, and manages ticket lifecycle with full audit trail capabilities.

## Project Structure

```
ceivoice-api/
├── backend/                           # TypeScript backend (primary)
│   ├── src/
│   │   ├── config/                    # Configuration files
│   │   ├── controllers/               # Request handlers
│   │   ├── middleware/                # Custom middleware
│   │   ├── models/                    # Data models
│   │   ├── routes/                    # API route definitions
│   │   ├── services/                  # Business logic services
│   │   ├── utils/                     # Utility functions
│   │   └── index.ts                   # Application entry point
│   ├── prisma/                        # Prisma ORM files
│   │   ├── schema.prisma              # Database schema definition
│   │   └── migrations/                # Database migration history
│   ├── tests/                         # Test files
│   ├── package.json                   # Dependencies and scripts
│   ├── tsconfig.json                  # TypeScript configuration
│   └── .env.example                   # Environment variables template
│
├── backend-expressjs/                 # Express.js implementation
│   ├── src/
│   │   ├── controllers/               # Request handlers
│   │   │   ├── requestController.js   # Request processing logic
│   │   │   └── ticketController.js    # Ticket management logic
│   │   ├── routes/                    # API route definitions
│   │   │   ├── requestRoutes.js       # Request endpoints
│   │   │   └── ticketRoutes.js        # Ticket endpoints
│   │   ├── services/                  # Business logic services
│   │   │   ├── draftService.js        # AI draft generation
│   │   │   ├── requestService.js      # Request processing
│   │   │   └── ticketService.js       # Ticket operations
│   │   ├── app.js                     # Express application setup
│   │   └── server.js                  # Server entry point
│   ├── prisma/                        # Database schema and migrations
│   │   ├── schema.prisma              # Prisma schema
│   │   └── migrations/                # Migration files
│   ├── package.json                   # Dependencies and scripts
│   └── .env.example                   # Environment variables template
│
├── docker/                            # Docker configuration
│   ├── Dockerfile                     # Docker image definition
│   ├── docker-compose.yml             # Development compose file
│   ├── docker-compose.prod.yml        # Production compose file
│   └── .dockerignore                  # Docker ignore patterns
│
├── docs/                              # Project documentation
│   ├── api/                           # API documentation
│   │   ├── requests.md                # Request endpoints docs
│   │   └── tickets.md                 # Ticket endpoints docs
│   ├── deployment/                    # Deployment guides
│   │   ├── docker.md                  # Docker deployment guide
│   │   └── production.md              # Production setup guide
│   ├── IMPLEMENTATION_DETAILS.md      # Technical implementation details
│   ├── QUICK_REFERENCE.md             # Quick reference guide
│   ├── CHANGELOG.md                   # Version history
│   └── STATUS.md                      # Project status
│
├── scripts/                           # Utility scripts
│   ├── seed.js                        # Database seeding script
│   ├── migrate.sh                     # Migration helper
│   └── test.sh                        # Test runner
│
├── postman/                           # API testing
│   └── CeiVoice-Complete-API.postman_collection.json
│
├── .gitignore                         # Git ignore patterns
├── .env.example                       # Root environment template
├── package.json                       # Root package configuration
├── pnpm-workspace.yaml                # PNPM workspace configuration
└── README.md                          # This file
```

## Features

- **Request Management**: Submit and process user requests via email and message
- **AI-Powered Drafting**: Automatic generation of ticket titles, summaries, and suggested solutions
- **Ticket Lifecycle**: Complete ticket status management with audit history
- **Status Tracking**: Full audit trail of status changes with user attribution
- **RESTful API**: Clean and structured API endpoints

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database ORM**: Prisma
- **API Testing**: Postman (collection included)
- **Containerization**: Docker & Docker Compose

## API Endpoints

### Requests
- `POST /api/requests` - Submit a new request

### Tickets
- `POST /api/tickets/:id/status` - Update ticket status

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- pnpm (recommended) or npm
- Docker and Docker Compose (optional)

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend-expressjs
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

5. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

6. Start the development server:
   ```bash
   pnpm dev
   ```

The server will start on port 5000 (configurable via PORT environment variable).

### Docker Deployment

For production deployment using Docker:

```bash
docker-compose -f docker/docker-compose.prod.yml up -d
```

## Testing

Import the included Postman collection (`CeiVoice-Complete-API.postman_collection.json`) to test all available endpoints.

## Documentation

Additional documentation is available in the `docs/` directory:

- [Implementation Details](docs/IMPLEMENTATION_DETAILS.md)
- [Quick Reference](docs/QUICK_REFERENCE.md)
- [API Documentation](docs/api/)
- [Deployment Guide](docs/deployment/)
- [Changelog](docs/CHANGELOG.md)
- [Status](docs/STATUS.md)

## Database Schema

The application uses Prisma ORM with the following main models:

- **Request**: Raw user requests with email and message
- **Ticket**: Generated tickets with AI-drafted content
- **TicketRequest**: Links requests to their corresponding tickets
- **StatusHistory**: Audit trail for ticket status changes

## Environment Variables

Configure the following variables in your `.env` file:

- `PORT`: Server port (default: 5000)
- `DATABASE_URL`: Prisma database connection string
- Additional variables as specified in `.env.example`

## License

Internal use only.

## Support

For questions or issues, please refer to the documentation or contact the development team.
```