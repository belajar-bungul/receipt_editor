/** @odoo-module **/

import { Component } from "@odoo/owl";
import { formatCurrency } from "@web/core/currency";
import { generateQRCodeDataUrl } from "@point_of_sale/utils";

export class AraCustomReceipt extends Component {
    static template = "ara_studio_print_receipt_pos.AraCustomReceipt";
    static props = {
        order: Object,
        template: [Object, Boolean],
        formatCurrency: { type: Function, optional: true },
    };

    get order() {
        return this.props.order;
    }

    get template() {
        return this.props.template;
    }

    get blocks() {
        try {
            const rawJson = this.template?.layout_json;
            if (!rawJson) return [];
            const parsed = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
            if (!Array.isArray(parsed)) return [];
            return parsed.filter((b) => b && b.enabled !== false);
        } catch (err) {
            console.error("AraCustomReceipt: Gagal mem-parse layout JSON:", err);
            return [];
        }
    }

    formatCurrency(amount) {
        if (this.props.formatCurrency) {
            return this.props.formatCurrency(amount);
        }
        if (this.order?.currency?.id) {
            return formatCurrency(amount, this.order.currency.id);
        }
        return amount;
    }

    get company() {
        return this.order?.company || {};
    }

    get logoUrl() {
        if (this.order?.config?.receiptLogoUrl) {
            return this.order.config.receiptLogoUrl;
        }
        if (this.company?.id) {
            return `/web/image/res.company/${this.company.id}/logo`;
        }
        return "";
    }

    get cashierName() {
        return this.order?.getCashierName ? this.order.getCashierName() : "";
    }

    get orderlines() {
        if (this.order?.lines) {
            return this.order.lines;
        }
        if (this.order?.getOrderlines) {
            return this.order.getOrderlines();
        }
        return [];
    }

    get paymentLines() {
        if (this.order?.payment_ids) {
            return this.order.payment_ids.filter((p) => !p.is_change);
        }
        return [];
    }

    getBarcodeUrl(ref) {
        const value = ref || this.order?.pos_reference || this.order?.name || "";
        return `/report/barcode/?barcode_type=Code128&value=${encodeURIComponent(value)}&width=600&height=100&humanreadable=0`;
    }

    getQRCodeUrl(source, customUrl) {
        try {
            if (source === "portal_url") {
                const baseUrl = this.order?.config?._base_url || window.location.origin;
                const url = `${baseUrl}/pos/ticket/validate?access_token=${this.order?.access_token || ""}`;
                return generateQRCodeDataUrl(url);
            }
            if (customUrl) {
                return generateQRCodeDataUrl(customUrl);
            }
            return generateQRCodeDataUrl(window.location.origin);
        } catch (err) {
            console.error("AraCustomReceipt: Gagal membuat QR Code:", err);
            return "";
        }
    }

    getTaxTotals() {
        return this.order?.prices?.taxDetails || null;
    }

    getTotalDiscount() {
        return this.order?.getTotalDiscount ? this.order.getTotalDiscount() : 0;
    }

    getGrandTotal() {
        if (this.order?.currencyDisplayPriceIncl) {
            return this.order.currencyDisplayPriceIncl;
        }
        if (this.order?.priceIncl !== undefined) {
            return this.formatCurrency(this.order.priceIncl);
        }
        return "";
    }

    getChange() {
        if (this.order?.showChange && this.order?.change !== undefined) {
            return this.formatCurrency(this.order.change);
        }
        return null;
    }

    getLineName(line) {
        if (line.get_full_product_name) {
            return line.get_full_product_name();
        }
        return line.full_product_name || line.product_id?.display_name || line.product_id?.name || "";
    }

    getLinePrice(line) {
        return line.prices?.unit_price ?? line.price_unit ?? 0;
    }

    getLineTotal(line) {
        return line.prices?.total_included ?? line.price_subtotal_incl ?? (line.qty * (line.price_unit || 0));
    }
}
