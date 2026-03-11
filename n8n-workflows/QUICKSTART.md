# n8n Workflows - Quick Start (15 minutes)

Fast-track to deploying all 4 n8n workflows. Full guide: [N8N_SETUP_GUIDE.md](./N8N_SETUP_GUIDE.md)

---

## ⚡ 15-Minute Deploy

### Step 1: Prepare Credentials (5 min)

Get these from your accounts:

```
1. Supabase
   - Host: your-project.supabase.co (from dashboard)
   - Password: (you set during signup)

2. Twilio
   - Account SID: (from Console → Account Info)
   - Auth Token: (from Console → Account Info)

3. Your Admin Phone
   - Example: +1-310-555-1234 (with country code)
```

### Step 2: Create n8n Credentials (5 min)

**In n8n Settings → Credentials → New:**

| Credential | Type | Name |
|-----------|------|------|
| Supabase | Postgres | Lina Point Supabase |
| Twilio | Twilio | Lina Point Twilio |
| HTTP (optional) | HTTP Header Auth | Lina Point Vercel API |

**Test each:** Click "Test connection" (should show ✅)

### Step 3: Import Workflows (5 min)

**In n8n, click "New Workflow" → "Import":**

Files to upload in order:
1. `booking-flow.json`
2. `magic-content-flow.json`
3. `admin-notifications.json`
4. `self-improvement-loop.json`

**For each workflow:**
- Click through import
- Update node credentials when prompted
- Activate (toggle to green in top right)

---

## 🧪 Quick Test

### Test Booking Flow

```bash
# Replace YOUR_WEBHOOK_URL with the URL from the Webhook Trigger node
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+13105551234",
    "userId": "test-user-123",
    "sessionId": "test-session",
    "message": "I want to book for 3 nights",
    "checkInDate": "2025-03-15",
    "checkOutDate": "2025-03-18",
    "roomType": "oceanfront",
    "groupSize": 2,
    "interests": ["romance", "spa"]
  }'
```

**Expected:** ✅ Admin gets WhatsApp message with booking results

### Test Admin Notifications

1. Open Admin Notifications workflow
2. Click Schedule Trigger node
3. Click "Execute Node" (play button)

**Expected:** ✅ Admin gets hourly summary

---

## 📍 Key Files

| File | Purpose |
|------|---------|
| [booking-flow.json](./booking-flow.json) | Guest booking requests → orchestrates agents |
| [magic-content-flow.json](./magic-content-flow.json) | Generate songs/videos for guests |
| [admin-notifications.json](./admin-notifications.json) | Hourly activity summary |
| [self-improvement-loop.json](./self-improvement-loop.json) | Weekly performance analysis |
| [N8N_SETUP_GUIDE.md](./N8N_SETUP_GUIDE.md) | Complete detailed guide |
| [N8N_INTEGRATION_REFERENCE.json](./N8N_INTEGRATION_REFERENCE.json) | Technical reference |

---

## ⚙️ Integration with WhatsApp Webhook

After workflows are deployed, update `/src/app/api/whatsapp-webhook/route.ts`:

```typescript
// Around line 120, after detecting action, add:

if (detectedAction === 'booking') {
  await fetch('{{ YOUR_BOOKING_WEBHOOK_URL }}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: normalizedPhone,
      userId: profile.id,
      sessionId: sessionId,
      message: userMessage,
      checkInDate: extractedData.checkInDate,
      checkOutDate: extractedData.checkOutDate,
      roomType: extractedData.roomType,
      groupSize: extractedData.groupSize,
      interests: extractedData.interests
    })
  });
}

if (detectedAction === 'magic_content') {
  await fetch('{{ YOUR_MAGIC_CONTENT_WEBHOOK_URL }}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: normalizedPhone,
      userId: profile.id,
      sessionId: sessionId,
      occasion: extractedData.occasion,
      reservationId: profile.last_booking_id
    })
  });
}
```

---

## 🚀 You're Done!

All 4 workflows are now:
- ✅ Active and responding to webhooks
- ✅ Hourly notifications running
- ✅ Weekly reports generating
- ✅ Ready for production

**Next:** Check [Monitoring Guide](./N8N_SETUP_GUIDE.md#-monitoring--maintenance) for daily checks.

---

## 🆘 Quick Troubleshooting

| Problem | Fix |
|---------|-----|
| Webhook not listening | Click webhook node, then "Listen for test event" |
| Credential error | Click node, select credential from dropdown |
| API ends in 404 | Check Vercel URL matches your deployment |
| Twilio sends fail | Verify Account SID and Auth Token in Twilio Console |
| DB queries return 0 | Check table names match your schema exactly |
| Messages not sending | Verify ADMIN_PHONE format: +1234567890 |

**Full troubleshooting:** See [N8N_SETUP_GUIDE.md#-troubleshooting](./N8N_SETUP_GUIDE.md#-troubleshooting)

---

**Need help?** See [N8N_SETUP_GUIDE.md](./N8N_SETUP_GUIDE.md) for detailed documentation.
