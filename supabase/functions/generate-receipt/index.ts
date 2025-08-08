import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user) throw new Error("Unauthorized");

    const { orderId } = await req.json();
    if (!orderId) throw new Error("Order ID is required");

    // Fetch order details with product and payment information
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_urls
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found or access denied");
    }

    // Fetch payment information (M-Pesa or NCBA Loop)
    const [mpesaPayment, ncbaPayment] = await Promise.all([
      supabaseClient
        .from('mpesa_payments')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle(),
      supabaseClient
        .from('ncba_loop_payments')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle()
    ]);

    const payment = mpesaPayment.data || ncbaPayment.data;
    const paymentMethod = mpesaPayment.data ? 'M-Pesa' : ncbaPayment.data ? 'NCBA Loop' : 'Unknown';
    const transactionCode = payment?.transaction_id || payment?.transaction_reference || 'N/A';

    // Calculate pricing
    const subtotal = order.total_amount;
    const vat = subtotal * 0.16;
    const total = subtotal + vat;

    // Generate HTML receipt
    const receiptHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt - Order #${order.id.slice(0, 8)}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f9f9f9;
            color: #333;
          }
          .receipt {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
          }
          .logo {
            max-height: 80px;
            margin-bottom: 15px;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin: 10px 0;
          }
          .contact-info {
            font-size: 14px;
            color: #666;
            line-height: 1.5;
          }
          .receipt-title {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            color: #27ae60;
          }
          .receipt-info {
            text-align: center;
            color: #666;
            margin-bottom: 25px;
          }
          .section {
            margin: 25px 0;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #2c3e50;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .info-item {
            display: flex;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            min-width: 120px;
            color: #555;
          }
          .info-value {
            color: #333;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
          }
          .table th, .table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #2c3e50;
          }
          .table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .total-row {
            font-weight: bold;
            background-color: #e8f5e8 !important;
            font-size: 16px;
          }
          .payment-confirmed {
            background-color: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 12px;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-paid {
            background-color: #d4edda;
            color: #155724;
          }
          @media print {
            body { margin: 0; padding: 15px; background: white; }
            .receipt { box-shadow: none; margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="company-name">SmartHub Computers</div>
            <div class="contact-info">
              Koinange Street Uniafric House Room 208<br>
              Phone: 0704144239 | Email: support@smarthubcomputers.com<br>
              www.smarthubcomputers.com
            </div>
          </div>

          <div class="receipt-title">PAYMENT CONFIRMATION RECEIPT</div>
          <div class="receipt-info">
            Receipt #${order.id}<br>
            Date: ${new Date().toLocaleDateString('en-KE', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              timeZone: 'Africa/Nairobi'
            })}<br>
            Time: ${new Date().toLocaleTimeString('en-KE', { 
              timeZone: 'Africa/Nairobi' 
            })}
          </div>

          <div class="payment-confirmed">
            ✓ PAYMENT CONFIRMED & VERIFIED
            <span class="status-badge status-paid">${order.status}</span>
          </div>

          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${order.customer_name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${order.customer_email}</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${order.customer_phone || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Address:</span>
                  <span class="info-value">${order.shipping_address}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Order Details</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price (KES)</th>
                  <th>Total (KES)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${order.products?.name || 'Product'}</td>
                  <td>${order.quantity}</td>
                  <td>${(order.total_amount / order.quantity).toLocaleString()}</td>
                  <td>${order.total_amount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right; font-weight: bold;">Subtotal</td>
                  <td style="font-weight: bold;">KES ${subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right; font-weight: bold;">VAT (16%)</td>
                  <td style="font-weight: bold;">KES ${vat.toLocaleString()}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;">TOTAL AMOUNT</td>
                  <td>KES ${total.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Payment Information</div>
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="info-label">Payment Method:</span>
                  <span class="info-value">${paymentMethod}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Transaction Code:</span>
                  <span class="info-value">${transactionCode}</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">Payment Date:</span>
                  <span class="info-value">${new Date(order.created_at).toLocaleDateString('en-KE')}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="info-value" style="color: #27ae60; font-weight: bold;">CONFIRMED</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>Thank you for choosing SmartHub Computers!</strong></p>
            <p>This is an official payment confirmation receipt. Keep this for your records.</p>
            <p>For support or inquiries, contact us at support@smarthubcomputers.com or call 0704144239</p>
            <p style="margin-top: 15px; font-size: 11px;">
              Generated on ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return new Response(JSON.stringify({ 
      html: receiptHtml,
      orderId: order.id,
      customerName: order.customer_name,
      total: total.toLocaleString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Receipt generation error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to generate receipt" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});