/**
 * ============================================================
 *  VDG · IT ASSET MANAGEMENT DASHBOARD – Apps Script Web API
 * ============================================================
 *
 *  Đọc dữ liệu ITAM từ Google Sheet, trả JSON cho dashboard HTML.
 *
 *  SHEETS MONG ĐỢI (đúng 5 sheet, đúng tên):
 *   1. dim_assets
 *   2. dim_categories
 *   3. fact_maintenance
 *   4. fact_software_licenses
 *   5. summary_by_category
 *
 *  HƯỚNG DẪN DEPLOY — xem README_ITAM.md
 *  ============================================================
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const payload = {
      dim_assets:             readSheet(ss, 'dim_assets'),
      dim_categories:         readSheet(ss, 'dim_categories'),
      fact_maintenance:       readSheet(ss, 'fact_maintenance'),
      fact_software_licenses: readSheet(ss, 'fact_software_licenses'),
      summary_by_category:    readSheet(ss, 'summary_by_category'),
      meta: {
        source: 'google_sheets_live',
        spreadsheet_name: ss.getName(),
        company: 'Viet Digital Group',
        last_updated: new Date().toISOString(),
        total_records: 0
      }
    };

    payload.meta.total_records = payload.dim_assets.length;

    // Auto-recompute days_to_warranty_expiry on server side
    // (for trường hợp user sửa warranty_end_date, chạy query thay vì tính sẵn trong sheet)
    const today = new Date();
    payload.dim_assets.forEach(a => {
      if (a.warranty_end_date) {
        const warr = new Date(a.warranty_end_date);
        if (!isNaN(warr.getTime())) {
          a.days_to_warranty_expiry = Math.round((warr - today) / (1000 * 60 * 60 * 24));
        }
      }
    });

    payload.fact_software_licenses.forEach(l => {
      if (l.expiry_date) {
        const exp = new Date(l.expiry_date);
        if (!isNaN(exp.getTime())) {
          l.days_to_expiry = Math.round((exp - today) / (1000 * 60 * 60 * 24));
        }
      }
      // Recompute utilization
      if (l.seats_total && l.seats_used != null) {
        l.utilization_pct = Math.round((l.seats_used / l.seats_total) * 1000) / 10;
      }
    });

    return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        error: true,
        message: err.message,
        stack: err.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


function readSheet(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Không tìm thấy sheet: "' + sheetName + '". Kiểm tra lại tên sheet.');
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(h => String(h).trim());
  const rows = values.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((key, idx) => {
      let v = row[idx];
      if (v instanceof Date) {
        v = Utilities.formatDate(v, 'UTC', 'yyyy-MM-dd');
      }
      if (v === null || v === undefined) v = '';
      obj[key] = v;
    });
    return obj;
  });
}


/**
 * Test function — chạy trong Apps Script editor để verify
 */
function testReadData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ['dim_assets', 'dim_categories', 'fact_maintenance',
                  'fact_software_licenses', 'summary_by_category'];

  sheets.forEach(name => {
    try {
      const data = readSheet(ss, name);
      Logger.log('✓ ' + name + ': ' + data.length + ' rows');
      if (data.length > 0) {
        Logger.log('  Columns: ' + Object.keys(data[0]).join(', '));
      }
    } catch (err) {
      Logger.log('✗ ' + name + ': ' + err.message);
    }
  });
}


/**
 * Optional: HR-style ITAM health check
 * Logs các issue quan trọng để review
 */
function auditAssets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const assets = readSheet(ss, 'dim_assets');
  const licenses = readSheet(ss, 'fact_software_licenses');
  const today = new Date();

  // Warranty expired
  let expiredCount = 0;
  let expiring30Count = 0;
  assets.forEach(a => {
    if (a.warranty_end_date) {
      const d = new Date(a.warranty_end_date);
      const days = Math.round((d - today) / 86400000);
      if (days < 0) expiredCount++;
      else if (days <= 30) expiring30Count++;
    }
  });

  // Licenses over-utilized
  let overUtil = 0;
  licenses.forEach(l => {
    if (l.seats_used > l.seats_total) overUtil++;
  });

  // Licenses expiring soon
  let licExpiring = 0;
  licenses.forEach(l => {
    if (l.expiry_date) {
      const d = new Date(l.expiry_date);
      const days = Math.round((d - today) / 86400000);
      if (days >= 0 && days <= 90) licExpiring++;
    }
  });

  Logger.log('=== ITAM AUDIT ===');
  Logger.log('Total assets: ' + assets.length);
  Logger.log('Warranty expired: ' + expiredCount);
  Logger.log('Warranty expiring in 30d: ' + expiring30Count);
  Logger.log('Licenses over-utilized: ' + overUtil);
  Logger.log('Licenses expiring in 90d: ' + licExpiring);
}
