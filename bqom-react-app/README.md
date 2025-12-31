# BQOM - Boutique Order Management System

A professional React-based web application for managing boutique orders, customer measurements, and billing.

## Features

### 1. Customer Management
- Create new customers with contact details
- View all customers in a searchable table
- Edit existing customer information
- Track customer contact numbers and addresses

### 2. Measurement Management
- Create custom measurements for each customer
- Support for different dress types (Blouse, Saree, Churidar, Lehenga, etc.)
- Flexible measurement fields (add as many as needed)
- View and edit customer measurements
- Link measurements to specific customers

### 3. Order Management
- Create orders linked to customers
- Add multiple order items per order
- Link order items to customer measurements
- Track order status (Fresh → In Progress → Completed → Delivered)
- Manage order dates (received, cutting, packaging, delivery)
- Track payment details (total, advance, balance)
- Add remarks for each order

### 4. Bill Management
- Generate bills for customers
- Link bills to orders
- Track payment status (Fresh, Pending, Closed)
- Apply discounts
- Manage advance payments and balances

### 5. Dashboard
- Overview of business statistics
- Total revenue calculation
- Active and pending order counts
- Completed orders tracking
- Recent orders table with full details

## Technology Stack

- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Ant Design** - Professional UI component library
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Day.js** - Date formatting and manipulation

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Backend API running on http://localhost:8080

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at: http://localhost:5173

### Environment Configuration

Create or edit `.env` file:
```
VITE_API_BASE_URL=http://localhost:8080
```

## Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Complete setup instructions
- Full README with detailed features and architecture

## Project Structure

```
src/
├── components/       # Reusable components
├── pages/           # Page components (Dashboard, Customers, etc.)
├── services/        # API service layer
├── types/           # TypeScript type definitions
├── layouts/         # Layout components
└── App.tsx          # Main app with routing
```

## For Boutique Owners

This system helps you:
- Track customer details and measurements
- Manage orders from receipt to delivery
- Monitor payment status
- Plan work based on delivery dates
- Generate bills efficiently

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete usage instructions.

## Support

For technical issues or questions, refer to the setup guide or check the backend documentation.
