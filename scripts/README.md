# Scripts

Utility scripts for monorepo setup, maintenance, and development workflows.

## Overview

This directory contains shell scripts for:

- **Environment setup** - Initial monorepo configuration
- **Dependency management** - Installing and updating packages
- **Shell utilities** - Common terminal operations
- **Database operations** - SQL utilities and queries

## Quick Start

### Initial Setup

Run the main setup script to configure your development environment:

```bash
./scripts/setup.sh
```

This runs the following in sequence:

1. `software.sh` - Installs required software (Homebrew, pnpm, nvm)
2. `environment.sh` - Configures environment variables
3. `dependencies.sh` - Installs npm dependencies

## Core Scripts

### setup.sh

**Purpose:** Complete monorepo setup in one command

**Usage:**

```bash
./scripts/setup.sh
```

**What it does:**

- Validates monorepo root directory
- Sources utilities for common functions
- Installs required software (Homebrew, pnpm, nvm)
- Configures environment from `.env`
- Installs all npm dependencies

**Prerequisites:**

- Must be run from monorepo root directory
- Requires `.env` file with environment variables

### software.sh

**Purpose:** Install and update required development tools

**Usage:**

```bash
./scripts/software.sh
```

**Checks/Installs:**

- **Homebrew** - Package manager for macOS/Linux
- **pnpm** - Fast, disk space efficient package manager
- **nvm** - Node Version Manager

**Behavior:**

- Skips installation if tool already exists
- Checks for updates and prompts to upgrade
- Exits with error if Homebrew is missing

### dependencies.sh

**Purpose:** Install npm dependencies across the monorepo

**Usage:**

```bash
./scripts/dependencies.sh
```

**What it does:**

- Runs `pnpm install` in monorepo root
- Installs dependencies for all workspace packages
- Respects `pnpm-lock.yaml` for reproducible builds

### environment.sh

**Purpose:** Configure environment variables and shell settings

**Usage:**

```bash
./scripts/environment.sh
```

**What it does:**

- Sources `.env` file
- Exports environment variables
- Configures shell environment for development

### check-lockfile.sh

**Purpose:** Validate `pnpm-lock.yaml` is in sync with `package.json` files

**Usage:**

```bash
./scripts/check-lockfile.sh
```

**Use cases:**

- Pre-commit hook (automatically run by Husky)
- CI/CD validation
- Manual verification

**Output:**

- ✅ Success: Lockfile is in sync
- ❌ Error: Lockfile is out of sync (suggests running `pnpm install`)

**Exit codes:**

- `0` - Lockfile is valid
- `1` - Lockfile is out of sync

### sync-extensions.ts

**Purpose:** Sync VS Code extensions between `.vscode/extensions.json` and `.devcontainer/devcontainer.json`

**Usage:**

```bash
# Via Nx (recommended)
nx run monorepo:sync-extensions:check    # Validate (default)
nx run monorepo:sync-extensions:write    # Update devcontainer.json

# Direct
tsx scripts/sync-extensions.ts [check|write]
```

**Use cases:**

- Pre-commit hook (auto-runs when `.vscode/extensions.json` is staged)
- Manual sync after adding extensions

**Exit codes:**

- `0` - In sync or successfully synced
- `1` - Out of sync (check mode) or failed

### utilities.sh

**Purpose:** Common utilities and helper functions

**Usage:**

```bash
source ./scripts/utilities.sh
```

**Functions:**

#### `get_git_commit_hash()`

Returns the first 7 characters of the current git commit hash.

```bash
commit=$(get_git_commit_hash)
echo "Commit: $commit"
# Output: Commit: abc1234
```

#### `get_utc_timestamp()`

Returns the current UTC timestamp in `YYYYMMDD-HHMMSS` format.

```bash
timestamp=$(get_utc_timestamp)
echo "Timestamp: $timestamp"
# Output: Timestamp: 20240125-143022
```

**Automatic behaviors:**

- Validates monorepo root directory
- Exits immediately on error (`set -e`)
- Sources `.env` environment variables
- Makes all `.sh` files executable

## Shell Utilities

### shell/grep.sh

**Purpose:** Advanced grep with multi-casing support

**Usage:**

```bash
./scripts/shell/grep.sh <query> [grep_options] [file...]
```

**Function: `grep_all_cases`**

Searches for a term in all possible casings and spacings:

- camelCase: `myVariableName`
- PascalCase: `MyVariableName`
- snake_case: `my_variable_name`
- kebab-case: `my-variable-name`
- space-separated: `my variable name`

**Examples:**

Search for "my variable name" in all casings:

```bash
./scripts/shell/grep.sh "myVariableName" src/
# Matches: myVariableName, my_variable_name, my-variable-name, etc.
```

Search with grep options:

```bash
./scripts/shell/grep.sh "variable" -r -n src/
# -r: recursive
# -n: show line numbers
```

**Standard grep usage:**

```bash
# Case insensitive
grep -i "word" file.txt

# Whole word search
grep -w "word" file.txt

# Recursive search
grep -r "word" .

# Count matches
grep -c "word" file.txt

# Find files with matches
grep -l "word" *

# Invert match (non-matching lines)
grep -v "word" file.txt

# With pipes
ps aux | grep "nginx"
ls -l | grep ".txt"
```

### shell/killport.sh

**Purpose:** Kill processes running on a specific port

**Usage:**

```bash
source ./scripts/shell/killport.sh
killport <port_number>
```

**Function: `killport(port)`**

Finds and kills all processes listening on the specified port.

**Examples:**

Kill process on port 3000:

```bash
source ./scripts/shell/killport.sh
killport 3000
```

**Output:**

- If no processes: `👍 No processes found running on port 3000`
- If processes found: Shows process name and PID, then kills them

