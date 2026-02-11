# Scripts Directory

Development utility scripts for CeiVoice API.

## Available Scripts

### test-auth-quick-start.sh

Interactive guide to test authentication flows.

**Usage:**
```bash
bash scripts/test-auth-quick-start.sh
```

**What it does:**
- Walks you through starting the dev server
- Guides registration and login testing
- Tests protected routes with JWT tokens
- Tests token refresh functionality
- Links to detailed testing guide

**Prerequisites:**
- Backend running on `http://localhost:5000`
- `.env` file configured in `backend/`

---

## Running Scripts

Make scripts executable (optional):
```bash
chmod +x scripts/*.sh
```

Then run directly:
```bash
./scripts/test-auth-quick-start.sh
```

Or use bash:
```bash
bash scripts/test-auth-quick-start.sh
```

---

## Adding New Scripts

When adding new development scripts:
1. Place them in this `scripts/` directory
2. Use descriptive kebab-case names (e.g., `script-name.sh`)
3. Add documentation here with usage and prerequisites
4. Include shebang line: `#!/bin/bash`
5. Use `set -e` to exit on errors
