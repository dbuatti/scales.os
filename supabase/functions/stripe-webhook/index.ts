// Supabase Edge Function: Stripe webhook
//
// Deploy:
//   supabase functions deploy stripe-webhook
//   supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_...
//
// Stripe Dashboard → Webhooks → Add endpoint:
//   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//   Events: checkout.session.completed, customer.subscription.updated,
//           customer.subscription.deleted
//
// The service-role client bypasses RLS on purpose. The scales_profiles plan
// trigger allows service-role writes (auth.uid() is null) so this can grant plans.
import Stripe from 'https://esm.sh/stripe@16.12.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4?target=deno';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
};

const ACTIVE = new Set(['active', 'trialing']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!secret || !webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response('Missing Stripe or Supabase configuration', { status: 500 });
  }

  const stripe = new Stripe(secret, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature ?? '', webhookSecret);
  } catch (error) {
    return new Response(`Webhook Error: ${(error as Error).message}`, { status: 400 });
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const object = event.data.object as Stripe.Checkout.Session | Stripe.Subscription;
    const record = object as unknown as {
      client_reference_id?: string | null;
      customer_email?: string | null;
      customer_details?: { email?: string | null } | null;
      payment_status?: string;
      status?: string;
    };

    let plan: 'free' | 'pro' = 'free';
    if (event.type === 'checkout.session.completed') {
      plan = record.payment_status === 'paid' && record.status === 'complete' ? 'pro' : 'free';
    } else if (ACTIVE.has(record.status ?? '')) {
      plan = 'pro';
    }

    const email = record.customer_details?.email ?? record.customer_email ?? null;
    const clientRef = record.client_reference_id ?? null;

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let query = supabase.from('scales_profiles').update({ plan });
    if (clientRef) {
      query = query.eq('id', clientRef);
    } else if (email) {
      query = query.eq('email', email);
    } else {
      return new Response('No user reference on checkout session', { status: 400 });
    }

    const { error } = await query;
    if (error) return new Response(error.message, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});