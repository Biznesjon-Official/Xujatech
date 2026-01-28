# XUJATECh - POS + Inventory + CRM System

A comprehensive sales and warehouse management system for home appliance stores.

## 🚀 Quick Start

### Development Environment

1. **Clone the repository:**
```bash
git clone https://github.com/Biznesjon-Official/Xujatech.git
cd Xujatech
```

2. **Setup environment files:**
```bash
# Backend
copy backend\.env.example backend\.env
# Edit backend/.env with your development settings

# Frontend  
copy desktop\.env.example desktop\.env
# Edit desktop/.env with your development settings
```

3. **Install dependencies and start:**
```bash
npm install
cd backend && npm install
cd ../desktop && npm install

# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2) 
cd desktop && npm run dev
```

4. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3005

## 📁 Project Structure

```
├── backend/          # Node.js API server
├── desktop/          # React frontend
├── docs/            # Documentation
├── ssl/             # SSL certificates
└── deploy-production.sh  # Production deployment script
```

## 🛠 Development vs Production

| Environment | Backend Port | Frontend Port | Database | API URL |
|-------------|-------------|---------------|----------|---------|
| Development | 3005 | 3000 | xujatech_pos_dev | http://localhost:3005 |
| Production | 3000 | 443 (HTTPS) | xujatech_pos | https://xujatech.biznesjon.uz/api |

## 📋 Features

- 🛒 Point of Sale interface
- 📦 Inventory management
- 👥 Customer management
- 📊 Sales reporting
- 🔄 Offline sync capability
- 📱 Mobile responsive
- 🔐 User authentication
- 📈 Dashboard analytics

## 🔧 Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Redux Toolkit
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB
- **Authentication:** JWT
- **Deployment:** PM2, Nginx

## 📚 Documentation

See the `docs/` folder for detailed documentation:
- [API Endpoints](docs/api-endpoints.md)
- [Database Schema](docs/database-schema.md)
- [System Architecture](docs/system-architecture.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is proprietary software.

## 🔧 Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Windows 10+ (for desktop app)

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd xujatech-pos
npm run install:all
```

2. **Setup PostgreSQL database**
```bash
# Create database
createdb xujatech_pos

# Copy environment file
cd backend
cp .env.example .env

# Edit .env file with your database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_NAME=xujatech_pos
```

3. **Run database migrations**
```bash
cd backend
npm run migrate
npm run seed
```

4. **Start development**
```bash
# From root directory
npm run dev
```

This will start:
- Backend API server on http://localhost:3000
- Desktop POS application (Electron + React)

### Default Login Credentials
- **Username**: admin
- **Password**: admin123

## 🏗️ System Architecture

### Technology Stack
- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Desktop**: Electron + React + TypeScript + SQLite (offline)
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Hardware**: USB/Serial integration for peripherals

### Key Features
- ✅ **Multi-platform POS** (Windows desktop, future Android)
- ✅ **Offline-first operation** with automatic sync
- ✅ **Role-based access** (Admin, Manager, Cashier)
- ✅ **Hardware integration** (barcode scanner, receipt printer)
- ✅ **Comprehensive inventory** management
- ✅ **Customer debt tracking** and payment processing
- ✅ **Business reporting** and analytics

## 📊 Database Schema

The system uses PostgreSQL for the server and SQLite for offline operations:

- **Users & Authentication** - Role-based access control
- **Products & Categories** - Product catalog with variants
- **Suppliers** - Supplier management with credit tracking
- **Customers** - Customer data with debt and discount tracking
- **Sales & Payments** - Transaction records with multiple payment methods
- **Inventory** - Stock movements and current levels
- **Sync Operations** - Offline synchronization tracking

## 🖥️ User Interface

### Windows Desktop POS
- **4-panel layout**: Product search, cart, customer info, payment
- **Keyboard shortcuts** for power users (F1-F12)
- **Hardware integration** for barcode scanning and printing
- **Offline indicators** and sync status

### User Roles
- **Administrator**: Full system access, settings, user management
- **Manager**: Reports, inventory monitoring, supplier management  
- **Cashier**: Sales operations, customer management, receipt printing

## 🔄 Offline Synchronization

The system implements an **offline-first architecture**:

- **Local SQLite database** mirrors server data
- **Conflict resolution** with business rule priorities
- **Batch synchronization** when connection restored
- **Real-time sync** when online
- **Queue-based operations** for reliability

## 📈 Development Roadmap

### MVP (Current) - Core POS functionality
- ✅ Basic user management and authentication
- ✅ Product catalog with barcode support
- ✅ Simple POS operations (cash payments)
- ✅ Customer management with debt tracking
- ✅ Basic inventory management
- ✅ Windows desktop application
- ✅ Basic offline support

### Phase 2 - Enhanced POS
- Multiple payment methods (Card, Click/Payme)
- Advanced customer features (discounts, loyalty)
- Product variants and warranty tracking
- Return processing
- Enhanced reporting with profit analysis

### Phase 3 - Mobile & Multi-location
- Android POS application
- Multi-store support
- Supplier management
- Advanced synchronization
- Real-time notifications

### Phase 4 - Enterprise Features
- Business intelligence and analytics
- External integrations (accounting, e-commerce)
- Automated inventory management
- Advanced reporting and forecasting

## 🛠️ Development Commands

```bash
# Install all dependencies
npm run install:all

# Development (starts both backend and desktop)
npm run dev

# Backend only
npm run dev:backend

# Desktop only  
npm run dev:desktop

# Build for production
npm run build

# Database operations
cd backend
npm run migrate    # Run migrations
npm run seed      # Seed default data
```

## 📁 Project Structure

```
xujatech-pos/
├── backend/                     # Node.js API server
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   ├── middleware/         # Auth, validation, etc.
│   │   ├── services/           # Business logic
│   │   ├── config/             # Database, settings
│   │   ├── migrations/         # Database migrations
│   │   └── seeds/              # Default data
│   └── package.json
├── desktop/                     # Electron POS application
│   ├── src/
│   │   ├── main.ts             # Electron main process
│   │   ├── preload.ts          # IPC bridge
│   │   ├── services/           # Database, hardware, sync
│   │   ├── components/         # React UI components
│   │   ├── pages/              # Application pages
│   │   └── store/              # Redux store
│   └── package.json
├── docs/                        # Documentation
└── package.json                 # Root workspace config
```

## 🔧 Hardware Integration

### Supported Hardware
- **Receipt Printers**: ESC/POS compatible thermal printers
- **Barcode Scanners**: USB HID and camera-based scanning
- **Cash Drawers**: Automatic opening via printer
- **Payment Terminals**: Future integration capability

### Configuration
- Network printers: Configure IP in hardware settings
- USB devices: Automatic detection and setup
- Serial devices: COM port configuration

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run dist  # Creates installer
```

### Database Backup
The system includes automatic backup functionality accessible through the desktop application.

## 📞 Support

For technical support and feature requests, please refer to the project documentation or contact the development team.

---

**XUJATECh POS System** - Empowering home appliance stores with modern point-of-sale technology.