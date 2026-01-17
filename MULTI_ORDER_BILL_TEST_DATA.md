# Multi-Order Bill Test Data Documentation

This document describes the test data created for testing bills with multiple orders.

## Overview

The system supports creating bills that combine multiple orders from the same customer. This is useful for:
- Bulk orders
- Multiple items ordered at different times
- Complete outfit sets (e.g., shirt + pant + jacket)
- Festival/wedding collections

## Test Data Summary

### Bills with Multiple Orders

| Bill ID | Customer | Mobile | Order Count | Order IDs | Total Amount | Status | Remarks |
|---------|----------|--------|-------------|-----------|--------------|--------|---------|
| 13 | Rajesh Kumar | 9876543210 | 2 | 21, 22 | ₹3,800 | Pending | Combined bill for shirt and pant |
| 14 | Priya Sharma | 9876543212 | 2 | 2, 23 | ₹9,500 | Pending | Wedding order + festive collection |
| 15 | Vikram Singh | 9876543218 | 3 | 5, 24, 25 | ₹6,700 | Fresh | Complete business suit - 3 items |
| 16 | Amit Patel | 9876543214 | 2 | 26, 27 | ₹5,800 | Pending | Festival collection - kurta and churidar |

### Detailed Order Breakdown

#### Bill 13 - Rajesh Kumar (2 Orders)
- **Order 21**: Additional shirt order - ₹2,000 (Completed)
  - Material: ₹1,000
  - Labor: ₹800
  - Buttons: ₹200
- **Order 22**: Formal pant - ₹1,800 (Completed)
  - Fabric: ₹900
  - Stitching: ₹700
  - Lining: ₹200
- **Bill Total**: ₹3,800
- **Advance**: ₹2,000
- **Balance**: ₹1,800

#### Bill 14 - Priya Sharma (2 Orders)
- **Order 2**: Wedding order - ₹4,500 (Delivered)
  - Material: ₹2,000
  - Labor: ₹2,000
  - Embroidery: ₹500
- **Order 23**: Festive collection - ₹5,000 (Completed)
  - Material: ₹2,500
  - Labor: ₹2,000
  - Embroidery: ₹500
- **Bill Total**: ₹9,500
- **Advance**: ₹5,500
- **Balance**: ₹4,000
- **Discount**: 10% early payment discount

#### Bill 15 - Vikram Singh (3 Orders - Largest Multi-Order Bill)
- **Order 5**: Formal wear - ₹2,000 (In Progress)
  - Material: ₹1,000
  - Stitching: ₹800
  - Buttons: ₹200
- **Order 24**: Business suit shirt - ₹2,500 (Completed)
  - Material: ₹1,300
  - Labor: ₹1,000
  - Accessories: ₹200
- **Order 25**: Business suit pant - ₹2,200 (In Progress)
  - Fabric: ₹1,200
  - Stitching: ₹800
  - Finishing: ₹200
- **Bill Total**: ₹6,700
- **Advance**: ₹3,700
- **Balance**: ₹3,000
- **Discount**: ₹500 bulk discount

#### Bill 16 - Amit Patel (2 Orders)
- **Order 26**: Traditional kurta - ₹3,000 (Completed)
  - Material: ₹1,600
  - Labor: ₹1,200
  - Embroidery: ₹200
- **Order 27**: Designer churidar - ₹2,800 (Completed)
  - Fabric: ₹1,500
  - Stitching: ₹1,100
  - Work: ₹200
- **Bill Total**: ₹5,800
- **Advance**: ₹3,000
- **Balance**: ₹2,800
- **Discount**: ₹200 loyalty discount

## Database Schema

### bill_details Table
```sql
CREATE TABLE bill_details (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mobile_no VARCHAR(25) NOT NULL,
    created_date DATE,
    total_amount DECIMAL(10,2),
    advance_paid DECIMAL(10,2),
    balance_amount DECIMAL(10,2),
    status ENUM('fresh', 'closed', 'pending'),
    discount VARCHAR(50),
    remarks VARCHAR(500),
    FOREIGN KEY (mobile_no) REFERENCES customer_details(mobile_no)
);
```

### bill_orders_association Table
```sql
CREATE TABLE bill_orders_association (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mobile_no VARCHAR(25) NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    bill_id BIGINT UNSIGNED NOT NULL,
    UNIQUE KEY unique_order_bill (order_id, bill_id),
    FOREIGN KEY (mobile_no) REFERENCES customer_details(mobile_no),
    FOREIGN KEY (order_id) REFERENCES order_details(id),
    FOREIGN KEY (bill_id) REFERENCES bill_details(id)
);
```

