# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class PosConfig(models.Model):
    _inherit = 'pos.config'

    ara_receipt_template_id = fields.Many2one(
        'ara.pos.receipt.template',
        string='Receipt Design (Studio)',
        help='Select a custom receipt design created with Ara Receipt Studio.'
    )


    def action_open_receipt_studio(self):
        """ Open linked receipt template in Studio, or select an existing template """
        self.ensure_one()
        template = self.ara_receipt_template_id
        if not template:
            # Check for an existing active template for this company first
            existing_template = self.env['ara.pos.receipt.template'].search([
                ('company_id', 'in', [False, self.company_id.id]),
                ('active', '=', True),
            ], limit=1)
            if existing_template:
                template = existing_template
                self.ara_receipt_template_id = template.id
            else:
                template = self.env['ara.pos.receipt.template'].create({
                    'name': _('%s Receipt', self.name),
                    'company_id': self.company_id.id,
                })
                self.ara_receipt_template_id = template.id

        return {
            'type': 'ir.actions.client',
            'tag': 'ara_studio_receipt_designer',
            'name': _('Receipt Studio - %s', template.name),
            'params': {
                'template_id': template.id,
                'pos_config_id': self.id,
            },
            'context': {
                'active_template_id': template.id,
                'active_pos_config_id': self.id,
            }
        }
