// Supabase Edge Function: Stripe webhook
//
// Deploy:
//   supabase functions deploy stripe-webhook --no-verify-jwt
//   supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_...
//
// Stripe signs requests with its own signature, so JWT verification must be off.
//
// Apply first: supabase/migrations/0008_stripe_customer.sql
//
// Stripe Dashboard → Webhooks → Add endpoint:
//   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//   Events: checkout.session.completed, customer.subscription.created,
//           customer.subscription.updated, customer.subscription.deleted
//
// Checkout carries client_reference_id (the Supabase user id) and we save the
// Stripe customer id on the profile. Later subscription events carry only that
// customer id, which is how cancellations can finally downgrade the account.
//
// The service-role client bypasses RLS on purpose. The scales_profiles plan
// trigger allows service-role writes (auth.uid() is null) so this can grant plans.
import Stripe from 'https://esm.sh/stripe@16.12.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4?target=deno';
import {
  customerEmail,
  planFromCheckoutSession,
  planFromSubscription,
  stripeCustomerId,
  type StripeEventObject,
} from './billing.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
};

const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!secret || !webhookSecret || !supabaseUrl || !serviceKey) {
    return json({ error: 'Missing Stripe or Supabase configuration' }, 500);
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
    return json({ error: `Webhook Error: ${(error as Error).message}` }, 400);
  }

  if (!HANDLED_EVENTS.has(event.type)) return json({ received: true });

  const object = event.data.object as unknown as StripeEventObject;
  const isCheckout = event.type === 'checkout.session.completed';
  const plan = isCheckout
    ? planFromCheckoutSession(object)
    : planFromSubscription(object);

  const customerId = stripeCustomerId(object.customer);
  const email = customerEmail(object);
  const clientRef =
    typeof object.client_reference_id === 'string' && object.client_reference_id.trim()
      ? object.client_reference_id.trim()
      : null;

  if (!clientRef && !email && !customerId) {
    return json({ error: 'No user reference on event' }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const findByEmail = async (value: string): Promise<string | null> => {
    const { data } = await supabase
      .from('scales_profiles')
      .select('id')
      .ilike('email', value)
      .maybeSingle();
    return data?.id ?? null;
  };

  let userId: string | null = null;

  if (clientRef) {
    const { data } = await supabase
      .from('scales_profiles')
      .select('id')
      .eq('id', clientRef)
      .maybeSingle();
    userId = data?.id ?? null;
  }

  if (!userId && customerId) {
    const { data } = await supabase
      .from('scales_profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    userId = data?.id ?? null;
  }

  if (!userId && email) userId = await findByEmail(email);

  // Subscribers who paid before 0008 have no customer id saved yet. Retrieve
  // the customer from Stripe once and fall back to their email address.
  if (!userId && customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      const legacyEmail = 'deleted' in customer ? null : customer.email;
      if (legacyEmail) userId = await findByEmail(legacyEmail.toLowerCase());
    } catch {
      // A lookup failure must not block an otherwise valid webhook event.
    }
  }

  if (!userId) {
    // No Scales profile to update (for example, the user deleted their Scales
    // data). Acknowledge so Stripe stops retrying an event we can never match.
    return json({ received: true, matched: false });
  }

  const update: Record<string, string> = { plan };
  if (customerId) update.stripe_customer_id = customerId;

  const { data: updated, error } = await supabase
    .from('scales_profiles')
    .update(update)
    .eq('id', userId)
    .select('id');

  if (error) return json({ error: error.message }, 500);

  return json({ received: true, matched: updated?.length === 1 });
});
