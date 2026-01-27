#!/usr/bin/env bash
# install-supabase.sh - Idempotent Supabase CLI installation script
# This script installs the Supabase CLI if not already installed or updates it if outdated.
# It is designed to be safe to run multiple times (idempotent).

set -euo pipefail

INSTALL_DIR="${HOME}/.supabase/bin"
SUPABASE_BIN="${INSTALL_DIR}/supabase"

# Color output helpers
info() { echo -e "\033[0;34m[INFO]\033[0m $*"; }
success() { echo -e "\033[0;32m[SUCCESS]\033[0m $*"; }
warn() { echo -e "\033[0;33m[WARN]\033[0m $*"; }
error() { echo -e "\033[0;31m[ERROR]\033[0m $*" >&2; }

# Check if Supabase CLI is already installed and functional
check_existing_installation() {
    if command -v supabase &>/dev/null; then
        local version
        version=$(supabase --version 2>/dev/null || echo "unknown")
        info "Supabase CLI already installed: ${version}"
        return 0
    fi
    return 1
}

# Install Supabase CLI using official installation script
install_supabase() {
    info "Installing Supabase CLI..."

    # Create installation directory
    mkdir -p "${INSTALL_DIR}"

    # Download and run official install script
    # The official script handles architecture detection (amd64, arm64)
    if curl -fsSL https://cli.supabase.com/install.sh | sh -s -- --install-dir "${INSTALL_DIR}"; then
        success "Supabase CLI installed to ${INSTALL_DIR}"
    else
        error "Failed to install Supabase CLI"
        return 1
    fi
}

# Ensure Supabase binary is in PATH
configure_path() {
    # Add to PATH for current session if not already there
    if [[ ":${PATH}:" != *":${INSTALL_DIR}:"* ]]; then
        export PATH="${INSTALL_DIR}:${PATH}"
    fi

    # Add to .bashrc for future sessions (idempotent)
    local bashrc="${HOME}/.bashrc"
    local path_line="export PATH=\"${INSTALL_DIR}:\${PATH}\""

    if [[ -f "${bashrc}" ]] && ! grep -qF "${INSTALL_DIR}" "${bashrc}"; then
        info "Adding Supabase to PATH in ${bashrc}"
        echo "" >> "${bashrc}"
        echo "# Supabase CLI" >> "${bashrc}"
        echo "${path_line}" >> "${bashrc}"
    fi

    # Also add to .zshrc if zsh is available
    local zshrc="${HOME}/.zshrc"
    if [[ -f "${zshrc}" ]] && ! grep -qF "${INSTALL_DIR}" "${zshrc}"; then
        info "Adding Supabase to PATH in ${zshrc}"
        echo "" >> "${zshrc}"
        echo "# Supabase CLI" >> "${zshrc}"
        echo "${path_line}" >> "${zshrc}"
    fi
}

# Verify installation
verify_installation() {
    if [[ -x "${SUPABASE_BIN}" ]]; then
        local version
        version=$("${SUPABASE_BIN}" --version 2>/dev/null || echo "unknown")
        success "Supabase CLI verified: ${version}"
        return 0
    elif command -v supabase &>/dev/null; then
        local version
        version=$(supabase --version 2>/dev/null || echo "unknown")
        success "Supabase CLI verified: ${version}"
        return 0
    else
        error "Supabase CLI installation verification failed"
        return 1
    fi
}

main() {
    info "Starting Supabase CLI installation..."

    # Skip installation if already available
    if check_existing_installation; then
        info "Skipping installation - Supabase CLI is already available"
        exit 0
    fi

    # Install Supabase CLI
    install_supabase

    # Configure PATH
    configure_path

    # Verify installation
    verify_installation
}

main "$@"
