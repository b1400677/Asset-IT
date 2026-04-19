# 💻 VDG · IT Asset Management Dashboard — Hướng dẫn

Bộ công cụ quản lý tài sản IT cho công ty giả lập **Viet Digital Group (VDG)** — thay thế Power BI.

> ⚠️ **Dữ liệu**: 1,535 tài sản, 45 software licenses trong dataset này là **dữ liệu giả lập do Claude tự tạo** (seed 123, công ty không có thật). Cấu trúc database và dashboard có thể áp dụng ngay cho dữ liệu thật.

---

## 📦 Danh sách file

| File | Vai trò |
|------|---------|
| `dashboard_itam.html` | Dashboard interactive (HTML + Chart.js) |
| `google_apps_script_itam.gs` | API đọc dữ liệu từ Google Sheets |
| `it_asset_data.xlsx` | Dữ liệu ITAM (5 sheet star schema) |
| `README_ITAM.md` | File này |

---

## 🏢 Về công ty giả lập — Viet Digital Group

| Thông tin | Giá trị |
|-----------|---------|
| Ngành | FinTech & Digital Transformation |
| Founded | 2017-05-20 |
| Employees | 420 |
| HQ | TP. Hồ Chí Minh |
| Chi nhánh | Hà Nội, Đà Nẵng |
| **Tổng tài sản IT** | **1,535** |
| **Tổng giá trị mua** | **37.79 tỷ VND** |
| Giá trị hiện tại (sau khấu hao) | 16.21 tỷ VND |
| Software licenses | 45 (tổng 32.43 tỷ/năm) |

---

## 🗄️ Database Schema (Star Schema)

```
              ┌─────────────────────┐
              │  dim_categories     │
              │  - category_id (PK) │
              │  - useful_life_years│
              │  - min/max_cost_vnd │
              └─────────┬───────────┘
                        │
                        │ 1:N
                        ▼
┌──────────────────┐    ┌─────────────────────┐    ┌────────────────────────┐
│ fact_maintenance │◄──►│   dim_assets        │    │ fact_software_licenses │
│ - asset_id (FK)  │ N:1│   - asset_id (PK)   │    │ - license_id (PK)      │
│ - event_date     │    │   - asset_tag       │    │ - software_name        │
│ - event_type     │    │   - category, brand │    │ - seats_total/used     │
│ - cost_vnd       │    │   - purchase_cost   │    │ - expiry_date          │
│ - downtime_days  │    │   - warranty_end    │    │ - annual_cost_vnd      │
└──────────────────┘    │   - status, location│    └────────────────────────┘
                        │   - assigned_to     │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │summary_by_category  │
                        │ (pre-aggregated)    │
                        └─────────────────────┘
```

### Chi tiết 5 sheet

#### 1. `dim_assets` (1,535 rows × 19 cols) — **Bảng chính**

| Column | Type | Mô tả |
|--------|------|-------|
| asset_id | PK | AST00001 |
| asset_tag | text | VDG-LAP-00123 (tag vật lý dán trên máy) |
| category | text | 10 loại: Laptop, Desktop, Monitor, Mobile Phone, Tablet, Printer, Server, Network Equipment, Peripheral, Storage Device |
| subcategory | text | Business / Premium / Entry, 24"/27"/32", v.v. |
| brand | text | Dell, HP, Lenovo, Apple, Cisco... |
| model | text | Latitude 5430, iPhone 15 Pro, ThinkPad T14... |
| serial_number | text | 10-char unique |
| purchase_date | date | Ngày mua |
| purchase_cost_vnd | int | Giá mua (VND) |
| current_value_vnd | int | Giá trị hiện tại (sau khấu hao đường thẳng, salvage 10%) |
| warranty_end_date | date | Ngày hết bảo hành |
| days_to_warranty_expiry | int | Số ngày đến hết BH (âm = đã hết) |
| assigned_to_emp_id | FK | ID nhân viên sử dụng |
| assigned_to_name | text | Họ tên người dùng |
| department | text | Phòng ban sử dụng |
| location | text | HCM / HN / ĐN |
| status | text | In Use / Storage / Under Repair / Retired / Lost-Damaged |
| condition | text | New / Good / Fair / Poor |
| age_years | float | Tuổi tài sản |

