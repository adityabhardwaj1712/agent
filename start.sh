#!/bin/bash

# AgentCloud Startup Script
# This script starts all services and verifies they're working

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Check if .env exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found!"
        print_info "Creating .env template..."
        
        cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://agentcloud:agentcloud@localhost:5432/agentcloud
POSTGRES_USER=agentcloud
POSTGRES_PASSWORD=agentcloud
POSTGRES_DB=agentcloud

# Redis
REDIS_URL=redis://localhost:6379/0

# API
API_HOST=0.0.0.0
API_PORT=8000

# Security (CHANGE THESE IN PRODUCTION!)
JWT_SECRET_KEY=change-this-to-a-random-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# LLM API Keys - ADD YOUR KEYS HERE!
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
GOOGLE_API_KEY=your-google-key-here

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Logging
LOG_LEVEL=INFO
EOF
        
        print_success "Created .env file"
        print_warning "⚠️  IMPORTANT: Edit .env and add your API keys before continuing!"
        read -p "Press Enter after editing .env file..."
    else
        print_success ".env file found"
    fi
}

# Start Docker services
start_docker() {
    print_header "Starting Docker Services"
    
    print_info "Starting DB and Redis..."
    docker-compose up -d db redis
    
    print_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check if db is ready
    if docker exec agent-db-1 pg_isready -U postgres > /dev/null 2>&1; then
        print_success "PostgreSQL is ready"
    else
        print_error "PostgreSQL is not ready"
        exit 1
    fi
    
    # Check if redis is ready
    if docker exec agent-redis-1 redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is ready"
    else
        print_error "Redis is not ready"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    if [ -f "alembic.ini" ]; then
        print_info "Running Alembic migrations..."
        alembic upgrade head
        print_success "Migrations completed"
    else
        print_warning "alembic.ini not found - skipping migrations"
    fi
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    # Python dependencies
    if [ -f "requirements.txt" ]; then
        print_info "Installing Python packages..."
        pip install -r requirements.txt --break-system-packages > /dev/null 2>&1
        print_success "Python packages installed"
    fi
    
    # Frontend dependencies
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_info "Installing Node packages..."
        cd frontend
        npm install > /dev/null 2>&1
        cd ..
        print_success "Node packages installed"
    fi
}

# Start backend
start_backend() {
    print_header "Starting Backend API"
    
    print_info "Starting FastAPI server on http://localhost:8000"
    
    # Kill any existing process on port 8000
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    
    # Start backend in background
    cd app 2>/dev/null || cd .
    nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    
    print_info "Waiting for backend to start..."
    sleep 5
    
    # Check if backend is running
    if curl -s http://localhost:8000/ > /dev/null 2>&1; then
        print_success "Backend is running (PID: $BACKEND_PID)"
        print_success "API Docs: http://localhost:8000/docs"
    else
        print_error "Backend failed to start"
        print_info "Check backend.log for errors"
        exit 1
    fi
    
    cd - > /dev/null
}

# Start frontend
start_frontend() {
    print_header "Starting Frontend"
    
    if [ ! -d "frontend" ]; then
        print_warning "Frontend directory not found - skipping"
        return
    fi
    
    print_info "Starting Next.js dev server on http://localhost:3000"
    
    # Kill any existing process on port 3000
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    
    cd frontend
    nohup npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    cd ..
    
    print_info "Waiting for frontend to compile..."
    sleep 15
    
    # Check if frontend is running
    if curl -s http://localhost:3000/ > /dev/null 2>&1; then
        print_success "Frontend is running (PID: $FRONTEND_PID)"
        print_success "Frontend: http://localhost:3000"
    else
        print_warning "Frontend may still be starting..."
        print_info "Check frontend.log for errors"
    fi
}

# Run quick verification
verify_services() {
    print_header "Verifying Services"
    
    # Check API
    print_info "Checking API health..."
    if curl -s http://localhost:8000/ | grep -q "running"; then
        print_success "API health check passed"
    else
        print_error "API health check failed"
    fi
    
    # Check database
    print_info "Checking database connection..."
    if docker exec agentcloud-postgres psql -U agentcloud -d agentcloud -c "SELECT 1" > /dev/null 2>&1; then
        print_success "Database connection OK"
    else
        print_error "Database connection failed"
    fi
    
    # Check Redis
    print_info "Checking Redis connection..."
    if docker exec agentcloud-redis redis-cli ping | grep -q "PONG"; then
        print_success "Redis connection OK"
    else
        print_error "Redis connection failed"
    fi
}

# Print final summary
print_summary() {
    print_header "🎉 AgentCloud is Running!"
    
    echo ""
    echo "Services:"
    echo "  • Backend API:  http://localhost:8000"
    echo "  • API Docs:     http://localhost:8000/docs"
    echo "  • Frontend:     http://localhost:3000"
    echo "  • PostgreSQL:   localhost:5432"
    echo "  • Redis:        localhost:6379"
    echo ""
    
    echo "Logs:"
    echo "  • Backend:  tail -f backend.log"
    echo "  • Frontend: tail -f frontend.log"
    echo "  • Docker:   docker-compose logs -f"
    echo ""
    
    echo "Stop Services:"
    echo "  • Backend:  kill \$(cat backend.pid)"
    echo "  • Frontend: kill \$(cat frontend.pid)"
    echo "  • Docker:   docker-compose down"
    echo "  • All:      ./stop.sh"
    echo ""
    
    echo "Next Steps:"
    echo "  1. Visit http://localhost:3000 to use the platform"
    echo "  2. Check http://localhost:8000/docs for API documentation"
    echo "  3. Run 'python3 run_all_tests.py' to verify everything"
    echo ""
}

# Stop script
create_stop_script() {
    cat > stop.sh << 'EOF'
#!/bin/bash
echo "Stopping AgentCloud services..."

# Stop backend
if [ -f backend.pid ]; then
    kill $(cat backend.pid) 2>/dev/null && echo "✓ Backend stopped"
    rm backend.pid
fi

# Stop frontend
if [ -f frontend.pid ]; then
    kill $(cat frontend.pid) 2>/dev/null && echo "✓ Frontend stopped"
    rm frontend.pid
fi

# Stop Docker services
docker-compose down && echo "✓ Docker services stopped"

echo "All services stopped"
EOF
    chmod +x stop.sh
}

# Main execution
main() {
    print_header "AgentCloud Startup Script"
    
    echo "This script will:"
    echo "  1. Check environment configuration"
    echo "  2. Start Docker services (PostgreSQL, Redis)"
    echo "  3. Run database migrations"
    echo "  4. Install dependencies"
    echo "  5. Start backend API"
    echo "  6. Start frontend"
    echo "  7. Verify everything is working"
    echo ""
    
    read -p "Press Enter to continue or Ctrl+C to cancel..."
    
    # Run all steps
    check_env
    start_docker
    run_migrations
    install_dependencies
    start_backend
    start_frontend
    verify_services
    create_stop_script
    print_summary
}

# Run main function
main
