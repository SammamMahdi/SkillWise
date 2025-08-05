# Live Development Guide

## Overview
SkillWise is configured with live development tools for both frontend and backend:

- **Frontend**: Vite with Hot Module Replacement (HMR)
- **Backend**: Nodemon with file watching and auto-restart
- **Full Stack**: Concurrently running both servers simultaneously

## Quick Start

### Start Both Servers (Recommended)
```bash
npm run dev
```
This starts both frontend (Vite) and backend (Nodemon) servers concurrently.

### Start Individual Servers

#### Frontend Only (Vite)
```bash
npm run dev:client
# or
cd client && npm run dev
```
- **URL**: https://localhost:5173
- **Features**: Hot Module Replacement, instant updates
- **Watches**: All React components, CSS, JS files

#### Backend Only (Nodemon)
```bash
npm run dev:server
# or
cd server && npm run dev
```
- **URL**: http://localhost:5000
- **Features**: Auto-restart on file changes
- **Watches**: All server files (routes, controllers, models, etc.)

## Live Development Features

### Frontend (Vite)
- ✅ **Hot Module Replacement**: Instant updates without page refresh
- ✅ **CSS Hot Reload**: Style changes apply immediately
- ✅ **Fast Refresh**: React component updates preserve state
- ✅ **Error Overlay**: Clear error messages with stack traces
- ✅ **Source Maps**: Debug with original source code

### Backend (Nodemon)
- ✅ **File Watching**: Monitors all server files for changes
- ✅ **Auto Restart**: Server restarts automatically on file changes
- ✅ **Environment Variables**: Loads from `.env` file
- ✅ **Error Handling**: Graceful error recovery
- ✅ **Colored Output**: Easy-to-read console logs

## Nodemon Configuration

### Watched Files
- `server.js` - Main server file
- `routes/` - API route definitions
- `controllers/` - Route handler logic
- `models/` - Database schemas
- `middleware/` - Custom middleware
- `config/` - Configuration files

### Ignored Files
- `node_modules/` - Dependencies
- `*.test.js` - Test files
- `*.spec.js` - Test files
- `logs/` - Log files
- `uploads/` - Uploaded files

### File Extensions
- `.js` - JavaScript files
- `.json` - Configuration files

## Development Workflow

### 1. Start Development
```bash
npm run dev
```

### 2. Make Changes
- **Frontend**: Edit React components, CSS, or JS files
- **Backend**: Edit routes, controllers, models, or middleware

### 3. See Live Updates
- **Frontend**: Changes appear instantly in browser
- **Backend**: Server restarts automatically, API changes take effect

### 4. Debug
- **Frontend**: Use browser dev tools and Vite error overlay
- **Backend**: Check terminal for nodemon logs and errors

## Troubleshooting

### Port Conflicts
If you get "address already in use" errors:

```bash
# Find processes using ports
netstat -ano | findstr :5000
netstat -ano | findstr :5173

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Nodemon Not Restarting
1. Check if files are in watched directories
2. Verify file extensions are `.js` or `.json`
3. Check nodemon logs for errors
4. Restart nodemon manually: `Ctrl+C` then `npm run dev:server`

### Vite Not Updating
1. Check browser console for errors
2. Clear browser cache
3. Restart Vite: `Ctrl+C` then `npm run dev:client`

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://localhost:5173
```

### Frontend (Vite)
- Environment variables are automatically loaded from `.env` files
- Variables prefixed with `VITE_` are exposed to the client

## Performance Tips

### Backend
- Nodemon delay is set to 1000ms to prevent excessive restarts
- Only essential files are watched
- Test files are ignored to prevent unnecessary restarts

### Frontend
- Vite uses esbuild for fast compilation
- CSS is processed with PostCSS and Tailwind
- Hot Module Replacement preserves component state

## Production vs Development

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: Nodemon with auto-restart
- **Database**: Development MongoDB instance
- **Logging**: Verbose console output

### Production
- **Frontend**: Built static files served by backend
- **Backend**: Node.js without nodemon
- **Database**: Production MongoDB instance
- **Logging**: Structured logging to files

## Commands Reference

```bash
# Development
npm run dev              # Start both servers
npm run dev:client       # Start frontend only
npm run dev:server       # Start backend only

# Production
npm run build           # Build frontend for production
npm start              # Start production server

# Utilities
npm run install:all    # Install all dependencies
npm run lint           # Run ESLint
npm run test           # Run tests
```

## File Structure for Live Development

```
skillwise/
├── client/                 # Frontend (Vite)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── ...
│   └── package.json
├── server/                 # Backend (Nodemon)
│   ├── routes/            # API routes
│   ├── controllers/       # Route handlers
│   ├── models/            # Database models
│   ├── middleware/        # Custom middleware
│   ├── config/            # Configuration
│   ├── nodemon.json       # Nodemon config
│   └── package.json
└── package.json           # Root package.json
```

This setup provides a smooth development experience with instant feedback for both frontend and backend changes! 