#!/bin/bash

# Component Generator - Quick Start Script
# This script helps you test the component generator

set -e

echo "🚀 Component Generator - Quick Start"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "nx.json" ]; then
    echo "❌ Error: Please run this script from the monorepo root"
    exit 1
fi

# Step 1: Build the generator
echo "📦 Step 1: Building component generator..."
nx build component-generator || {
    echo "❌ Failed to build generator"
    exit 1
}
echo "✅ Generator built successfully"
echo ""

# Step 2: Show available options
echo "📋 Step 2: Generator Options"
echo "---"
echo "Component Name (required): e.g., Button, Card, FormInput"
echo "Directory (optional, default: src/components): e.g., src/components/ui"
echo "Export Strategy (optional, default: barrel): barrel or direct"
echo ""

# Step 3: Ask user for input
read -p "Enter component name (PascalCase): " COMPONENT_NAME

if [ -z "$COMPONENT_NAME" ]; then
    echo "❌ Component name cannot be empty"
    exit 1
fi

read -p "Enter directory (default: src/components): " DIRECTORY
DIRECTORY=${DIRECTORY:-src/components}

read -p "Use barrel export? (yes/no, default: yes): " USE_BARREL
USE_BARREL=${USE_BARREL:-yes}

if [ "$USE_BARREL" = "yes" ] || [ "$USE_BARREL" = "y" ]; then
    EXPORT_STRATEGY="barrel"
else
    EXPORT_STRATEGY="direct"
fi

# Step 4: Generate component
echo ""
echo "🎨 Step 3: Generating $COMPONENT_NAME..."
nx generate component-generator:component \
    --name="$COMPONENT_NAME" \
    --directory="$DIRECTORY" \
    --export="$EXPORT_STRATEGY" \
    || {
    echo "❌ Failed to generate component"
    exit 1
}

# Step 5: Show results
echo ""
echo "✅ Component generated successfully!"
echo ""
echo "📁 Generated files:"
echo "   $DIRECTORY/$COMPONENT_NAME/${COMPONENT_NAME}.tsx"
echo "   $DIRECTORY/$COMPONENT_NAME/${COMPONENT_NAME}.test.tsx"
if [ "$EXPORT_STRATEGY" = "barrel" ]; then
    echo "   $DIRECTORY/$COMPONENT_NAME/index.ts"
fi
echo ""

# Step 6: Next steps
echo "📝 Next Steps:"
echo "   1. Edit: $DIRECTORY/$COMPONENT_NAME/${COMPONENT_NAME}.tsx"
echo "      - Add props to the interface"
echo "      - Implement your component logic"
echo ""
echo "   2. Test: $DIRECTORY/$COMPONENT_NAME/${COMPONENT_NAME}.test.tsx"
echo "      - Add test cases for your component"
echo ""
echo "   3. Use:"
if [ "$EXPORT_STRATEGY" = "barrel" ]; then
    echo "      import { $COMPONENT_NAME } from '$DIRECTORY/$COMPONENT_NAME';"
else
    echo "      import { $COMPONENT_NAME } from '$DIRECTORY/$COMPONENT_NAME/${COMPONENT_NAME}';"
fi
echo ""
echo "   4. Run tests:"
echo "      nx test <project>"
echo ""

echo "🎉 Done! Happy coding!"
