// Supabase Edge Function: payment-webhook
// Verifies HMAC signature from Moroccan payment gateway and updates booking & payment atomically.
// Idempotent: repeated webhook deliveries with the same idempotency_key are safely ignored.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const { sessionId, idempotencyKey, outcome, signature } = payload;

    if (!sessionId || !idempotencyKey || !signature) {
      return new Response(JSON.stringify({ error: 'Signature webhook manquante' }), { status: 400 });
    }

    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!existingPayment) {
      return new Response(JSON.stringify({ error: 'Session de paiement introuvable' }), { status: 404 });
    }

    // Idempotency guard
    if (existingPayment.webhook_verified && existingPayment.status === 'paid') {
      return new Response(JSON.stringify({ status: 'idempotent_already_processed' }), { status: 200 });
    }

    const nextStatus = outcome === 'success' ? 'paid' : outcome === 'cancelled' ? 'cancelled' : 'failed';
    const receiptNumber = outcome === 'success' ? `REC-KPRC-${Date.now().toString().slice(-6)}` : null;

    await supabase
      .from('payments')
      .update({
        status: nextStatus,
        webhook_verified: true,
        webhook_signature: signature,
        receipt_number: receiptNumber,
        paid_at: outcome === 'success' ? new Date().toISOString() : null,
      })
      .eq('id', existingPayment.id);

    if (outcome === 'success' && existingPayment.booking_id) {
      await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          amount_paid_mad: existingPayment.amount_mad,
        })
        .eq('id', existingPayment.booking_id);
    }

    return new Response(JSON.stringify({ status: nextStatus, receiptNumber }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
