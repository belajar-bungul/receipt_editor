# Ara POS Receipt Studio - Drag & Drop Receipt Designer (Odoo 19)

Enterprise-grade Odoo 19 module to design and customize Point of Sale (POS) thermal receipts visually using an intuitive Drag & Drop Studio without touching any code.

## 🚀 Key Highlights

1. **Visual Drag & Drop Studio Builder:**
   - Modern 3-panel workspace: Component Palette (left), Realistic Thermal Simulator (center), and Property Inspector (right).
   - Effortlessly reorder blocks with drag handles (`⠿`) or quick arrow buttons (`▲`/`▼`).
   - Add, duplicate, toggle, or delete blocks with a single click.

2. **11 Modular Component Blocks:**
   - **Header & Store Logo:** Company logo with adjustable size slider, store name, address, phone, email, website, Tax ID / VAT, and welcome tagline.
   - **Transaction Info:** Custom receipt title, order number, date & time, cashier name, customer contact, and table/floor for restaurants.
   - **Items List (Orderlines):** Detailed (2 lines) or Compact (1 line) layout, customizable columns for Qty, unit price, discounts, subtotal, customer notes, and item dividers.
   - **Totals & Summary:** Subtotal, grouped tax breakdown, total discounts, cash rounding, customizable grand total typography, payment lines breakdown, and change due.
   - **Custom Text:** Insert any return policies, warranty terms, or notices with alignment, size, bold, italic, and border box styling.
   - **Custom HTML Block:** Raw HTML code support for inserting custom badges, FontAwesome icons, colored promo tables, and custom inline CSS.
   - **Receipt Barcode:** Automatic Code128 barcode generated from order reference with human-readable code.
   - **E-Invoice QR Code:** Odoo ticket portal validation QR code or custom promo website link.
   - **Social Media & Promo:** Instagram handle, WhatsApp number, website, and next-visit coupon box.
   - **Divider Lines:** Dashed (`---`), solid (`___`), double (`===`), dotted (`...`), stars (`***`), or blank spacing.
   - **Footer & WiFi:** Thank you message, customer WiFi credentials, and optional branding.

3. **Multi-Paper Width Support:**
   - **80mm (Standard POS):** Optimized for standard desktop thermal receipt printers (Epson, Sunmi, Star, etc.).
   - **58mm (Mini POS):** Proportional compact layout for portable and mobile Bluetooth thermal printers.

4. **Testing & Reliability:**
   - Real-time simulation with realistic sample data.
   - In-studio **Test Print** to verify output on physical printers directly from the browser.
   - **Reset to Default** preset to restore standard layout anytime.

## 📁 Directory Structure

```text
ara_studio_print_receipt_pos/
├── __init__.py
├── __manifest__.py
├── README.md
├── models/
│   ├── __init__.py
│   ├── pos_receipt_template.py     # Template model & JSON layout engine (pos.load.mixin)
│   ├── pos_config.py               # Template relation & launcher action on POS config
│   └── pos_session.py              # Loads template into pos_store memory
├── views/
│   ├── pos_receipt_template_views.xml # List, form, and search views for templates
│   ├── pos_config_views.xml        # Studio launcher setting in POS configuration
│   └── menus.xml                   # Menu: POS > Configuration > Receipt Studio
├── security/
│   └── ir.model.access.csv         # Security access rights
├── data/
│   └── default_templates_data.xml  # Pre-configured templates: 80mm Standard & 58mm Compact
└── static/
    ├── description/
    │   ├── icon.png                # Module application icon
    │   └── index.html              # Module documentation page
    └── src/
        ├── backend/
        │   └── receipt_studio/
        │       ├── receipt_studio.js   # OWL Component Drag & Drop Studio Builder
        │       ├── receipt_studio.xml  # 3-Panel Visual Designer Template
        │       └── receipt_studio.scss # Realistic Thermal Paper & Studio styling
        └── pos/
            ├── ara_custom_receipt/
            │   ├── ara_custom_receipt.js   # Dynamic POS receipt renderer
            │   ├── ara_custom_receipt.xml  # Reactive receipt template
            │   └── ara_custom_receipt.scss # Thermal print styling (80mm & 58mm)
            └── overrides/
                ├── order_receipt.js    # Patch for Odoo 19 OrderReceipt
                └── order_receipt.xml   # Template extension for Odoo 19 POS
```

## 🛠 Installation & Usage

1. Module is located in `/Users/arasoft/Documents/odoo19/v19_test/ara_studio_print_receipt_pos`.
2. Upgrade/install in Odoo:
   ```bash
   python3 odoo-bin -c odoo.conf -u ara_studio_print_receipt_pos
   ```
3. Navigate to **Point of Sale > Configuration > Receipt Studio**.
4. Open an existing template or create a new one, then click **🎨 Open Drag & Drop Studio**.
5. Arrange your blocks, customize the settings, click **Save Design**, and select the template in your Point of Sale settings!
