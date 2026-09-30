# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
import json

class AraPosReceiptTemplate(models.Model):
    _name = 'ara.pos.receipt.template'
    _inherit = ['pos.load.mixin']
    _description = 'Ara POS Custom Receipt Template'
    _order = 'id desc'

    name = fields.Char(string='Template Name', required=True, default='Standard 80mm Receipt')
    active = fields.Boolean(default=True, string='Active')
    company_id = fields.Many2one('res.company', string='Company', default=lambda self: self.env.company)
    paper_width = fields.Selection([
        ('80mm', '80mm (Standard POS)'),
        ('58mm', '58mm (Compact / Mini POS)')
    ], string='Paper Width', default='80mm', required=True)
    font_family = fields.Selection([
        ('monospace', 'Monospace (Thermal Printer Classic)'),
        ('sans-serif', 'Sans-Serif (Modern Clean)'),
        ('serif', 'Serif (Traditional Elegance)')
    ], string='Font Family', default='monospace', required=True)
    font_size_base = fields.Selection([
        ('11px', 'Compact (11px)'),
        ('12px', 'Normal (12px)'),
        ('13px', 'Medium (13px)'),
        ('14px', 'Large (14px)')
    ], string='Base Font Size', default='12px', required=True)
    line_spacing = fields.Selection([
        ('1.1', 'Tight (1.1)'),
        ('1.3', 'Normal (1.3)'),
        ('1.5', 'Relaxed (1.5)')
    ], string='Line Spacing', default='1.3', required=True)
    show_logo = fields.Boolean(string='Show Logo', default=True)
    logo_width = fields.Integer(string='Logo Width (px)', default=120)
    custom_css = fields.Text(string='Custom CSS', help='Advanced custom CSS rules for this specific receipt template.')
    layout_json = fields.Text(string='Layout Configuration (JSON)', default=lambda self: self._get_default_layout_json())

    pos_config_ids = fields.Many2many(
        'pos.config',
        string='Linked Point of Sale',
        compute='_compute_pos_config_ids',
        inverse='_inverse_pos_config_ids',
        help='Select existing Point of Sale shops that will use this receipt template.'
    )
    pos_config_count = fields.Integer(string='POS Count', compute='_compute_pos_config_count')

    def _compute_pos_config_ids(self):
        for record in self:
            real_id = record._origin.id or (record.id if isinstance(record.id, int) else False)
            if not real_id:
                record.pos_config_ids = self.env['pos.config']
            else:
                record.pos_config_ids = self.env['pos.config'].search([('ara_receipt_template_id', '=', real_id)])

    def _inverse_pos_config_ids(self):
        for record in self:
            real_id = record._origin.id or (record.id if isinstance(record.id, int) else False)
            if not real_id:
                continue
            current_configs = self.env['pos.config'].search([('ara_receipt_template_id', '=', real_id)])
            to_remove = current_configs - record.pos_config_ids
            if to_remove:
                to_remove.write({'ara_receipt_template_id': False})
            to_add = record.pos_config_ids - current_configs
            if to_add:
                to_add.write({'ara_receipt_template_id': real_id})

    @api.depends('pos_config_ids')
    def _compute_pos_config_count(self):
        for record in self:
            record.pos_config_count = len(record.pos_config_ids)

    def _get_default_layout_json(self):
        """ Returns elegant, production-ready default receipt block structure in English """
        default_blocks = [
            {
                "id": "blk_header_default",
                "type": "header",
                "enabled": True,
                "title": "Header & Store Logo",
                "settings": {
                    "show_logo": True,
                    "logo_width": 120,
                    "show_company_name": True,
                    "company_name_size": "large",
                    "company_name_bold": True,
                    "show_address": True,
                    "show_phone": True,
                    "show_email": False,
                    "show_website": False,
                    "show_vat": True,
                    "header_text": "Welcome to Our Store!",
                    "align": "center",
                    "margin_bottom": "small"
                }
            },
            {
                "id": "blk_divider_1",
                "type": "divider",
                "enabled": True,
                "title": "Divider Line",
                "settings": {
                    "style": "dashed",
                    "margin": "small"
                }
            },
            {
                "id": "blk_order_info_default",
                "type": "order_info",
                "enabled": True,
                "title": "Transaction Info",
                "settings": {
                    "receipt_title": "SALES RECEIPT",
                    "show_title": True,
                    "show_ref": True,
                    "show_date": True,
                    "show_cashier": True,
                    "cashier_prefix": "Cashier: ",
                    "show_customer": True,
                    "show_table": True,
                    "align": "left",
                    "margin_bottom": "small"
                }
            },
            {
                "id": "blk_divider_2",
                "type": "divider",
                "enabled": True,
                "title": "Divider Line",
                "settings": {
                    "style": "dashed",
                    "margin": "small"
                }
            },
            {
                "id": "blk_orderlines_default",
                "type": "orderlines",
                "enabled": True,
                "title": "Items List",
                "settings": {
                    "layout": "detailed",
                    "show_qty": True,
                    "show_unit_price": True,
                    "show_discount": True,
                    "show_total": True,
                    "show_notes": True,
                    "show_tax_label": False,
                    "show_item_divider": True,
                    "margin_bottom": "small"
                }
            },
            {
                "id": "blk_divider_3",
                "type": "divider",
                "enabled": True,
                "title": "Divider Line",
                "settings": {
                    "style": "dashed",
                    "margin": "small"
                }
            },
            {
                "id": "blk_totals_default",
                "type": "totals",
                "enabled": True,
                "title": "Totals & Summary",
                "settings": {
                    "show_subtotal": True,
                    "show_taxes": True,
                    "show_discount": True,
                    "show_rounding": True,
                    "total_label": "TOTAL",
                    "total_size": "large",
                    "total_bold": True,
                    "show_payments": True,
                    "show_change": True,
                    "change_label": "Change",
                    "margin_bottom": "small"
                }
            },
            {
                "id": "blk_divider_4",
                "type": "divider",
                "enabled": True,
                "title": "Divider Line",
                "settings": {
                    "style": "dashed",
                    "margin": "small"
                }
            },
            {
                "id": "blk_custom_text_default",
                "type": "custom_text",
                "enabled": True,
                "title": "Store Policy & Notice",
                "settings": {
                    "content": "Items purchased cannot be returned or exchanged without the original receipt.",
                    "align": "center",
                    "font_size": "small",
                    "bold": False,
                    "italic": False,
                    "border_box": False,
                    "margin_bottom": "small"
                }
            },
            {
                "id": "blk_barcode_default",
                "type": "barcode",
                "enabled": True,
                "title": "Receipt Barcode",
                "settings": {
                    "source": "order_ref",
                    "barcode_type": "Code128",
                    "height": 40,
                    "show_human_readable": True,
                    "align": "center",
                    "margin_bottom": "small"
                }
            },
            {
                "id": "blk_qr_default",
                "type": "qr_code",
                "enabled": True,
                "title": "E-Invoice QR Code",
                "settings": {
                    "source": "portal_url",
                    "custom_url": "",
                    "label": "Scan for digital receipt & tax invoice",
                    "size": 110,
                    "align": "center",
                    "margin_bottom": "small"
                }
            },
            {
                "id": "blk_social_default",
                "type": "social_media",
                "enabled": True,
                "title": "Social Media & Promo",
                "settings": {
                    "instagram": "@ourstore.official",
                    "whatsapp": "+1 (555) 234-5678",
                    "website": "",
                    "promo_box": "Show this receipt to get a 10% discount on your next visit!",
                    "align": "center",
                    "margin_bottom": "small"
                }
            },
            {
                "id": "blk_footer_default",
                "type": "footer",
                "enabled": True,
                "title": "Receipt Footer",
                "settings": {
                    "thank_you": "Thank You for Shopping With Us!",
                    "wifi_info": "Free WiFi: ARA-GUEST | Pass: welcome123",
                    "show_powered_by": False,
                    "align": "center",
                    "margin_bottom": "none"
                }
            }
        ]
        return json.dumps(default_blocks, indent=2)

    def action_open_studio(self):
        """ Open Drag & Drop Visual Receipt Studio Client Action """
        self.ensure_one()
        return {
            'type': 'ir.actions.client',
            'tag': 'ara_studio_receipt_designer',
            'name': _('Receipt Studio - %s', self.name),
            'params': {
                'template_id': self.id,
            },
            'context': {
                'active_template_id': self.id,
            }
        }

    def action_duplicate_template(self):
        """ Duplicate current template """
        self.ensure_one()
        new_template = self.copy({
            'name': _('%s (Copy)', self.name),
        })
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'ara.pos.receipt.template',
            'res_id': new_template.id,
            'view_mode': 'form',
            'target': 'current',
        }

    def action_reset_to_default(self):
        """ Reset layout to default blocks """
        for record in self:
            record.layout_json = record._get_default_layout_json()
        return True

    @api.model
    def _load_pos_data_domain(self, data):
        config_data = data.get('pos.config', {}).get('data', [])
        company_id = False
        if config_data:
            config_id = config_data[0].get('id')
            if config_id:
                company_id = self.env['pos.config'].browse(config_id).company_id.id
        if not company_id:
            company_id = self.env.company.id
        return [('company_id', 'in', [False, company_id]), ('active', '=', True)]

    @api.model
    def _load_pos_data_fields(self, config_id):
        return [
            'id', 'name', 'paper_width', 'font_family', 'font_size_base',
            'line_spacing', 'show_logo', 'logo_width', 'custom_css', 'layout_json'
        ]
