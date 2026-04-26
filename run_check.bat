@echo off
REM MTDC Resort Availability Checker - Scheduled Task Runner
REM This batch file can be used with Windows Task Scheduler
REM Schedule: Daily at 8:00 AM IST

cd /d "%~dp0"
node check_resort.js >> logs\scheduler.log 2>&1