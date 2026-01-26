# BQOM - Boutique Order Management System
## Installation & User Guide

---

## What You Need Before Starting

You need **Docker Desktop** installed on your computer. This is a free application that runs BQOM.

### Installing Docker Desktop

**For Windows:**
1. Go to: https://www.docker.com/products/docker-desktop
2. Click "Download for Windows"
3. Run the downloaded file and follow the steps
4. Restart your computer when asked
5. After restart, open Docker Desktop from the Start menu
6. Wait until you see "Docker Desktop is running" (look for the whale icon near the clock)

**For Mac:**
1. Go to: https://www.docker.com/products/docker-desktop
2. Click "Download for Mac"
3. Open the downloaded file and drag Docker to Applications
4. Open Docker from Applications
5. Wait until you see the Docker icon in the top menu bar

---

## How to Start BQOM

### On Windows:
1. Make sure Docker Desktop is running (whale icon near the clock)
2. Open the `BQOM` folder
3. Double-click `start.bat`
4. Wait for the message "BQOM Started Successfully!"
5. Open your web browser and go to: **http://localhost**

### On Mac:
1. Make sure Docker Desktop is running (Docker icon in top menu)
2. Open Terminal (find it in Applications > Utilities)
3. Type this command and press Enter:
   ```
   cd /path/to/BQOM
   ```
   (Replace `/path/to/BQOM` with where you saved the folder)
4. Type this command and press Enter:
   ```
   ./start.sh
   ```
5. Wait for the message "BQOM Started Successfully!"
6. Open your web browser and go to: **http://localhost**

**First time starting?** It will take a few minutes to download and set up. This is normal.

---

## How to Stop BQOM

### On Windows:
1. Open the `BQOM` folder
2. Double-click `stop.bat`
3. Wait for the message "BQOM Stopped Successfully!"

### On Mac:
1. Open Terminal
2. Go to the BQOM folder (same as before)
3. Type: `./stop.sh` and press Enter

**Your data is safe!** Stopping does not delete any of your orders, customers, or bills.

---

## How to Restart BQOM

If something is not working correctly, try restarting.

### On Windows:
1. Open the `BQOM` folder
2. Double-click `restart.bat`

### On Mac:
1. Open Terminal
2. Go to the BQOM folder
3. Type: `./restart.sh` and press Enter

---

## Using the Application

Once BQOM is running, open your web browser (Chrome, Firefox, Safari, or Edge) and go to:

**http://localhost**

You will see the BQOM dashboard where you can:
- Manage customers
- Create and track orders
- Handle measurements
- Generate bills

---

## Common Problems & Solutions

### "Docker is not running"
**Solution:** Open Docker Desktop and wait for it to fully start, then try again.

### Cannot open http://localhost
**Solution:**
1. Wait 1-2 minutes after starting (the system needs time to initialize)
2. Try refreshing the page
3. Try restarting BQOM

### The page is loading slowly
**Solution:** This is normal on first start. It will be faster next time.

### Port already in use error
**Solution:** Close any other applications that might be using the internet (like Skype or other web servers).

---

## Backing Up Your Data

To create a backup of all your data:

1. Open Terminal (Mac) or Command Prompt (Windows)
2. Go to the BQOM folder
3. Run this command:
   ```
   docker exec bqom-mysql mysqldump -uroot -pWelcome123 bqom > my_backup.sql
   ```
4. This creates a file called `my_backup.sql` containing all your data

Keep this file safe! You can use it to restore your data if needed.

---

## Quick Reference

| What You Want to Do | Windows | Mac |
|---------------------|---------|-----|
| Start BQOM | Double-click `start.bat` | Run `./start.sh` |
| Stop BQOM | Double-click `stop.bat` | Run `./stop.sh` |
| Restart BQOM | Double-click `restart.bat` | Run `./restart.sh` |
| Open BQOM | Go to http://localhost | Go to http://localhost |

---

## Need Help?

If you have problems that are not solved by this guide, please contact support.

---

*BQOM - Boutique Order Management System*
*Version 1.0*
