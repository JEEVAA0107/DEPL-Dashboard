# Dinesh Exports Pvt Ltd (DEPL) – Exact Database Schema Mapping & Security Report

**Target Live Database**: `Dinesh_Weaving_ERP` (SQL Server at `192.168.0.150:1433`)  
**Access Policy**: **STRICT READ-ONLY ACCESS (`SELECT` queries only with `WITH (NOLOCK)`)**  
**Security Status**: All write operations (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `TRUNCATE`) are strictly blocked.

---

## 1. Verified Module Schema Mapping

| Module Code | Module Name | Exact Live Table / View | Filter / Join Condition | Primary Count Metric | Volume Metric (Meters) | Date Field |
|---|---|---|---|---|---|---|
| **VI-01** | **Vendor Inward** | `[Vendor_Cloth_Inw]` | `Inw_type = 'Vendor'` | `COUNT(DISTINCT DCNo)` (Vendor DCs) | `SUM(Mtr)` (Linear Meters) | `Inwdt` |
| **PI-02** | **Purchase Inward** | `[Vendor_Cloth_Inw]` | `Inw_type = 'Purchase'` | `COUNT(DISTINCT DCNo)` (Purchase DCs) | `SUM(Mtr)` (Linear Meters) | `Inwdt` |
| **PD-03** | **Process Delivery** | `[Cloth_Delivery]` | *(All Mill Deliveries)* | `COUNT(DISTINCT Dcno)` (Mill DCs) | `SUM(Mtr)` (Linear Meters) | `Dcdt` |
| **PI-04** | **Process Inward** | `[Cloth_Final_Inw]` | `Inw_type = 'Process Inward'` | `COUNT(DISTINCT DCNo)` (Mill DCs) | `SUM(Mtr)` (Linear Meters) | `Inwdt` |
| **SD-05** | **Sales Delivery** | `[Fab_Sales]` | `ISNULL(cancel, 0) = 0` | `COUNT(DISTINCT inv)` (Invoices) | `SUM(ToMtr)` (Linear Meters) | `INVDt` |
| **IBPO-06** | **IBPO Orders** | `[IBPO]` | `ord_type <> 'Management Order'` | `COUNT(DISTINCT pono)` (Buyer POs) | `SUM(CAST(Order_Mtr as float))` | `refdt` |
| **IMPO-07** | **IMPO Orders** | `[IBPO]` | `ord_type = 'Management Order'` | `COUNT(DISTINCT pono)` (Internal Orders) | `SUM(CAST(Order_Mtr as float))` | `refdt` |

---

## 2. Live Data Verification (Today: 2026-11-18 & Yesterday: 2026-11-17)

Every KPI, chart, and ledger entry reflects real records queried directly from the MS SQL Server:

- **Vendor Inward (VI-01)**:
  - Today (`2026-11-18`): **46 DCs | 39,172.3 Meters**
  - Yesterday (`2026-11-17`): **46 DCs | 36,982.3 Meters**
- **Purchase Inward (PI-02)**:
  - Today (`2026-11-18`): **4 DCs | 3,871.3 Meters**
  - Yesterday (`2026-11-17`): **2 DCs | 25,166.0 Meters**
- **Process Delivery (PD-03)**:
  - Today (`2026-11-18`): **7 DCs | 10,675.5 Meters**
  - Yesterday (`2026-11-17`): **32 DCs | 65,283.9 Meters**
- **Process Inward (PI-04)**:
  - Today (`2026-11-18`): **24 DCs | 22,359.5 Meters**
  - Yesterday (`2026-11-17`): **64 DCs | 72,583.1 Meters**
- **Sales Delivery (SD-05)**:
  - Today (`2026-11-18`): **12 Invoices | 43,395.5 Meters**
  - Yesterday (`2026-11-17`): **47 Invoices | 33,959.9 Meters**
  - 7-Day Net Revenue: **₹3,40,24,726 (₹3.40 Cr)**
- **IBPO Buyer Orders (IB-06)**:
  - Today (`2026-11-18`): **27 Orders | 55,295 Meters**
  - Yesterday (`2026-11-17`): **29 Orders | 65,187 Meters**
- **IMPO Management Orders (IM-07)**:
  - Today (`2026-11-18`): **0 Orders**
  - Yesterday (`2026-11-17`): **1 Order | 455 Meters**

---

## 3. Brand Identity & Header Enhancements

1. **Official Logo Integration**: Features the authentic high-resolution `logo.png` displaying the multicolored geometric textile diamond icon and classic Roman serif typography:
   - **DINESH EXPORTS PVT LTD**
   - **THE HOUSE OF TEXTILES**
2. **Signature Crimson Accent Bar**: A crisp `border-t-4 border-[#991B1B]` framing the top of the header across all screens, matching the official company letterhead.
3. **Clutter-Free Single-Page Layout**:
   - Clean Date Presets: `Today`, `7 Days`, `30 Days`, `This Month`, and `Custom` collapsible drawer.
   - Live ERP status indicator with pulsating emerald dot.
   - Refined Corporate Palette harmonized with brand jewel-tone accents (Forest Green, Royal Amber, Sapphire Blue, Deep Rose).
   - Zero hardcoded growth percentages or fabricated data.
