# Documentation

This directory contains comprehensive documentation for the CeiVoice API project.

# Documentation

This directory contains comprehensive documentation for the CeiVoice API project.

## Quick Navigation

### Getting Started
- [Root README](../README.md) - Project overview
- [Getting Started](setup/GETTING_STARTED.md) - Quick start guide
- [Setup and Installation](setup/SETUP_AND_INSTALLATION.md) - Complete setup guide
- [Database Migration](setup/DATABASE_MIGRATION_GUIDE.md) - Database setup

### API and Implementation
- [API Reference](api/README.md) - Complete API endpoint documentation
- [Postman Collection Guide](api/POSTMAN_COLLECTION_GUIDE.md) - API testing with Postman
- [Implementation Details](IMPLEMENTATION_DETAILS.md) - Technical architecture
- [Quick Reference](QUICK_REFERENCE.md) - Auth quick reference

### Deployment
- [Docker Guide](deployment/DOCKER.md) - Docker deployment instructions

### Database
- [Prisma Schema](../backend/prisma/README.md) - Database schema and testing

### Project Information
- [Changelog](CHANGELOG.md) - Version history and updates
- [Status](STATUS.md) - Current project status

### Testing and Development
- [Testing Guide](testing/AUTH_TESTING_GUIDE.md) - Authentication testing

## Documentation Structure

```
docs/
├── README.md                       # This file - Documentation index
├── setup/
│   ├── GETTING_STARTED.md          # Quick start guide
│   ├── SETUP_AND_INSTALLATION.md   # Complete setup instructions
│   └── DATABASE_MIGRATION_GUIDE.md # Database migration guide
├── api/
│   ├── README.md                   # API endpoint documentation
│   └── POSTMAN_COLLECTION_GUIDE.md # Postman testing guide
├── deployment/
│   └── DOCKER.md                   # Docker deployment guide
├── testing/
│   └── AUTH_TESTING_GUIDE.md       # Authentication testing
├── IMPLEMENTATION_DETAILS.md       # Technical architecture
├── QUICK_REFERENCE.md              # Quick command reference
├── CHANGELOG.md                    # Version history
└── STATUS.md                       # Project status
```

## For Developers

Start here based on your needs:

1. **New to the project?** Start with [Getting Started](setup/GETTING_STARTED.md)
2. **Complete setup?** Follow [Setup and Installation](setup/SETUP_AND_INSTALLATION.md)
3. **Database setup?** Read [Database Migration](setup/DATABASE_MIGRATION_GUIDE.md)
4. **API endpoints?** Check [API Reference](api/README.md)
5. **Testing APIs?** Use [Postman Collection](api/POSTMAN_COLLECTION_GUIDE.md)
6. **Architecture details?** See [Implementation Details](IMPLEMENTATION_DETAILS.md)
7. **Quick auth commands?** Use [Quick Reference](QUICK_REFERENCE.md)
8. **Deployment?** Follow [Docker Guide](deployment/DOCKER.md)

## Key Features

- Comprehensive authentication system (Email/Password, Google OAuth)
- RESTful API with 25+ endpoints
- PostgreSQL database with Prisma ORM
- Email notification system with Resend and React Email
- Asynchronous message queue processing with RabbitMQ
- Role-based access control
- Complete test coverage documentation

## Latest Updates

See [Changelog](CHANGELOG.md) for the latest updates and version history.

For current project status, see [Status](STATUS.md).
