# SkillWise Project Setup Guide

## 🚀 Quick Start

Follow these steps to get your SkillWise project up and running:

### 1. Install Dependencies

```bash
# Install all dependencies (root, client, and server)
npm run install:all
```

### 2. Environment Setup

1. Copy the environment template:
```bash
cp env.example .env
```

2. Edit `.env` file with your configuration:
   - Set your MongoDB URI (local or Atlas)
   - Generate a strong JWT secret
   - Add any API keys you'll need

### 3. Start Development Servers

```bash
# Start both client and server concurrently
npm run dev
```

This will start:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## 📁 Project Structure

```
SkillWise/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   ├── services/      # API services
│   │   └── styles/        # CSS files
│   ├── public/            # Static assets
│   ├── package.json       # Client dependencies
│   ├── vite.config.js     # Vite configuration
│   ├── tailwind.config.js # Tailwind CSS config
│   └── postcss.config.js  # PostCSS config
├── server/                # Node.js backend
│   ├── routes/            # API routes
│   ├── models/            # Mongoose models
│   ├── middleware/        # Custom middleware
│   ├── config/            # Configuration files
│   ├── utils/             # Utility functions
│   ├── package.json       # Server dependencies
│   └── server.js          # Main server file
├── .env                   # Environment variables
├── package.json           # Root package.json
└── README.md             # Project documentation
```

## 🔧 Configuration Files

### Client Configuration
- **Vite**: `client/vite.config.js` - Development server and build configuration
- **Tailwind**: `client/tailwind.config.js` - Custom theme and utilities
- **PostCSS**: `client/postcss.config.js` - CSS processing
- **ESLint**: `client/.eslintrc.cjs` - Code linting rules

### Server Configuration
- **Database**: `server/config/database.js` - MongoDB connection
- **Auth**: `server/config/auth.js` - JWT and password utilities
- **Middleware**: `server/middleware/` - Error handling, rate limiting
- **ESLint**: `server/.eslintrc.json` - Server code linting

## 🌐 Available Scripts

### Root Level
```bash
npm run dev              # Start both client and server
npm run dev:client       # Start only client
npm run dev:server       # Start only server
npm run build            # Build client for production
npm run install:all      # Install all dependencies
```

### Client (React + Vite)
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Lint code
```

### Server (Node.js + Express)
```bash
npm run dev              # Start with nodemon
npm start                # Start production server
npm run test             # Run tests
npm run lint             # Lint code
```

## 🔐 Environment Variables

Create a `.env` file in the root directory with:

```env
# Required
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/skillwise
JWT_SECRET=your_super_secret_jwt_key_here

# Optional (uncomment as needed)
# FRONTEND_URL=http://localhost:5173
# JWT_EXPIRE=30d
# OPENAI_API_KEY=your_openai_key
# STRIPE_SECRET_KEY=your_stripe_key
# AWS_ACCESS_KEY_ID=your_aws_key
# SMTP_HOST=smtp.gmail.com
# CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

## 🗄️ Database Setup

### Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use URI: `mongodb://localhost:27017/skillwise`

### MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster
3. Get connection string
4. Use URI: `mongodb+srv://username:password@cluster.mongodb.net/skillwise`

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**:
   - Push code to GitHub
   - Connect repository to Vercel

2. **Configure Build Settings**:
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/dist`
   - Install Command: `npm run install:all`

3. **Environment Variables**:
   - Add all `.env` variables to Vercel
   - Set `NODE_ENV=production`

4. **Deploy**:
   - Vercel will automatically deploy on push

## 🛠️ Development Workflow

1. **Start Development**:
   ```bash
   npm run dev
   ```

2. **Create Features**:
   - Add routes in `server/routes/`
   - Create models in `server/models/`
   - Build components in `client/src/components/`
   - Add pages in `client/src/pages/`

3. **Testing**:
   - API testing: `npm run test` (server)
   - Manual testing: Visit http://localhost:5173

4. **Deployment**:
   - Push to GitHub
   - Vercel auto-deploys

## 📚 Next Steps

1. **Create Models**: Add Mongoose models in `server/models/`
2. **Add Routes**: Create API routes in `server/routes/`
3. **Build Components**: Create React components in `client/src/components/`
4. **Add Pages**: Create page components in `client/src/pages/`
5. **Implement Features**: Add authentication, modules, etc.

## 🆘 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   - Change PORT in `.env`
   - Kill process using the port

2. **MongoDB Connection Failed**:
   - Check MongoDB is running
   - Verify connection string
   - Check network connectivity

3. **Dependencies Issues**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Build Errors**:
   - Check for syntax errors
   - Verify all imports
   - Clear cache: `npm run build -- --force`

## 📞 Support

For issues or questions:
1. Check the README.md
2. Review error logs
3. Check MongoDB connection
4. Verify environment variables

---

**Happy Coding! 🎉** 