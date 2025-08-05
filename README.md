# SkillWise

A comprehensive learning platform with multiple modules designed to help users develop various skills.

## 🚀 Tech Stack

- **Frontend**: React.js with Vite
- **Backend**: Node.js with Express.js
- **Styling**: Tailwind CSS
- **Database**: MongoDB
- **ORM**: Mongoose
- **Deployment**: Vercel

## 📁 Project Structure

```
SkillWise/
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── config/
│   └── package.json
├── .env                    # Environment variables
├── package.json           # Root package.json
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### 1. Clone the repository

```bash
git clone <repository-url>
cd SkillWise
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/skillwise
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillwise

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# API Keys (add as needed)
# OPENAI_API_KEY=your_openai_api_key
# STRIPE_SECRET_KEY=your_stripe_secret_key
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=your_s3_bucket_name

# Email Configuration (if using email services)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_email_password

# Cloudinary Configuration (if using for image uploads)
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Start Development Servers

```bash
# Start both client and server concurrently (Recommended)
npm run dev

# Or start them separately:
# Client (React + Vite)
npm run dev:client

# Server (Node.js + Express with Nodemon)
npm run dev:server
```

## 🔥 Live Development Features

### Frontend (Vite)
- **Hot Module Replacement**: Instant updates without page refresh
- **CSS Hot Reload**: Style changes apply immediately
- **Fast Refresh**: React component updates preserve state
- **Error Overlay**: Clear error messages with stack traces

### Backend (Nodemon)
- **File Watching**: Monitors all server files for changes
- **Auto Restart**: Server restarts automatically on file changes
- **Environment Variables**: Loads from `.env` file
- **Error Handling**: Graceful error recovery

### Development Workflow
1. Start development: `npm run dev`
2. Make changes to frontend or backend files
3. See live updates instantly
4. Debug using browser dev tools and terminal logs

For detailed live development information, see [LIVE_DEVELOPMENT.md](./LIVE_DEVELOPMENT.md).

## 🌐 Access Points

- **Frontend**: http://localhost:5173 (Vite default)
- **Backend API**: http://localhost:5000

## 📦 Available Scripts

### Root Level
- `npm run dev` - Start both client and server in development mode with live reload
- `npm run dev:client` - Start only the client (Vite with HMR)
- `npm run dev:server` - Start only the server (Nodemon with auto-restart)
- `npm run build` - Build the client for production
- `npm run install:all` - Install all dependencies

### Client (React + Vite)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Server (Node.js + Express)
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run test` - Run tests

## 🔧 Configuration Files

### Client Configuration
- `client/vite.config.js` - Vite configuration
- `client/tailwind.config.js` - Tailwind CSS configuration
- `client/postcss.config.js` - PostCSS configuration

### Server Configuration
- `server/config/database.js` - MongoDB connection
- `server/config/auth.js` - Authentication configuration
- `server/middleware/` - Custom middleware

## 📝 Development Guidelines

1. **Environment Variables**: Always use `.env` files for sensitive data
2. **Code Style**: Follow ESLint and Prettier configurations
3. **Git**: Use conventional commit messages
4. **API**: Follow RESTful conventions
5. **Security**: Implement proper authentication and authorization

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/dist`
   - Install Command: `npm run install:all`

### Environment Variables for Production

Set up the following environment variables in Vercel:
- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV=production`
- Any other API keys needed

## 📚 Modules

The platform will include multiple learning modules:
- Module 1: [Description]
- Module 2: [Description]
- Module 3: [Description]
- And more...

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team. 