**Use cases:**

- Free up port for development server
- Clean up orphaned processes
- Force restart of services

### shell/netstat.sh

**Purpose:** Network statistics and connection monitoring

**Usage:**

```bash
./scripts/shell/netstat.sh [options]
```

See script for specific netstat usage patterns.

### shell/sed.sh

**Purpose:** Stream editor for text transformation

**Usage:**

```bash
./scripts/shell/sed.sh [options]
```

See script for specific sed usage patterns and examples.

## Database Scripts

### database/notepad.sql

**Purpose:** SQL queries and database utilities for notepad/notes functionality

**Location:** `scripts/database/notepad.sql`

**Usage:**

```bash
# Run SQL file
psql -U username -d database -f scripts/database/notepad.sql

# Or copy queries into database client
```

See file for specific SQL queries and documentation.

## Best Practices

### Script Execution

**Always run from monorepo root:**

```bash
# ✅ Correct
cd ~/Personal/monorepo
./scripts/setup.sh

# ❌ Wrong
cd scripts
./setup.sh
```

**Make scripts executable:**

```bash
chmod +x scripts/**/*.sh
```

Or use the utilities.sh automatic behavior (makes all `.sh` files executable).

### Sourcing vs Executing

**Execute scripts** (standalone):

```bash
./scripts/setup.sh
```

**Source scripts** (use functions in current shell):

```bash
source ./scripts/utilities.sh
commit=$(get_git_commit_hash)
```

### Error Handling

Scripts use `set -e` to exit on error. Handle errors explicitly:

```bash
#!/bin/bash
set -e  # Exit on error

# This will stop execution if command fails
pnpm install

# Continue execution even if command fails
pnpm test || echo "⚠️ Tests failed but continuing..."
```

### Environment Variables

Load environment variables before using them:

```bash
# Load from .env
source ./scripts/utilities.sh  # Automatically sources .env

# Or manually
set -a
source .env
set +a
```

## Common Tasks

### Fresh Install

Complete monorepo setup from scratch:

```bash
# 1. Clone repository
git clone https://github.com/JimmyPaolini/monorepo.git
cd monorepo

# 2. Create .env file
cp .env.example .env
# Edit .env with your values

# 3. Run setup
./scripts/setup.sh
```

### Update Dependencies

Update npm packages:

```bash
# Update all dependencies
pnpm update

# Or run dependencies script
./scripts/dependencies.sh
```

### Clean Install

Remove node_modules and reinstall:

```bash
# Remove all node_modules
pnpm clean

# Reinstall
./scripts/dependencies.sh
```

### Validate Lockfile

Check if lockfile needs updating:

```bash
./scripts/check-lockfile.sh
```

If out of sync:

```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "chore(dependencies): update lockfile"
```

### Kill Development Servers

Free up ports for development:

```bash
source ./scripts/shell/killport.sh

# Kill common development ports
killport 3000  # React dev server
killport 5173  # Vite dev server
killport 54321 # Supabase local API
killport 54322 # Supabase local PostgreSQL
killport 54323 # Supabase Studio
```

### Search Across Codebase

Find code in all casings:

```bash
# Search for variable in all naming conventions
./scripts/shell/grep.sh "userName" -r src/

# Matches:
# - userName
# - user_name
# - user-name
# - UserName
# - user name
```

## Troubleshooting

### "Permission denied" errors

Make scripts executable:

```bash
chmod +x scripts/**/*.sh
```

Or source utilities which does this automatically:

```bash
source ./scripts/utilities.sh
```

### "Must be run from monorepo root" error

Change to monorepo root directory:

```bash
cd ~/Personal/monorepo
```

Verify you're in the right place:

```bash
pwd
# Should output: .../Personal/monorepo

ls package.json
# Should exist
```

### Environment variables not loading

Ensure `.env` file exists:

```bash
ls -la .env
```

Create from example if missing:

```bash
cp .env.example .env
```

Source utilities to load environment:

```bash
source ./scripts/utilities.sh
```

### pnpm not found

Install via Homebrew:

```bash
brew install pnpm
```

Or run software setup:

```bash
./scripts/software.sh
```

### Lockfile out of sync

Update lockfile:

```bash
pnpm install
```

Verify sync:

```bash
./scripts/check-lockfile.sh
```

## Contributing

### Adding New Scripts

1. Create script in appropriate directory:
   - Core scripts: `scripts/`
   - Shell utilities: `scripts/shell/`
   - Database queries: `scripts/database/`

2. Add shebang and description:

   ```bash
   #!/bin/bash
   #
   # Script description here
   #
   ```

3. Make executable:

   ```bash
   chmod +x scripts/your-script.sh
   ```

4. Document in this README

5. Test thoroughly:

   ```bash
   # Test from monorepo root
   ./scripts/your-script.sh

   # Test with various inputs
   ./scripts/your-script.sh arg1 arg2
   ```

### Script Conventions

**File naming:**

- Use kebab-case: `check-lockfile.sh`
- Add `.sh` extension
- Descriptive names

**Code style:**

- Use `#!/bin/bash` shebang
- Add `set -e` for error handling
- Include usage comments
- Validate inputs
- Provide helpful error messages
- Use emoji for visual feedback (✅ ❌ 🔍 📦)

**Testing:**

- Test happy path
- Test error conditions
- Test from monorepo root
- Test with missing dependencies

## Related Documentation

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [scripts/utilities.sh](./utilities.sh) - Common utility functions
- [.github/workflows/](../.github/workflows/) - CI/CD workflows using these scripts

## See Also

- [Homebrew Documentation](https://docs.brew.sh/)
- [pnpm Documentation](https://pnpm.io/)
- [Bash Scripting Guide](https://www.gnu.org/software/bash/manual/)
