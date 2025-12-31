# BQOM Setup Guide

Complete guide to get the Boutique Order Management System up and running.

## Quick Start

### Step 1: Start the Backend

1. Open a terminal and navigate to the backend directory:
```bash
cd /Users/vidyaviswanathan/Divesthi/BQOM/bqom-back-end
```

2. Ensure MySQL is running and the database is created:
```sql
CREATE DATABASE IF NOT EXISTS bqom;
```

3. Start the Spring Boot backend:
```bash
mvn spring-boot:run
```

The backend should be running on http://localhost:8080

### Step 2: Start the Frontend

1. Open a new terminal and navigate to the React app directory:
```bash
cd /Users/vidyaviswanathan/Divesthi/BQOM/bqom-react-app
```

2. Install dependencies (first time only):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and go to:
```
http://localhost:5173
```

## Complete Workflow Example

### 1. Add a Customer

1. Click "Customers" in the sidebar
2. Click "Add Customer"
3. Enter:
   - Name: "Priya Sharma"
   - Mobile: "9876543210"
   - Address: "123 MG Road, Bangalore"
   - Alternate Contact: "9876543211"
4. Click OK

### 2. Create Measurements

1. Click "Measurements" in the sidebar
2. Click "Add Measurement"
3. Select Customer: "Priya Sharma (9876543210)"
4. Enter:
   - Measurement Name: "Blouse - Red Silk"
   - Dress Type: "Blouse"
5. Add measurement fields:
   - Click "Add Measurement Field"
   - Field 1: Shoulder = "15 inches"
   - Field 2: Bust = "36 inches"
   - Field 3: Waist = "32 inches"
   - Field 4: Length = "18 inches"
6. Add remarks: "Customer prefers loose fit"
7. Click OK

### 3. Create an Order

1. Click "Orders" in the sidebar
2. Click "Create Order"
3. Select Customer: "Priya Sharma (9876543210)"
4. Enter:
   - Total Items: 1
   - Total Amount: 2500
   - Advance: 1000
   - Balance: 1500
   - Delivery Date: (select a future date)
   - Status: "Fresh"
5. Click "Add Order Item"
6. Select Measurement: "Blouse - Red Silk - Blouse"
7. Enter:
   - Quantity: 1
   - Cost Per Quantity: 2500
   - Remarks: "Use red silk fabric"
8. Click OK

### 4. Generate a Bill

1. Click "Bills" in the sidebar
2. Click "Create Bill"
3. Select Customer: "Priya Sharma (9876543210)"
4. Enter:
   - Total Amount: 2500
   - Advance Paid: 1000
   - Balance Amount: 1500
   - Status: "Pending"
5. Click OK

### 5. View Dashboard

1. Click "Dashboard" in the sidebar
2. See overview:
   - Total Revenue: ₹2500
   - Active Orders: 1
   - Pending Orders: 1
   - Recent orders table

## Common Use Cases

### Editing Customer Details

1. Go to Customers page
2. Find the customer in the table
3. Click "Edit" button
4. Update details
5. Click OK

### Updating Measurements

1. Go to Measurements page
2. Find the measurement in the table
3. Click "Edit" button
4. Modify measurement fields
5. Click OK

### Tracking Order Progress

1. Orders cannot be edited after creation (backend limitation)
2. Create a new order with updated status if needed
3. Track orders by status on Dashboard

## Tips for Boutique Owners

### Best Practices

1. **Customer Management**
   - Always use mobile number as primary identifier
   - Keep addresses updated for delivery
   - Add alternate contact for reliability

2. **Measurements**
   - Use descriptive names: "Blouse - Red Silk" instead of just "Blouse"
   - Include dress type and color in name
   - Add detailed remarks for special requirements
   - Take new measurements for each order if customer's size may have changed

3. **Orders**
   - Set realistic delivery dates
   - Track advance payments carefully
   - Update status regularly:
     - Fresh → when order is received
     - In Progress → when cutting starts
     - Completed → when stitching is done
     - Delivered → when given to customer

4. **Bills**
   - Create bills after order is confirmed
   - Mark as "Closed" only when full payment is received
   - Keep discount records for reference

### Workflow Recommendations

**Daily Tasks:**
1. Check Dashboard for pending orders
2. Update order statuses as work progresses
3. Follow up on orders near delivery date

**Weekly Tasks:**
1. Review pending bills
2. Contact customers with outstanding balances
3. Plan upcoming week's work based on delivery dates

**Monthly Tasks:**
1. Review total revenue
2. Analyze completed orders
3. Follow up with inactive customers

## Keyboard Shortcuts

While using forms:
- **Tab**: Move to next field
- **Shift + Tab**: Move to previous field
- **Enter**: Submit form (when OK button is focused)
- **Esc**: Close modal

## Data Flow

```
Customer Creation
    ↓
Measurement Creation (linked to customer)
    ↓
Order Creation (with order items linked to measurements)
    ↓
Bill Creation (linked to customer)
    ↓
Dashboard (shows aggregated data)
```

## Troubleshooting

### Issue: Cannot see any data

**Solution:**
1. Check if backend is running on port 8080
2. Open browser console (F12) and check for errors
3. Verify database has data

### Issue: Cannot create order

**Solution:**
1. Ensure customer exists
2. Ensure at least one measurement exists for the customer
3. Check all required fields are filled

### Issue: Backend not connecting

**Solution:**
1. Check `.env` file has correct URL
2. Verify backend is running: `curl http://localhost:8080/v1/bqom/hello`
3. Check CORS settings in backend

### Issue: Page not loading

**Solution:**
1. Clear browser cache
2. Check browser console for errors
3. Restart dev server: `npm run dev`

## Development Mode vs Production

### Development (npm run dev)
- Hot reload enabled
- Source maps for debugging
- Detailed error messages
- Runs on port 5173

### Production (npm run build)
- Optimized bundle
- Minified code
- Better performance
- Deploy to web server

## Next Steps

After successfully running the application:

1. **Customize**
   - Change colors in theme
   - Add your business logo
   - Modify dress types to match your offerings

2. **Add Data**
   - Import existing customer data
   - Create measurement templates
   - Set up initial orders

3. **Train Users**
   - Show staff how to use each module
   - Practice with test data
   - Document your specific workflows

4. **Plan Deployment**
   - Choose hosting platform
   - Set up production database
   - Implement authentication if needed

## Support

For technical issues:
1. Check browser console for errors
2. Review backend logs
3. Verify API endpoints are working
4. Check network tab in browser dev tools

For feature requests or bugs:
1. Document the issue clearly
2. Include steps to reproduce
3. Provide screenshots if applicable