#### 2. `dim_categories` (10 rows)
`category_id | category | useful_life_years | min_cost_vnd | max_cost_vnd | target_count`

#### 3. `fact_maintenance` (308 rows)
Lịch sử bảo trì/sửa chữa.
`maintenance_id | asset_id | asset_tag | category | event_date | event_type (Sửa chữa/Bảo trì/Nâng cấp) | cost_vnd | vendor | downtime_days`

#### 4. `fact_software_licenses` (45 rows)
Phần mềm bản quyền.
`license_id | software_name | vendor | license_type | seats_total | seats_used | utilization_pct | cost_per_seat_vnd | annual_cost_vnd | purchase_date | expiry_date | days_to_expiry | auto_renew`

Ví dụ license: Microsoft 365 E3 (420 seats), Adobe CC (35 seats), GitHub Enterprise (180 seats)...

#### 5. `summary_by_category` (10 rows)
Pre-aggregated.
`category_id | category | total_assets | in_use_count | storage_count | retired_count | total_purchase_value_vnd | total_current_value_vnd | avg_age_years | warranty_expiring_90d`

---

## 🚀 Cách 1: Dùng ngay (không cần setup)

Mở `dashboard_itam.html` bằng browser. Dashboard chạy ngay với 1,535 tài sản đã embed.

## 🔄 Cách 2: Kết nối Google Sheets để refresh

### Bước 1 — Upload lên Google Sheets
1. Upload `it_asset_data.xlsx` lên Drive
2. Mở bằng Google Sheets → **File → Save as Google Sheets**
3. Xác nhận 5 sheet đúng tên

### Bước 2 — Deploy Apps Script
1. Extensions → Apps Script
2. Paste nội dung `google_apps_script_itam.gs`
3. Save → Deploy → New deployment → **Web app** / Execute as **Me** / Access **Anyone**
4. Copy Web app URL

### Bước 3 — Kết nối dashboard
1. Mở `dashboard_itam.html`
2. ⚙️ Cấu hình → dán URL → Lưu
3. Click **Refresh Data**

### 🌟 Tính năng đặc biệt của Apps Script này
- **Tự động tính lại** `days_to_warranty_expiry` mỗi lần gọi API (không cần update manual trong Sheet)
- **Tự động tính lại** `days_to_expiry` của license
- **Tự động tính lại** `utilization_pct` khi seats_used thay đổi
- Có hàm `auditAssets()` để chạy audit tổng thể

---

## 📊 KPI & Biểu đồ

### 4 KPI Cards

| KPI | Công thức | Benchmark |
|-----|-----------|-----------|
| **Tổng tài sản** | COUNT(assets) | Kèm % đang sử dụng |
| **Giá trị hiện tại** | SUM(current_value_vnd) | So với giá mua + % khấu hao |
| **Warranty sắp hết** | COUNT(days_to_warranty ≤ 90) | ⚠️ Badge đỏ nếu có nhiều expired |
| **License Utilization TB** | AVG(utilization_pct) | Kèm tổng chi phí license/năm |

### 6 biểu đồ

1. **Chi tiêu mua sắm IT theo tháng** (combo bar + line)
   - Cột: tổng chi tiêu tháng (triệu VND)
   - Đường: số lượng tài sản mua
   - 24 tháng gần nhất

2. **Phân bố theo danh mục** (horizontal bar, 10 categories)

3. **Phân bố theo trạng thái** (doughnut)
   - In Use / Storage / Under Repair / Retired / Lost-Damaged

4. **Warranty timeline** (bar chart, 6 buckets)
   - Đã hết | <30 ngày | 30-90 | 90-180 | 180-365 | >1 năm
   - Màu cảnh báo: đỏ/vàng/xanh

5. **Top thương hiệu** (horizontal bar, top 12)
   - Ai chiếm nhiều nhất: Dell? HP? Apple?

6. **Software License Utilization** (scrollable list with progress bars)
   - Sắp xếp theo % dùng
   - Đỏ: >95% (cần mua thêm seats)
   - Xanh: 70-95% (OK)
   - Vàng: <70% (over-bought, tối ưu cost)
   - Badge hết hạn: hiển thị số ngày còn lại

