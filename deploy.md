# MTDC Resort Checker - Azure Deployment Guide

## Architecture
```
Logic App (Daily Timer) → Creates ACI → Runs check_resort.js → Sends Email → ACI Terminates
```

## Resources Created (in rg-ankita-space)

| Resource | Name | Purpose |
|----------|------|---------|
| Container Registry | mtdcacr | Stores Docker image |
| Container Instance | mtdc-daily-run | Runs the checker script |
| Logic App | mtdc-daily-scheduler | Triggers daily execution |

## Phase 4: Set Up Daily Scheduling with Logic App

### Step-by-step (Azure Portal)

1. **Go to Azure Portal** → https://portal.azure.com

2. **Create Logic App**
   - Search "Logic App" → Create
   - Resource Group: `rg-ankita-space`
   - Name: `mtdc-daily-scheduler`
   - Type: **Consumption**
   - Region: Central India
   - Click Review + Create → Create

3. **Open Logic App Designer**
   - Go to the created Logic App → Logic app designer

4. **Add Recurrence Trigger**
   - Search "Recurrence" → Select it
   - Interval: `1`
   - Frequency: `Day`
   - Time zone: `India Standard Time`
   - At these hours: `8` (8 AM IST)
   - At these minutes: `0`

5. **Add Action: Create Container Group**
   - Click "+ New step"
   - Search "Azure Container Instance" → "Create or update a container group"
   - Sign in with your Azure credentials
   - Configure:
     - Subscription: your subscription
     - Resource Group: `rg-ankita-space`
     - Container Group Name: `mtdc-daily-run`
     - Location: `centralindia`
     - Container Name: `mtdc-checker`
     - Image: `mtdcacr.azurecr.io/mtdc-resort-checker:latest`
     - OS Type: `Linux`
     - CPU: `1`
     - Memory: `1`
     - Restart Policy: `Never`
     - Image Registry Server: `mtdcacr.azurecr.io`
     - Image Registry Username: `mtdcacr`
     - Image Registry Password: (get from `az acr credential show --name mtdcacr`)
     - Environment Variables:
       - `SENDER_EMAIL` = `testmtdcresort@gmail.com`
       - `RECEIVER_EMAIL` = `khandareanki@gmail.com`
     - Secure Environment Variables:
       - `SENDER_PASS` = your Gmail app password

6. **Add Action: Delay**
   - Click "+ New step" → search "Delay"
   - Count: `10`
   - Unit: `Minute`

7. **Add Action: Delete Container Group**
   - Click "+ New step"
   - Search "Azure Container Instance" → "Delete a container group"
   - Resource Group: `rg-ankita-space`
   - Container Group Name: `mtdc-daily-run`

8. **Save** the Logic App

## Useful Commands

```bash
# Check container status
az container show --resource-group rg-ankita-space --name mtdc-daily-run --query "containers[0].instanceView.currentState" -o json

# View container logs
az container logs --resource-group rg-ankita-space --name mtdc-daily-run

# Manually trigger (delete old + create new)
az container delete --resource-group rg-ankita-space --name mtdc-daily-run -y
az container create --resource-group rg-ankita-space --name mtdc-daily-run \
  --image mtdcacr.azurecr.io/mtdc-resort-checker:latest \
  --registry-login-server mtdcacr.azurecr.io \
  --registry-username mtdcacr \
  --registry-password "<ACR_PASSWORD>" \
  --environment-variables SENDER_EMAIL=testmtdcresort@gmail.com RECEIVER_EMAIL=khandareanki@gmail.com \
  --secure-environment-variables "SENDER_PASS=<GMAIL_APP_PASSWORD>" \
  --restart-policy Never --os-type Linux --cpu 1 --memory 1

# Update Docker image after code changes
docker build -t mtdc-resort-checker:latest .
docker tag mtdc-resort-checker:latest mtdcacr.azurecr.io/mtdc-resort-checker:latest
docker push mtdcacr.azurecr.io/mtdc-resort-checker:latest
```

## Cost Estimate

| Resource | Monthly Cost |
|----------|-------------|
| ACR Basic | ~₹370 |
| ACI (~2 min/day) | ~₹2 |
| Logic App (1 run/day) | ~₹0 |
| **Total** | **~₹372/month** |