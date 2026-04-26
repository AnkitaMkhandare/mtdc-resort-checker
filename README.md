# 🏨 MTDC Resort Availability Checker & Email Notifier

Automatically checks availability for all MTDC (Maharashtra Tourism Development Corporation) resorts and sends a beautifully formatted email report.

## Features

- **Fetches all 35 MTDC resorts** from the official API (`api-be.mtdc.co`)
- **Checks room availability** for the next 30 days (configurable)
- **Sends HTML email** with resort-wise availability, room types, and pricing
- **Logs results** as JSON for trend tracking
- **Schedulable** via Windows Task Scheduler for daily automated runs

## Quick Start

```bash
# Install dependencies
npm install

# Run the checker
node check_resort.js
```

## Configuration

Edit `.env` file:

```
SENDER_EMAIL=testmtdcresort@gmail.com
SENDER_PASS=your-16-digit-app-password
RECEIVER_EMAIL=your-email@gmail.com
```

Edit `check_resort.js` CONFIG section to:
- Change `CHECK_DAYS` (default: 30)
- Filter specific resorts with `RESORT_FILTER` array

## Scheduling (Windows Task Scheduler)

1. Open **Task Scheduler** (`taskschd.msc`)
2. Click **Create Basic Task**
3. Name: `MTDC Resort Checker`
4. Trigger: **Daily** at **8:00 AM**
5. Action: **Start a program**
   - Program: `C:\Temp\MTDC_Resort\run_check.bat`
   - Start in: `C:\Temp\MTDC_Resort`
6. Finish

Or run this command in an elevated PowerShell:

```powershell
schtasks /create /tn "MTDC Resort Checker" /tr "C:\Temp\MTDC_Resort\run_check.bat" /sc daily /st 08:00
```

## Project Structure

```
MTDC_Resort/
├── check_resort.js   # Main script
├── .env              # Email credentials (not in git)
├── run_check.bat     # Batch file for Task Scheduler
├── package.json      # Node.js dependencies
├── logs/             # JSON logs of each run
└── README.md
```

## Email Output

The email includes:
- Summary stats (resorts checked, available, total dates)
- Per-resort availability cards with:
  - Available dates
  - Room counts and types
  - Minimum pricing (₹)
  - Holiday indicators

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/hotel/find` | POST | List all MTDC resorts |
| `/v1/stayflexi/calendar-view` | POST | Get room availability & pricing |

## Gmail Setup

The sender email uses a **Gmail App Password** (16-digit) for SMTP authentication:
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Use that 16-digit password in `.env`