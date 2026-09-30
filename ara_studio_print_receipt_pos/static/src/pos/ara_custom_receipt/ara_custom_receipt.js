/** @odoo-module **/

import { Component } from "@odoo/owl";
import { formatCurrency } from "@web/core/currency";
import { qrCodeSrc } from "@point_of_sale/utils";

export class AraCustomReceipt extends Component {
    static template = "ara_studio_print_receipt_pos.AraCustomReceipt";
    static props = {
        data: { type: Object, optional: true },
        order: { type: [Object, Boolean], optional: true },
        template: [Object, Boolean],
        formatCurrency: { type: Function, optional: true },
    };

    get data() {
        return this.props.data || {};
    }

    get order() {
        return this.props.order || this.props.data || {};
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
            console.error("AraCustomReceipt: Failed to parse layout JSON:", err);
            return [];
        }
    }

    formatCurrency(amount) {
        if (this.props.formatCurrency) {
            return this.props.formatCurrency(amount);
        }
        if (this.env?.utils?.formatCurrency) {
            return this.env.utils.formatCurrency(amount);
        }
        if (this.order?.currency?.id) {
            return formatCurrency(amount, this.order.currency.id);
        }
        if (typeof amount === "number") {
            return amount.toFixed(2);
        }
        return amount || "";
    }

    get company() {
        return (
            this.data?.headerData?.company ||
            this.order?.company ||
            this.env?.services?.pos?.company ||
            {}
        );
    }

    get logoUrl() {
        if (this.company?.logoUrl) {
            return this.company.logoUrl;
        }
        if (this.order?.config?.receiptLogoUrl) {
            return this.order.config.receiptLogoUrl;
        }
        if (this.company?.id) {
            return `/web/image?model=res.company&id=${this.company.id}&field=logo`;
        }
        return "";
    }

    get receiptRef() {
        return (
            this.data?.name ||
            this.order?.pos_reference ||
            this.order?.name ||
            this.order?.ref ||
            ""
        );
    }

    get receiptDate() {
        return (
            this.data?.date ||
            (this.order?.formatDateOrTime ? this.order.formatDateOrTime("date_order") : this.order?.date_order) ||
            this.order?.date ||
            ""
        );
    }

    get cashierName() {
        return (
            this.data?.cashier ||
            (this.order?.getCashierName ? this.order.getCashierName() : this.order?.cashier) ||
            this.data?.headerData?.cashier ||
            ""
        );
    }

    get customerName() {
        return (
            this.data?.headerData?.partner?.name ||
            this.data?.partner?.name ||
            this.order?.partner_id?.name ||
            this.order?.customer ||
            ""
        );
    }

    get tableName() {
        return (
            this.data?.headerData?.table ||
            this.order?.table_id?.name ||
            this.order?.self_ordering_table_id?.name ||
            this.order?.table ||
            ""
        );
    }

    get orderlines() {
        if (this.data?.orderlines && this.data.orderlines.length > 0) {
            return this.data.orderlines;
        }
        if (this.order?.lines && this.order.lines.length > 0) {
            return this.order.lines;
        }
        if (this.order?.getOrderlines) {
            return this.order.getOrderlines();
        }
        return [];
    }

    getLineName(line) {
        return (
            line.productName ||
            line.full_product_name ||
            (line.get_full_product_name && line.get_full_product_name()) ||
            line.product_id?.display_name ||
            line.name ||
            ""
        );
    }

    getLineQty(line) {
        if (line.qty !== undefined) return line.qty;
        if (line.quantity !== undefined) return line.quantity;
        return 1;
    }

    getLinePrice(line) {
        if (typeof line.unitPrice === "string" && line.unitPrice) {
            return line.unitPrice;
        }
        const val = line.unitPrice ?? line.prices?.unit_price ?? line.price_unit ?? line.price ?? 0;
        return this.formatCurrency(val);
    }

    getLineDiscount(line) {
        return line.discount || 0;
    }

    getLineTotal(line) {
        if (typeof line.price === "string" && line.price && line.price !== "free") {
            return line.price;
        }
        if (line.price === "free") {
            return "Free";
        }
        const val =
            line.price ??
            line.total ??
            line.prices?.total_included ??
            line.price_subtotal_incl ??
            (Number(this.getLineQty(line)) * Number(line.unitPrice || line.price_unit || 0));
        return this.formatCurrency(val);
    }

    getLineNote(line) {
        return line.customerNote || line.note || "";
    }

    getTaxList() {
        const taxTotals = this.data?.taxTotals || this.order?.taxTotals;
        if (taxTotals && taxTotals.has_tax_groups && taxTotals.subtotals) {
            const list = [];
            for (const sub of taxTotals.subtotals) {
                for (const grp of sub.tax_groups || []) {
                    list.push({
                        name: grp.group_name || grp.group_label || "Tax",
                        amount: grp.tax_amount_currency || 0,
                    });
                }
            }
            if (list.length > 0) return list;
        }

        if (Array.isArray(this.order?.taxes)) {
            return this.order.taxes;
        }

        const taxDetails = this.order?.prices?.taxDetails || this.data?.tax_details;
        if (Array.isArray(taxDetails)) {
            return taxDetails.map((t) => ({
                name: t.tax?.name || t.name || "Tax",
                amount: t.amount || 0,
            }));
        }

        return [];
    }

    getSubtotal() {
        if (this.data?.total_without_tax !== undefined) {
            return this.formatCurrency(this.data.total_without_tax);
        }
        if (this.order?.subtotal !== undefined) {
            return this.formatCurrency(this.order.subtotal);
        }
        if (this.order?.priceExcl !== undefined) {
            return this.formatCurrency(this.order.priceExcl);
        }
        return "";
    }

    getTotalDiscount() {
        if (this.data?.total_discount) {
            return this.formatCurrency(this.data.total_discount);
        }
        if (this.order?.discount) {
            return this.formatCurrency(this.order.discount);
        }
        if (this.order?.getTotalDiscount) {
            const d = this.order.getTotalDiscount();
            return d ? this.formatCurrency(d) : null;
        }
        return null;
    }

    getRounding() {
        if (this.data?.show_rounding && this.data?.order_rounding) {
            return this.formatCurrency(this.data.order_rounding);
        }
        if (this.order?.appliedRounding) {
            return this.formatCurrency(this.order.appliedRounding);
        }
        if (this.order?.rounding) {
            return this.formatCurrency(this.order.rounding);
        }
        return null;
    }

    getGrandTotal() {
        if (this.data?.amount_total !== undefined) {
            return this.formatCurrency(this.data.amount_total);
        }
        const taxTotals = this.data?.taxTotals || this.order?.taxTotals;
        if (taxTotals?.order_total !== undefined) {
            const sign = taxTotals.order_sign || 1;
            return this.formatCurrency(sign * taxTotals.order_total);
        }
        if (this.order?.grandTotal !== undefined) {
            return typeof this.order.grandTotal === "number"
                ? this.formatCurrency(this.order.grandTotal)
                : this.order.grandTotal;
        }
        if (this.order?.currencyDisplayPriceIncl) {
            return this.order.currencyDisplayPriceIncl;
        }
        if (this.order?.priceIncl !== undefined) {
            return this.formatCurrency(this.order.priceIncl);
        }
        return "";
    }

    getPaymentList() {
        const rawPayments =
            this.data?.paymentlines ||
            (this.order?.payment_ids && this.order.payment_ids.filter((p) => !p.is_change)) ||
            this.order?.payments ||
            [];
        return rawPayments.map((p) => ({
            name: p.name || p.payment_method_id?.name || p.payment_method?.name || "Payment",
            amount: p.amount ?? (p.getAmount ? p.getAmount() : 0),
        }));
    }

    getChange() {
        if (this.data?.show_change && this.data?.order_change !== undefined) {
            return this.formatCurrency(this.data.order_change);
        }
        if (this.order?.change !== undefined && (this.order.showChange || this.order.change > 0)) {
            return this.formatCurrency(this.order.change);
        }
        return null;
    }

    getBarcodeUrl(ref) {
        const value = ref || this.receiptRef || "";
        return `/report/barcode/?barcode_type=Code128&value=${encodeURIComponent(value)}&width=600&height=100&humanreadable=0`;
    }

    getQRCodeUrl(source, customUrl) {
        try {
            if (source === "portal_url") {
                const baseUrl = this.data?.base_url || this.order?.config?._base_url || window.location.origin;
                const token = this.data?.ticket_code || this.order?.access_token || "";
                const url = `${baseUrl}/pos/ticket/validate?access_token=${token}`;
                return qrCodeSrc(url, { size: 200 });
            }
            if (customUrl) {
                return qrCodeSrc(customUrl, { size: 200 });
            }
            return qrCodeSrc(window.location.origin, { size: 200 });
        } catch (err) {
            console.error("AraCustomReceipt: Failed to generate QR Code:", err);
            return "";
        }
    }
}
