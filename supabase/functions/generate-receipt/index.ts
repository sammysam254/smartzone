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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the user token and get user info
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error("Authentication error:", authError);
      throw new Error("Unauthorized");
    }

    console.log("Authenticated user:", user.id);

    const { orderId } = await req.json();
    if (!orderId) throw new Error("Order ID is required");

    console.log("Fetching order:", orderId, "for user:", user.id);

    // Use service role to bypass RLS for this administrative function
    // but still validate user ownership
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

    if (orderError) {
      console.error("Order fetch error:", orderError);
      throw new Error(`Order fetch failed: ${orderError.message}`);
    }
    
    if (!order) {
      console.error("No order found for ID:", orderId, "and user:", user.id);
      throw new Error("Order not found or access denied");
    }

    console.log("Order found:", order.id, "Status:", order.status);

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

    // Use the company logo from the uploaded assets
    const logoUrl = "https://axihtddcqfotuyelfdqj.supabase.co/storage/v1/object/public/lovable-uploads/e794c35d-09b9-447c-9ad8-265176240bde.png";

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
            padding: 15px; 
            background-color: white;
            color: #333;
            font-size: 12px;
          }
          .receipt {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            padding: 15px;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e0e0e0;
          }
          .logo {
            max-height: 50px;
            margin-bottom: 5px;
          }
          .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            margin: 5px 0;
          }
          .contact-info {
            font-size: 10px;
            color: #666;
            line-height: 1.3;
          }
          .receipt-title {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
            color: #27ae60;
          }
          .receipt-info {
            text-align: center;
            color: #666;
            margin-bottom: 15px;
            font-size: 10px;
          }
          .section {
            margin: 10px 0;
          }
          .section-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #2c3e50;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 2px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
          }
          .info-item {
            display: flex;
            margin-bottom: 3px;
            font-size: 10px;
          }
          .info-label {
            font-weight: bold;
            min-width: 80px;
            color: #555;
          }
          .info-value {
            color: #333;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            background: white;
            font-size: 10px;
          }
          .table th, .table td {
            border: 1px solid #ddd;
            padding: 6px;
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
          }
          .payment-confirmed {
            background-color: #d4edda;
            color: #155724;
            padding: 8px;
            border-radius: 3px;
            text-align: center;
            font-weight: bold;
            margin: 10px 0;
            font-size: 10px;
          }
          .mpesa-highlight {
            background-color: #e8f5e8;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            border-left: 3px solid #27ae60;
            margin: 10px 0;
          }
          .mpesa-code {
            font-size: 16px;
            font-weight: bold;
            color: #155724;
            letter-spacing: 1px;
            font-family: monospace;
            background-color: #f8f9fa;
            padding: 5px;
            border-radius: 3px;
            margin: 5px 0;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 10px;
          }
          .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-paid {
            background-color: #d4edda;
            color: #155724;
          }
          @media print {
            body { margin: 0; padding: 10px; background: white; }
            .receipt { margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <img src="${logoUrl}" alt="SmartHub Computers Logo" class="logo" />
            <div class="company-name">SmartHub Computers</div>
            <div class="contact-info">
              Koinange Street Uniafric House Room 208<br>
              Phone: 0704144239 | Email: support@smarthubcomputers.com
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

          ${transactionCode !== 'N/A' ? `
          <div class="mpesa-highlight">
            <div class="section-title" style="color: #27ae60; margin-bottom: 5px;">📱 M-Pesa Confirmation Code</div>
            <div class="mpesa-code">${transactionCode}</div>
          </div>
          ` : ''}

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
                  <span class="info-label">Confirmation Code:</span>
                  <span class="info-value" style="font-weight: bold; color: #27ae60; font-size: 16px; letter-spacing: 1px;">${transactionCode}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Phone Number:</span>
                  <span class="info-value">${payment?.phone_number || order.customer_phone || 'N/A'}</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">Payment Date:</span>
                  <span class="info-value">${new Date(order.created_at).toLocaleDateString('en-KE')}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Payment Time:</span>
                  <span class="info-value">${new Date(order.created_at).toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="info-value" style="color: #27ae60; font-weight: bold;">CONFIRMED ✓</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>Thank you for choosing SmartHub Computers!</strong></p>
            <p>This is an official payment confirmation receipt. Keep this for your records.</p>
            <p>For support or inquiries, contact us at support@smarthubcomputers.com or call 0704144239</p>
            <p><strong>M-Pesa Reference: ${transactionCode}</strong></p>
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
      total: total.toLocaleString(),
      mpesaCode: transactionCode
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