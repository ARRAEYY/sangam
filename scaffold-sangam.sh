#!/bin/bash

# Define the root directory
ROOT_DIR="Sangam"

echo "Creating root directory: $ROOT_DIR"
mkdir -p "$ROOT_DIR"
cd "$ROOT_DIR" || exit

echo "Initializing npm workspace..."
npm init -y > /dev/null
npm pkg set private=true
npm pkg set workspaces.0="apps/*"
npm pkg set workspaces.1="packages/*"

echo "Creating backend structure..."
mkdir -p apps/backend/src/data
mkdir -p apps/backend/src/lib
mkdir -p apps/backend/src/middleware
# Using generic, robust feature modules inspired by Nosh's architecture
mkdir -p apps/backend/src/modules/{admin,auth,users,core,settings,notifications}
mkdir -p apps/backend/src/utils
mkdir -p apps/backend/tests

# Add placeholder files for backend
touch apps/backend/src/data/.gitkeep
touch apps/backend/src/lib/.gitkeep
touch apps/backend/src/middleware/.gitkeep
touch apps/backend/src/modules/admin/.gitkeep
touch apps/backend/src/modules/auth/.gitkeep
touch apps/backend/src/modules/users/.gitkeep
touch apps/backend/src/modules/core/.gitkeep
touch apps/backend/src/modules/settings/.gitkeep
touch apps/backend/src/modules/notifications/.gitkeep
touch apps/backend/src/utils/.gitkeep
touch apps/backend/tests/.gitkeep

# Initialize backend package.json
cd apps/backend && npm init -y > /dev/null && cd ../..

echo "Creating frontend structure..."
mkdir -p apps/frontend/public
mkdir -p apps/frontend/src/assets
mkdir -p apps/frontend/src/components/{admin,auth,layout,notifications,dashboard,settings,ui}
mkdir -p apps/frontend/src/context
mkdir -p apps/frontend/src/data
mkdir -p apps/frontend/src/hooks
mkdir -p apps/frontend/src/lib
mkdir -p apps/frontend/src/pages/{admin,dashboard}
mkdir -p apps/frontend/src/services
mkdir -p apps/frontend/src/styles
mkdir -p apps/frontend/src/utils

# Add placeholder files for frontend
touch apps/frontend/public/.gitkeep
touch apps/frontend/src/assets/.gitkeep
touch apps/frontend/src/components/admin/.gitkeep
touch apps/frontend/src/components/auth/.gitkeep
touch apps/frontend/src/components/layout/.gitkeep
touch apps/frontend/src/components/notifications/.gitkeep
touch apps/frontend/src/components/dashboard/.gitkeep
touch apps/frontend/src/components/settings/.gitkeep
touch apps/frontend/src/components/ui/.gitkeep
touch apps/frontend/src/context/.gitkeep
touch apps/frontend/src/data/.gitkeep
touch apps/frontend/src/hooks/.gitkeep
touch apps/frontend/src/lib/.gitkeep
touch apps/frontend/src/pages/admin/.gitkeep
touch apps/frontend/src/pages/dashboard/.gitkeep
touch apps/frontend/src/services/.gitkeep
touch apps/frontend/src/styles/.gitkeep
touch apps/frontend/src/utils/.gitkeep

# Initialize frontend package.json
cd apps/frontend && npm init -y > /dev/null && cd ../..

echo "Creating docs structure..."
mkdir -p docs/{api,phases}
touch docs/api/.gitkeep
touch docs/phases/.gitkeep

echo "Creating packages structure..."
mkdir -p packages/types/src
mkdir -p packages/ui/src
mkdir -p packages/validation/src

# Initialize packages
cd packages/types && npm init -y > /dev/null && cd ../..
cd packages/ui && npm init -y > /dev/null && cd ../..
cd packages/validation && npm init -y > /dev/null && cd ../..

# Add placeholder files for packages
touch packages/types/src/index.ts
touch packages/ui/src/index.ts
touch packages/validation/src/index.ts

echo "Creating prisma structure..."
mkdir -p prisma
touch prisma/schema.prisma

echo "✅ Sangam monorepo scaffolded successfully!"
