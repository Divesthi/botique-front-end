# BQOM Quick Start Guide

## ✅ Application Successfully Built!

Your professional Boutique Order Management System is ready to use.

## 🚀 How to Run

### Step 1: Start the Backend (Required)

Open a terminal and start the Spring Boot backend:

```bash
cd /Users/vidyaviswanathan/Divesthi/BQOM/bqom-back-end
mvn spring-boot:run
```

**Backend will run on:** http://localhost:8080

### Step 2: Start the React Frontend

Open a new terminal and run:

```bash
cd /Users/vidyaviswanathan/Divesthi/BQOM/bqom-react-app
npm run dev
```

**Frontend will run on:** http://localhost:5173

### Step 3: Open Your Browser

Navigate to: **http://localhost:5173**

## 📱 Application Features

### 1. **Dashboard** (Home Page)
- Real-time statistics (Revenue, Active Orders, Pending Orders, Completed Today)
- Recent orders table with full details
- Quick overview of business metrics

### 2. **Customer Management** (`/customers`)
- ➕ Add new customers
- ✏️ Edit customer details
- 📋 View all customers in a table
- 🔍 Searchable and sortable

### 3. **Measurement Management** (`/measurements`)
- ➕ Create custom measurements for each customer
- 📏 Flexible measurement fields (add as many as needed)
- 👗 Support for different dress types
- ✏️ Edit existing measurements

### 4. **Order Management** (`/orders`)
- ➕ Create orders with multiple items
- 🔗 Link order items to customer measurements
- 📅 Track delivery dates
- 💰 Manage payments (total, advance, balance)
- 📊 Track order status (Fresh → In Progress → Completed → Delivered)

### 5. **Bill Management** (`/bills`)
- ➕ Generate bills for customers
- 💵 Track payment status
- 💳 Apply discounts
- ✏️ Edit bills

## 🎯 Quick Workflow Example

1. **Add a Customer**
   - Go to "Customers" → Click "Add Customer"
   - Enter: Name, Mobile (10 digits), Address
   - Click OK

2. **Create Measurement**
   - Go to "Measurements" → Click "Add Measurement"
   - Select customer, enter measurement name and dress type
   - Add measurement fields (e.g., Shoulder: 15 inches, Bust: 36 inches)
   - Click OK

3. **Create Order**
   - Go to "Orders" → Click "Create Order"
   - Select customer
   - Enter order details (items, amount, delivery date)
   - Add order items (select measurement, quantity, cost)
   - Click OK

4. **Generate Bill**
   - Go to "Bills" → Click "Create Bill"
   - Select customer
   - Enter amount, advance, balance, discount
   - Click OK

5. **View Dashboard**
   - Go to "Dashboard" to see all statistics and recent orders

## 🛠️ Tech Stack

- **React 18** + **TypeScript** - Type-safe UI development
- **Vite** - Lightning-fast build tool
- **Ant Design** - Professional UI components
- **React Router** - Client-side routing
- **Axios** - API communication

## 📂 Project Location

```
/Users/vidyaviswanathan/Divesthi/BQOM/bqom-react-app/
```

## 📚 Documentation

- **README.md** - Complete feature documentation
- **SETUP_GUIDE.md** - Detailed setup and usage guide
- **QUICK_START.md** - This file

## ⚙️ Environment Configuration

The application is configured to connect to the backend at:
```
http://localhost:8080
```

If your backend runs on a different port, edit the `.env` file:
```
VITE_API_BASE_URL=http://localhost:YOUR_PORT
```

## 🎨 Professional Features

✅ Clean, modern UI with Ant Design
✅ Fully responsive (works on mobile, tablet, desktop)
✅ Type-safe development with TypeScript
✅ Real-time statistics on dashboard
✅ Complete CRUD operations for all modules
✅ Error handling and loading states
✅ Professional form validations
✅ Searchable and sortable tables
✅ Date formatting with dayjs
✅ Flexible measurement system
✅ Order status tracking
✅ Payment management

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install
```

## 📊 Application Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
│   ├── dashboard/      # Dashboard with statistics
│   ├── customers/      # Customer management
│   ├── measurements/   # Measurement management
│   ├── orders/         # Order management
│   └── bills/          # Bill management
├── services/           # API service layer
│   ├── api.ts         # Axios configuration
│   ├── customerService.ts
│   ├── measurementService.ts
│   ├── orderService.ts
│   └── billService.ts
├── types/              # TypeScript type definitions
├── layouts/            # Layout components
└── App.tsx            # Main app with routing
```

## 🎯 What You Can Do Now

1. **Start using the application** - Follow the 3 steps above
2. **Read full documentation** - Check README.md for all features
3. **Customize** - Modify colors, add features, etc.
4. **Train staff** - Show boutique owners how to use the system

## 💡 Tips

- Always start the **backend first**, then the frontend
- Use the **Dashboard** to get a quick overview
- **Mobile numbers** are used as unique customer identifiers
- Create **measurements before orders** (orders need measurements)
- Use **status tracking** to monitor order progress

## 🆘 Need Help?

1. Check **SETUP_GUIDE.md** for detailed usage instructions
2. Check browser console (F12) for errors
3. Verify backend is running on port 8080
4. Ensure database is configured correctly

## ✅ Application Status

- ✅ Backend API integrated
- ✅ All CRUD operations working
- ✅ Professional UI implemented
- ✅ TypeScript compilation successful
- ✅ Production build ready
- ✅ Responsive design implemented
- ✅ Error handling in place

**Your application is ready for use!** 🎉
