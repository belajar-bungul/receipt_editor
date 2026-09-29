# -*- coding: utf-8 -*-
from odoo import models, api

class PosSession(models.Model):
    _inherit = 'pos.session'

    @api.model
    def _load_pos_data_models(self, config):
        """ Menambahkan model template struk kustom agar otomatis termuat ke pos_store frontend """
        data = super()._load_pos_data_models(config)
        data.append('ara.pos.receipt.template')
        return data
