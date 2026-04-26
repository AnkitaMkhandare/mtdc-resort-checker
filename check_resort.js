/**
 * MTDC Resort Availability Checker & Email Notifier
 * 
 * Checks resort availability from MTDC API and sends email summary.
 * 
 * Usage: node check_resort.js
 * 
 * Configuration: Edit .env file or the CONFIG section below.
 */

const https = require('https');
const zlib = require('zlib');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// ============ CONFIGURATION ============
// Load .env if exists
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...vals] = line.split('=');
      if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
    });
  }
} catch (e) { /* ignore */ }

const CONFIG = {
  SENDER_EMAIL: process.env.SENDER_EMAIL || 'testmtdcresort@gmail.com',
  SENDER_PASS: process.env.SENDER_PASS || 'lfig fxtf nafj gdhs',
  RECEIVER_EMAIL: process.env.RECEIVER_EMAIL || 'khandareanki@gmail.com',
  API_BASE: 'https://api-be.mtdc.co/api',
  CHECK_DAYS: 30, // How many days ahead to check
  // Leave empty to check ALL resorts, or specify resort names to filter
  RESORT_FILTER: [], // e.g., ['MTDC Tarkarli', 'MTDC Matheran']
};

// ============ HTTP HELPER ============
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Encoding': 'gzip, deflate',
        'Accept': 'application/json',
        ...options.headers
      }
    };
    const req = https.request(reqOptions, res => {
      let stream = res;
      if (res.headers['content-encoding'] === 'gzip') stream = res.pipe(zlib.createGunzip());
      else if (res.headers['content-encoding'] === 'deflate') stream = res.pipe(zlib.createInflate());
      let d = '';
      stream.on('data', c => d += c);
      stream.on('end', () => resolve({ status: res.statusCode, data: d }));
      stream.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Request timeout')); });
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ============ DATE HELPERS ============
function formatDate(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

// ============ FETCH ALL RESORTS ============
async function fetchAllResorts() {
  console.log('[1/4] Fetching all MTDC resorts...');
  let allResorts = [];
  let page = 1;
  let totalResorts = 0;

  // Use /v1/search/resorts with proper pagination
  while (true) {
    const res = await httpRequest(CONFIG.API_BASE + `/v1/search/resorts?page=${page}&page_size=10`);

    if (res.status !== 200) throw new Error(`Failed to fetch resorts: HTTP ${res.status}`);
    const data = JSON.parse(res.data);
    totalResorts = data.total || 0;
    const batch = data.results || [];

    if (batch.length === 0) break;
    allResorts.push(...batch);

    if (allResorts.length >= totalResorts || page > 10) break;
    page++;
  }

  console.log(`  Found ${allResorts.length} resorts (API reports ${totalResorts} total).`);

  // Now resolve each resort's hotelId via /v1/hotel/get/{slug} for those missing externalHotelID
  console.log('[2/4] Resolving hotel IDs...');
  const hotels = [];
  for (const resort of allResorts) {
    let hotelId = resort.externalHotelID;

    // If no externalHotelID, fetch via slug
    if (!hotelId && resort.slug) {
      try {
        const detailRes = await httpRequest(CONFIG.API_BASE + `/v1/hotel/get/${resort.slug}`);
        if (detailRes.status === 200) {
          const detail = JSON.parse(detailRes.data);
          hotelId = detail._id;
        }
      } catch (e) { /* skip */ }
    }

    hotels.push({
      _id: hotelId,
      name: resort.name,
      city: resort.city || '',
      slug: resort.slug,
      lowestPrice: resort.lowestPrice,
    });
  }

  let filtered = hotels;
  if (CONFIG.RESORT_FILTER.length > 0) {
    filtered = hotels.filter(h =>
      CONFIG.RESORT_FILTER.some(f => h.name.toLowerCase().includes(f.toLowerCase()))
    );
    console.log(`  Filtered to ${filtered.length} resorts.`);
  }
  return filtered;
}

// ============ FETCH AVAILABILITY ============
async function fetchAvailability(hotel) {
  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + CONFIG.CHECK_DAYS);

  try {
    let res = await httpRequest(CONFIG.API_BASE + '/v1/stayflexi/calendar-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotelId: hotel._id,
        fromDate: formatDate(now),
        toDate: formatDate(future)
      })
    });

    // Retry on rate limit (429)
    if (res.status === 429) {
      process.stdout.write('(rate limited, retrying in 5s) ');
      await new Promise(r => setTimeout(r, 5000));
      res = await httpRequest(CONFIG.API_BASE + '/v1/stayflexi/calendar-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: hotel._id, fromDate: formatDate(now), toDate: formatDate(future) })
      });
    }

    if (res.status !== 200) {
      return { hotel: hotel.name, city: hotel.city, error: `HTTP ${res.status}`, dates: [] };
    }

    const data = JSON.parse(res.data);
    const availableDates = (data.data || [])
      .filter(d => d.availableRoomCount > 0)
      .map(d => ({
        date: d.date,
        totalAvailable: d.availableRoomCount,
        minPrice: d.minPrice,
        isHoliday: d.holiday?.is_holiday || false,
        rooms: (d.rooms || [])
          .filter(r => r.available_count > 0)
          .map(r => ({
            name: r.room_name?.en || r.room_name?.mr || 'Unknown',
            available: r.available_count,
            price: r.price
          }))
      }));

    return {
      hotel: hotel.name,
      city: hotel.city,
      error: null,
      totalDatesChecked: (data.data || []).length,
      availableDates
    };
  } catch (err) {
    return { hotel: hotel.name, city: hotel.city, error: err.message, dates: [] };
  }
}

