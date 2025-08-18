# SkillWise

A comprehensive learning platform with multiple modules.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure environment:**
   - Copy `server/.env.example` to `server/.env`
   - Copy `client/.env.example` to `client/.env`
   - Edit the `.env` files with your configuration

3. **Start development servers:**
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run dev:client` - Start only the client development server
- `npm run dev:server` - Start only the server development server
- `npm run build` - Build the client for production
- `npm run install:all` - Install dependencies for root, client, and server

## Structure

- `client/` - React frontend application
- `server/` - Node.js/Express backend API
- Environment configuration via `.env` files in each directory