### Bộ lọc (5 filter)

- Danh mục (Laptop, Desktop, ...)
- Trạng thái
- Thương hiệu
- Địa điểm
- Phòng ban sử dụng

Mọi filter áp dụng real-time cho KPI + biểu đồ + bảng.

### Bảng chi tiết tài sản

Cột: Asset Tag · Category · Model · Brand · Người sử dụng · Địa điểm · Giá trị · Warranty status · Trạng thái

**Color coding**:
- Warranty badge: đỏ (hết hạn) / vàng (sắp hết) / xanh (còn lâu)
- Status pill: màu riêng cho từng status

---

## 🎯 Use case mẫu

### 1. Budget planning cho năm tới
- KPI card #3 cho biết số tài sản warranty sắp hết → cần budget gia hạn/thay mới
- Filter `Status = Retired` → xem số thiết bị cần thanh lý → thu hồi chi phí
- Xem chart Warranty timeline → ước tính chi phí gia hạn BH theo quý

### 2. Cost optimization licenses
- Scroll license list → phòng nào utilization <60% → renegotiate seats
- License utilization >95% → cần mua thêm seats (khả năng có nhân viên không có quyền truy cập)
- License days_to_expiry <30 → cần renew hoặc chuyển nhà cung cấp

### 3. Vendor management
- Chart "Top thương hiệu" → biết mình phụ thuộc vào vendor nào → strategic negotiation
- Filter `Brand = Dell` → xem toàn bộ thiết bị Dell → xin support package ưu đãi

### 4. Asset lifecycle
- Filter `Category = Laptop` + `Age > 4 years` → list laptop cần thay
- Filter `Status = Under Repair` → backlog của IT team

### 5. Audit & compliance
- Filter `Status = Lost/Damaged` → điều tra nguyên nhân
- Filter `Location = Hà Nội` → inventory audit tại chi nhánh

---

## 🛠️ So sánh với phần mềm ITAM thương mại

| Tính năng | ServiceNow ITAM | Lansweeper | Dashboard này |
|-----------|-----------------|------------|---------------|
| Chi phí | $100+/node/năm | $2/node/năm | Miễn phí |
| Auto-discovery | ✅ Agent | ✅ Agent | ❌ Manual entry |
| Asset lifecycle tracking | ✅ | ✅ | Via events |
| Software license | ✅ | ✅ | ✅ |
| Warranty alerts | ✅ | ✅ | ✅ (visual) |
| Depreciation | ✅ | ✅ | ✅ (auto-compute) |
| Custom dashboards | ✅ | Limited | ✅ Full |
| Mobile scan asset tag | ✅ | ✅ | ❌ |
| API integration | ✅ | ✅ | Via Apps Script |

**Tóm lại**: Giải pháp này phù hợp cho SME/startup (< 5,000 assets) muốn ITAM dashboard mà không tốn phí license. Với company lớn hơn, nên dùng ServiceNow/Lansweeper.

---

## ⚠️ Lưu ý khi dùng cho dữ liệu thật

1. **Asset tags nên unique và có format**: VDG-LAP-00001, không dùng Excel row number
2. **Warranty dates**: nhập chính xác, dashboard sẽ auto tính `days_to_expiry`
3. **Status convention**: dùng đúng 5 giá trị (In Use / Storage / Under Repair / Retired / Lost/Damaged), không custom
4. **Serial number**: quan trọng cho audit & warranty claim — không để rỗng
5. **Bảo mật**: danh sách tài sản kèm người dùng là dữ liệu nội bộ → KHÔNG public Apps Script URL
6. **Backup**: Google Sheets có revision history, nhưng nên export Excel định kỳ
7. **Software licenses**: tracking manual thủ công → khuyến nghị dùng tool auto (như Microsoft 365 Admin, GitHub Insights) để sync số seats thực tế

---

**Tóm lại**: Dashboard ITAM đầy đủ với 4 KPI + 6 biểu đồ chuyên sâu + 5 filter + bảng chi tiết, kèm Apps Script auto-compute các chỉ số time-sensitive. Dùng được cho 1,500 - 5,000 assets không lag. Dữ liệu giả lập, cấu trúc áp dụng được cho company thật.
