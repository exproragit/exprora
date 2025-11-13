import express from 'express';
import Stripe from 'stripe';
import pool from '../database/connection';

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Stripe webhook handler
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find account by Stripe customer ID
        const accountResult = await pool.query(
          'SELECT id FROM accounts WHERE stripe_customer_id = $1',
          [customerId]
        );

        if (accountResult.rows.length > 0) {
          const planId = subscription.items.data[0].price.id;
          // Map Stripe price ID to plan (you'll need to configure this)
          let plan = 'starter';
          if (planId.includes('professional')) plan = 'professional';
          if (planId.includes('enterprise')) plan = 'enterprise';

          await pool.query(
            `UPDATE accounts 
             SET stripe_subscription_id = $1, 
                 subscription_plan = $2,
                 subscription_status = $3,
                 subscription_ends_at = to_timestamp($4),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5`,
            [
              subscription.id,
              plan,
              subscription.status === 'active' ? 'active' : 'cancelled',
              subscription.current_period_end,
              accountResult.rows[0].id
            ]
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await pool.query(
          `UPDATE accounts 
           SET subscription_status = 'cancelled',
               subscription_ends_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE stripe_subscription_id = $1`,
          [subscription.id]
        );
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const accountResult = await pool.query(
          'SELECT id FROM accounts WHERE stripe_customer_id = $1',
          [customerId]
        );

        if (accountResult.rows.length > 0) {
          // Create invoice record
          await pool.query(
            `INSERT INTO invoices 
             (account_id, amount, currency, status, stripe_invoice_id, invoice_date, paid_at)
             VALUES ($1, $2, $3, 'paid', $4, CURRENT_DATE, CURRENT_TIMESTAMP)
             ON CONFLICT DO NOTHING`,
            [
              accountResult.rows[0].id,
              invoice.amount_paid / 100, // Convert from cents
              invoice.currency.toUpperCase(),
              invoice.id
            ]
          );

          // Create payment record
          if (invoice.payment_intent) {
            const paymentIntent = await stripe.paymentIntents.retrieve(
              invoice.payment_intent as string
            );

            await pool.query(
              `INSERT INTO payments 
               (account_id, amount, currency, payment_method, stripe_charge_id, status)
               VALUES ($1, $2, $3, $4, $5, 'completed')`,
              [
                accountResult.rows[0].id,
                invoice.amount_paid / 100,
                invoice.currency.toUpperCase(),
                paymentIntent.payment_method_types[0] || 'card',
                paymentIntent.latest_charge as string || null
              ]
            );
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const accountResult = await pool.query(
          'SELECT id FROM accounts WHERE stripe_customer_id = $1',
          [customerId]
        );

        if (accountResult.rows.length > 0) {
          await pool.query(
            `INSERT INTO invoices 
             (account_id, amount, currency, status, stripe_invoice_id, invoice_date)
             VALUES ($1, $2, $3, 'failed', $4, CURRENT_DATE)
             ON CONFLICT DO NOTHING`,
            [
              accountResult.rows[0].id,
              invoice.amount_due / 100,
              invoice.currency.toUpperCase(),
              invoice.id
            ]
          );
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

