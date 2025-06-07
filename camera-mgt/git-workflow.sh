#!/bin/bash

# Git workflow script for check-in and check-out
# Usage: ./git-workflow.sh [checkin|checkout] [message]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository!"
        exit 1
    fi
}

# Function to check out latest code
checkout_code() {
    print_status "Starting checkout process..."
    
    # Fetch latest changes
    print_status "Fetching latest changes from remote..."
    git fetch --all
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes. Please commit or stash them first."
        echo "Options:"
        echo "  1) Stash changes and continue"
        echo "  2) Cancel checkout"
        read -p "Choose (1/2): " choice
        
        case $choice in
            1)
                print_status "Stashing changes..."
                git stash push -m "Auto-stash before checkout $(date)"
                ;;
            2)
                print_error "Checkout cancelled."
                exit 1
                ;;
            *)
                print_error "Invalid choice. Cancelling."
                exit 1
                ;;
        esac
    fi
    
    # Pull latest changes
    print_status "Pulling latest changes..."
    git pull --rebase
    
    print_status "Checkout complete! You're now up-to-date with the remote repository."
}

# Function to check in code
checkin_code() {
    local message="$1"
    
    if [ -z "$message" ]; then
        print_error "Commit message is required for check-in!"
        echo "Usage: $0 checkin \"Your commit message\""
        exit 1
    fi
    
    print_status "Starting check-in process..."
    
    # Show current status
    print_status "Current git status:"
    git status --short
    
    # Check if there are changes to commit
    if git diff-index --quiet HEAD -- && [ -z "$(git ls-files --others --exclude-standard)" ]; then
        print_warning "No changes to commit."
        exit 0
    fi
    
    # Add all changes
    echo -e "\nChanges to be committed:"
    git add -A
    git status --short
    
    echo -e "\nDo you want to commit these changes? (y/n)"
    read -p "> " confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        print_error "Check-in cancelled."
        git reset
        exit 1
    fi
    
    # Commit changes
    print_status "Committing changes..."
    git commit -m "$message"
    
    # Push to remote
    print_status "Pushing to remote repository..."
    git push
    
    print_status "Check-in complete! Your changes have been pushed to the remote repository."
}

# Main script
main() {
    check_git_repo
    
    case "$1" in
        "checkin"|"ci")
            checkin_code "$2"
            ;;
        "checkout"|"co")
            checkout_code
            ;;
        *)
            echo "Git Workflow Script"
            echo "==================="
            echo ""
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  checkin, ci    Check in (commit and push) your changes"
            echo "  checkout, co   Check out (pull) latest changes from remote"
            echo ""
            echo "Examples:"
            echo "  $0 checkin \"Fix bug in camera service\""
            echo "  $0 checkout"
            echo ""
            exit 1
            ;;
    esac
}

# Run main function
main "$@"