# Setup Instructions

## ⚠️ Important: Node.js Version Requirement

This project requires **Node.js v20 or v22** due to compatibility issues with `better-sqlite3` and Node.js v23.

### Quick Setup

You're currently running Node.js v23.11.0. Please switch to Node.js v20 using one of these methods:

#### Option 1: Using nvm (Recommended)

```bash
# Load nvm
source ~/.nvm/nvm.sh

# Use the version specified in .nvmrc
nvm use

# If v20 is not installed, install it first
nvm install 20
nvm use 20
```

#### Option 2: Using Homebrew

```bash
# Install Node 20 via Homebrew
brew install node@20

# Link it
brew link node@20 --force --overwrite
```

#### Option 3: Download from nodejs.org

Visit https://nodejs.org/ and download Node.js v20 LTS.

### After Switching Node Versions

Once you're on Node.js v20 or v22, run:

```bash
# Verify Node version
node --version  # Should show v20.x.x or v22.x.x

# Install dependencies
npm install

# Start the application
npm run dev
```

The application will start on:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Troubleshooting

If you still encounter issues after switching Node versions:

1. **Clear node_modules and package-lock.json:**
   ```bash
   rm -rf node_modules package-lock.json
   rm -rf server/node_modules server/package-lock.json
   rm -rf client/node_modules client/package-lock.json
   rm -rf shared/node_modules shared/package-lock.json
   npm install
   ```

2. **Clear the database:**
   ```bash
   rm -rf database/*.db
   ```
   The database will be recreated automatically on the next run.

3. **Check nvm is properly loaded:**
   ```bash
   # Add to your ~/.zshrc or ~/.bashrc
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   ```

### Alternative: Use Docker (if Node version switching is problematic)

If you prefer not to change your system Node version, you can use Docker:

```bash
# Create a Dockerfile (example)
docker run -it --rm \
  -v $(pwd):/app \
  -w /app \
  -p 3000:3000 \
  -p 5000:5000 \
  node:20 \
  sh -c "npm install && npm run dev"
```

