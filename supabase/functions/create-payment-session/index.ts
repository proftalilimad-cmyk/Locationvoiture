// Supabase Edge Function: create-payment-session
// Creates a server-side payment session with Moroccan Acquiring Gateway abstraction (CMI / Payzone / NAPS)
// Never trusts client-side price calculations; re-verifies booking total from PostgreSQL.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, paymentPlan, provider = 'cmi_morocco_sandbox' } = await req.json();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return new Response(JSON.stringify({ error: 'Réservation introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionId = `SES-${Date.now()}-${ crypto.randomUUID().slice(0, 8).toUpperCase() }`;
    const idempotencyKey = `IDEM-${bookingId}-${paymentPlan}-${Date.now()}`;

    await supabase.from('payments').insert({
      booking_id: booking.id,
      provider,
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      payment_type: paymentPlan === 'full_100' ? 'rental_full' : 'rental_deposit',
      amount_mad: booking.amount_due_online_mad,
      currency: 'MAD',
      status: 'pending',
    });

    return new Response(
      JSON.stringify({
        sessionId,
        idempotencyKey,
        amountMad: booking.amount_due_online_mad,
        refundableDepositMad: booking.refundable_deposit_mad,
        provider,
        liveGatewayConfigured: Boolean(Deno.env.get('CMI_MERCHANT_SECRET')),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