## Test Cases

### Location
`/Users/vidyaviswanathan/Divesthi/BQOM/bqom-back-end/src/test/java/com/dreamworks/bqom/MultiOrderBillTest.java`

### Test Coverage

1. **testBillWithTwoOrdersExists**
   - Verifies Bill 13 exists with exactly 2 orders
   - Checks data integrity

2. **testBillWithThreeOrdersExists**
   - Verifies Bill 15 exists with exactly 3 orders
   - Validates total amount calculation

3. **testAllMultiOrderBills**
   - Confirms at least 4 multi-order bills exist
   - Verifies at least one bill has 3 orders

4. **testUniqueBillOrderAssociations**
   - Ensures each order is linked to only one bill
   - Validates unique constraint

5. **testOrderCustomerConsistency**
   - Confirms all orders in a bill belong to the same customer
   - Checks data consistency

6. **testRetrieveBillWithOrderDetails**
   - Tests retrieval of bill with associated order information
   - Validates relationships

7. **testBillTotalMatchesOrderSum**
   - Verifies bill total equals sum of order totals
   - Checks calculation accuracy

8. **testBillsDataIntegrity**
   - Comprehensive data integrity check
   - Validates no orphaned records

## Running Tests

### Run All Tests
```bash
cd /Users/vidyaviswanathan/Divesthi/BQOM/bqom-back-end
mvn test
```

### Run Only Multi-Order Bill Tests
```bash
mvn test -Dtest=MultiOrderBillTest
```

### Run Specific Test
```bash
mvn test -Dtest=MultiOrderBillTest#testBillWithThreeOrdersExists
```

## API Usage Examples

### Create Bill with Multiple Orders

```bash
curl -X POST http://localhost:8080/v1/bqom/bills \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNo": "9876543210",
    "totalAmount": 5000.00,
    "advancePaid": 2500.00,
    "balanceAmount": 2500.00,
    "status": "FRESH",
    "orders": [
      {"id": 1},
      {"id": 2}
    ],
    "remarks": "Combined bill for multiple orders",
    "discount": "0"
  }'
```

### Retrieve Bills with Associated Orders

```bash
curl http://localhost:8080/v1/bqom/bills
```

### Search for Multi-Order Bills

```bash
curl http://localhost:8080/v1/bqom/bills?searchTerm=Vikram
```

## Verification Queries

### Check All Multi-Order Bills
```sql
SELECT
    b.id as bill_id,
    c.name as customer_name,
    b.total_amount,
    b.status,
    COUNT(ba.order_id) as order_count,
    GROUP_CONCAT(ba.order_id ORDER BY ba.order_id) as order_ids,
    b.remarks
FROM bill_details b
JOIN customer_details c ON b.mobile_no = c.mobile_no
JOIN bill_orders_association ba ON b.id = ba.bill_id
GROUP BY b.id, c.name, b.total_amount, b.status, b.remarks
HAVING order_count > 1
ORDER BY order_count DESC, b.id;
```

### Verify Data Consistency
```sql
-- Check for duplicate associations
SELECT order_id, bill_id, COUNT(*)
FROM bill_orders_association
GROUP BY order_id, bill_id
HAVING COUNT(*) > 1;

-- Check for mismatched customer mobile numbers
SELECT ba.id, b.mobile_no as bill_mobile, o.mobile_no as order_mobile
FROM bill_orders_association ba
JOIN bill_details b ON ba.bill_id = b.id
JOIN order_details o ON ba.order_id = o.id
WHERE b.mobile_no != o.mobile_no;
```

## Business Rules

1. **Same Customer**: All orders in a bill must belong to the same customer
2. **Unique Association**: Each order can only be linked to one bill
3. **Total Calculation**: Bill total should equal the sum of all associated order totals
4. **Status Independence**: Orders can have different statuses (fresh, in_progress, completed, delivered)
5. **Discount Application**: Discounts can be applied at the bill level for multi-order billing

## Frontend Display

In the Bills page of the React application:
- Multi-order bills show expandable rows
- Clicking the expand icon reveals all associated orders
- Each order shows its individual status, amount, and details
- Total is clearly displayed at the bill level

## Notes

- Multi-order bills are useful for bulk discounts
- The system enforces referential integrity through foreign keys
- Unique constraint prevents accidental duplicate bill-order links
- All monetary values use DECIMAL(10,2) for precision
- Dates use appropriate date/datetime types for accuracy
