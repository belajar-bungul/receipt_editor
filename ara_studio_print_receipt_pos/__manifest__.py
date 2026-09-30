# -*- coding: utf-8 -*-
{
    'name': 'Ara POS Receipt Studio - Drag & Drop Receipt Designer',
    'version': '18.0.1.0.0',
    'category': 'Point of Sale',
    'summary': 'Visual No-Code Drag & Drop POS Receipt Customizer with Custom HTML, Dynamic Fields, Barcode, QR Code & Multi-width (80mm/58mm) Support',
    'description': """
Ara POS Receipt Studio (Odoo 18)
================================
Visually design and customize your Point of Sale (POS) receipts with drag-and-drop ease, without touching any code.

Key Features:
-------------
* **Visual Drag & Drop Studio:** Intuitive 3-panel workspace (Palette, Thermal Simulator, Property Inspector).
* **11 Out-of-the-Box Component Blocks:**
  - Header & Store Logo (Business Name, Address, Contact, Phone, Email, Website, Tax ID / VAT, Tagline)
  - Transaction Info (Receipt Title, Order Number, Date/Time, Cashier, Customer Name, Restaurant Table)
  - Items List (Detailed 2-line or Compact 1-line mode, toggle Qty, Unit Price, Line Discount, Line Total, Customer Notes)
  - Totals & Summary (Subtotal, Tax Group Details, Discounts, Rounding, Custom Grand Total styling, Payment Lines, Change Due)
  - Custom Text (Free message, return policy, warranty terms with font size, bold, italic, border box)
  - Custom HTML Block (Insert custom HTML, inline CSS, FontAwesome icons, colored banners, promo tables)
  - Receipt Barcode (Automatic Code128 barcode from transaction reference with human-readable text)
  - E-Invoice QR Code (Standard Odoo ticket validation portal URL or custom promotional web link)
  - Divider Lines (Dashed, solid, double, dotted, stars, or blank spacing)
  - Social Media & Promo (Instagram, WhatsApp, Website, and next-visit discount coupon box)
  - Footer & WiFi (Thank you note, store WiFi network name & password, powered-by text)
* **Multi-Paper Width Support:**
  - 80mm (Standard POS Desktop Thermal Printers)
  - 58mm (Mini Portable / Mobile Bluetooth Thermal Printers)
* **Real-Time Live Simulator & Physical Test Print:** Preview changes instantly with realistic sample data and print test receipts directly to your thermal printer.
* **100% Native Odoo 18 Architecture:** Fully integrated with POS session loading (pos.load.mixin) and OWL components.
    """,
    'author': 'ARA SOFT',
    'website': 'https://www.arasoft.id',
    'license': 'OPL-1',
    'depends': [
        'base',
        'web',
        'point_of_sale',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/default_templates_data.xml',
        'views/pos_receipt_template_views.xml',
        'views/pos_config_views.xml',
        'views/menus.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'ara_studio_print_receipt_pos/static/src/backend/receipt_studio/receipt_studio.scss',
            'ara_studio_print_receipt_pos/static/src/backend/receipt_studio/receipt_studio.js',
            'ara_studio_print_receipt_pos/static/src/backend/receipt_studio/receipt_studio.xml',
        ],
        'point_of_sale._assets_pos': [
            'ara_studio_print_receipt_pos/static/src/pos/models/pos_receipt_template.js',
            'ara_studio_print_receipt_pos/static/src/pos/ara_custom_receipt/ara_custom_receipt.scss',
            'ara_studio_print_receipt_pos/static/src/pos/ara_custom_receipt/ara_custom_receipt.js',
            'ara_studio_print_receipt_pos/static/src/pos/ara_custom_receipt/ara_custom_receipt.xml',
            'ara_studio_print_receipt_pos/static/src/pos/overrides/order_receipt.js',
            'ara_studio_print_receipt_pos/static/src/pos/overrides/order_receipt.xml',
        ],
    },
    'images': [
        'static/description/banner.png',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'price': 66.66,
    'currency': 'USD',
}
