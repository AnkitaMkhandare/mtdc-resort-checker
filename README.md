# MTDC Resort Availability Checker

Automatically checks availability across all MTDC (Maharashtra Tourism Development Corporation) resorts and sends a daily email report.

## Features

- Fetches all resorts from the MTDC API
- Checks room availability for the next 30 days
- Sends a formatted HTML email report with availability details
- Runs daily on Azure using Logic App + Azure Container Instance

## Setup

### Local Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file:
   ```
   SENDER_EMAIL=your-gmail@gmail.com
   SENDER_PASS=your-gmail-app-password
   RECEIVER_EMAIL=recipient@gmail.com
   ```

3. Run:
   ```bash
   node check_resort.js
   ```

### Azure Deployment

See [deploy.md](deploy.md) for full Azure deployment instructions using:
- **Azure Container Registry** — stores the Docker image
- **Azure Container Instance** — runs the checker
- **Azure Logic App** — triggers daily at 8 AM IST

## Project Structure

```
check_resort.js          # Main script
package.json             # Dependencies (nodemailer)
Dockerfile               # Container build definition
.dockerignore            # Docker build excludes
logic-app-template.json  # ARM template for Logic App
deploy.md                # Azure deployment guide
run_check.bat            # Windows batch runner
.env                     # Email credentials (not in repo)
```

## Configuration

Edit the `CONFIG` object in `check_resort.js` or set environment variables:

| Variable | Description |
|----------|-------------|
| `SENDER_EMAIL` | Gmail address to send from |
| `SENDER_PASS` | Gmail app password |
| `RECEIVER_EMAIL` | Recipient email address |