// ============ BUILD EMAIL HTML ============
function buildEmailHTML(results) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
  const timeStr = now.toLocaleTimeString('en-IN', { 
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
  });

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a5276, #2e86c1); color: #fff; padding: 24px 30px; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 5px 0 0; opacity: 0.85; font-size: 14px; }
    .content { padding: 24px 30px; }
    .resort-card { border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
    .resort-header { background: #f8f9fa; padding: 14px 18px; border-bottom: 1px solid #e0e0e0; }
    .resort-header h2 { margin: 0; font-size: 16px; color: #1a5276; }
    .resort-header .city { color: #666; font-size: 13px; margin-top: 2px; }
    .resort-body { padding: 14px 18px; }
    .avail-summary { color: #27ae60; font-weight: 600; margin-bottom: 10px; }
    .no-avail { color: #e74c3c; font-weight: 600; }
    .error-msg { color: #e67e22; font-style: italic; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
    th { background: #f0f4f8; padding: 8px 10px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600; }
    td { padding: 7px 10px; border-bottom: 1px solid #eee; }
    tr:hover td { background: #f9fbfd; }
    .price { color: #27ae60; font-weight: 600; }
    .holiday-badge { background: #fff3cd; color: #856404; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
    .footer { background: #f8f9fa; padding: 16px 30px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; }
    .stats { display: flex; gap: 20px; margin-bottom: 16px; }
    .stat-box { background: #f0f4f8; padding: 12px 16px; border-radius: 8px; flex: 1; text-align: center; }
    .stat-number { font-size: 24px; font-weight: 700; color: #1a5276; }
    .stat-label { font-size: 12px; color: #666; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏨 MTDC Resort Availability Report</h1>
      <p>${dateStr} at ${timeStr} IST</p>
    </div>
    <div class="content">`;

  // Stats
  const totalResorts = results.length;
  const resortsWithAvail = results.filter(r => r.availableDates && r.availableDates.length > 0).length;
  const totalAvailDates = results.reduce((sum, r) => sum + (r.availableDates ? r.availableDates.length : 0), 0);
  const errors = results.filter(r => r.error).length;

  html += `
      <div class="stats">
        <div class="stat-box">
          <div class="stat-number">${totalResorts}</div>
          <div class="stat-label">Resorts Checked</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${resortsWithAvail}</div>
          <div class="stat-label">With Availability</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${totalAvailDates}</div>
          <div class="stat-label">Available Dates</div>
        </div>
        ${errors > 0 ? `<div class="stat-box"><div class="stat-number" style="color:#e74c3c">${errors}</div><div class="stat-label">Errors</div></div>` : ''}
      </div>`;

  // Resort cards
  for (const result of results) {
    html += `
      <div class="resort-card">
        <div class="resort-header">
          <h2>${result.hotel}</h2>
          <div class="city">📍 ${result.city || 'N/A'}</div>
        </div>
        <div class="resort-body">`;

    if (result.error) {
      html += `<div class="error-msg">⚠️ Error: ${result.error}</div>`;
    } else if (!result.availableDates || result.availableDates.length === 0) {
      html += `<div class="no-avail">❌ No availability in the next ${CONFIG.CHECK_DAYS} days</div>`;
    } else {
      html += `<div class="avail-summary">✅ ${result.availableDates.length} dates available (out of ${result.totalDatesChecked} days checked)</div>`;
      html += `
          <table>
            <tr><th>Date</th><th>Rooms Available</th><th>Min Price</th><th>Room Details</th></tr>`;

      for (const d of result.availableDates.slice(0, 15)) {
        const dateFormatted = new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        const roomDetails = d.rooms.map(r => `${r.name} (${r.available}×₹${r.price})`).join(', ');
        html += `
            <tr>
              <td>${dateFormatted} ${d.isHoliday ? '<span class="holiday-badge">Holiday</span>' : ''}</td>
              <td>${d.totalAvailable}</td>
              <td class="price">₹${d.minPrice}</td>
              <td>${roomDetails || 'N/A'}</td>
            </tr>`;
      }

      if (result.availableDates.length > 15) {
        html += `<tr><td colspan="4" style="text-align:center; color:#888;">... and ${result.availableDates.length - 15} more dates</td></tr>`;
      }
      html += `</table>`;
    }

    html += `</div></div>`;
  }

  html += `
    </div>
    <div class="footer">
      <p>This is an automated report from MTDC Resort Availability Checker</p>
      <p>Data source: <a href="https://www.mtdc.co/">mtdc.co</a> | Next ${CONFIG.CHECK_DAYS} days checked</p>
    </div>
  </div>
</body>
</html>`;

  return html;
}

// ============ BUILD PLAIN TEXT EMAIL ============
function buildEmailText(results) {
  let text = 'MTDC Resort Availability Report\n';
  text += `Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`;
  text += '='.repeat(50) + '\n\n';

  for (const result of results) {
    text += `🏨 ${result.hotel} (${result.city || 'N/A'})\n`;
    if (result.error) {
      text += `  ⚠️ Error: ${result.error}\n\n`;
    } else if (!result.availableDates || result.availableDates.length === 0) {
      text += `  ❌ No availability in the next ${CONFIG.CHECK_DAYS} days\n\n`;
    } else {
      text += `  ✅ ${result.availableDates.length} dates available\n`;
      for (const d of result.availableDates.slice(0, 10)) {
        const rooms = d.rooms.map(r => `${r.name}(${r.available})`).join(', ');
        text += `    ${d.date} | ${d.totalAvailable} rooms | ₹${d.minPrice} | ${rooms}\n`;
      }
      if (result.availableDates.length > 10) {
        text += `    ... and ${result.availableDates.length - 10} more dates\n`;
      }
      text += '\n';
    }
  }
  return text;
}

// ============ SEND EMAIL ============
async function sendEmail(results) {
  console.log('[4/4] Sending email...');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: CONFIG.SENDER_EMAIL,
      pass: CONFIG.SENDER_PASS,
    },
  });

  const htmlContent = buildEmailHTML(results);
  const textContent = buildEmailText(results);

  const resortsWithAvail = results.filter(r => r.availableDates && r.availableDates.length > 0).length;

  const mailOptions = {
    from: `"MTDC Resort Checker" <${CONFIG.SENDER_EMAIL}>`,
    to: CONFIG.RECEIVER_EMAIL,
    subject: `🏨 MTDC Resort Availability Update - ${resortsWithAvail}/${results.length} resorts available`,
    text: textContent,
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`  ✅ Email sent successfully! Message ID: ${info.messageId}`);
  return info;
}

// ============ SAVE LOG ============
function saveLog(results) {
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(logDir, `availability-${timestamp}.json`);

  const logData = {
    timestamp: new Date().toISOString(),
    config: { checkDays: CONFIG.CHECK_DAYS, resortFilter: CONFIG.RESORT_FILTER },
    results: results.map(r => ({
      hotel: r.hotel,
      city: r.city,
      error: r.error,
      availableDatesCount: r.availableDates ? r.availableDates.length : 0,
      totalDatesChecked: r.totalDatesChecked || 0,
    }))
  };

  fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
  console.log(`  📄 Log saved: ${logFile}`);
}

// ============ MAIN ============
async function main() {
  console.log('🏨 MTDC Resort Availability Checker');
  console.log('====================================');
  console.log(`Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  console.log(`Checking next ${CONFIG.CHECK_DAYS} days...\n`);

  try {
    // Step 1: Fetch all resorts
    const hotels = await fetchAllResorts();

    // Step 2: Check availability for each resort
    console.log(`\n[3/4] Checking availability for ${hotels.length} resorts...`);
    const results = [];
    for (let i = 0; i < hotels.length; i++) {
      const hotel = hotels[i];
      process.stdout.write(`  [${i + 1}/${hotels.length}] ${hotel.name}... `);
      const result = await fetchAvailability(hotel);
      const availCount = result.availableDates ? result.availableDates.length : 0;
      console.log(result.error ? `⚠️ ${result.error}` : `${availCount} dates available`);
      results.push(result);

      // Small delay to be respectful to the API
      await new Promise(r => setTimeout(r, 1000));
    }

    // Step 3: Send email
    console.log();
    await sendEmail(results);

    // Save log
    saveLog(results);

    console.log('\n✅ Done! Check your email at ' + CONFIG.RECEIVER_EMAIL);
  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    // Send error notification email
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: CONFIG.SENDER_EMAIL, pass: CONFIG.SENDER_PASS },
      });
      await transporter.sendMail({
        from: `"MTDC Resort Checker" <${CONFIG.SENDER_EMAIL}>`,
        to: CONFIG.RECEIVER_EMAIL,
        subject: '❌ MTDC Resort Checker - Error Report',
        text: `The MTDC Resort Availability Checker failed at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.\n\nError: ${err.message}\n\nStack: ${err.stack}`,
      });
      console.log('  Error notification email sent.');
    } catch (mailErr) {
      console.error('  Could not send error email:', mailErr.message);
    }
    process.exit(1);
  }
}

main();