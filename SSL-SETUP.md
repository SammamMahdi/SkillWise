# 🔐 SSL Certificate Setup for SkillWise

## **Problem**
If you're getting `ERR_CERT_AUTHORITY_INVALID` errors when trying to use Google OAuth, it means your browser doesn't trust the SSL certificates.

## **Solution**

### **Option 1: Quick Setup (Windows)**
1. Double-click `setup-ssl.bat` in the project root
2. Follow the prompts
3. Restart your server

### **Option 2: Manual Setup**

#### **Step 1: Install mkcert**
```bash
# Windows (using chocolatey)
choco install mkcert

# Or download from: https://github.com/FiloSottile/mkcert/releases
```

#### **Step 2: Install Root Certificate**
```bash
mkcert -install
```

#### **Step 3: Create SSL Certificates**
```bash
mkcert localhost 127.0.0.1 ::1
```

#### **Step 4: Restart Server**
```bash
cd server
npm run dev
```

## **What This Does**
- Installs a trusted root certificate authority in your system
- Creates SSL certificates for localhost that your browser will trust
- Allows HTTPS connections without certificate warnings

## **Troubleshooting**

### **Still getting certificate errors?**
1. Make sure you ran `mkcert -install` as administrator
2. Restart your browser completely
3. Check if certificates were created in the project root

### **Server won't start?**
The server will automatically fall back to HTTP if no certificates are found.

## **Files Created**
- `localhost+2.pem` - SSL certificate
- `localhost+2-key.pem` - Private key

## **Security Note**
These certificates are only for local development and should never be used in production.
