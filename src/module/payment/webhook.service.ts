import Stripe from "stripe";
import AppError from "../../utils/AppError";
import { StatusCodes } from "http-status-codes";
import { stripe } from "../../config/stripe.config";
import { envVariables } from "../../config/env";
import { prisma } from "../../lib/prisma";

const handleWebhook = async (rawBody: Buffer, signature: string) => {
  let event: Stripe.Event;

  // Stripe signature verify — block fake request
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      envVariables.STRIPE.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid webhook signature");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const { payment_id, tenant_id, type, lease_id } = session.metadata ?? {};

      if (!payment_id) break;

      await prisma.$transaction(async (tx) => {
        // payment update
        await tx.payment.update({
          where: { id: payment_id },
          data: {
            status: "paid",
            paid_at: new Date(),
            stripe_payment_id: session.payment_intent as string,
          },
        });

        //  lease update if deposit
        if (type === "security_deposit" && lease_id) {
          await tx.lease.update({
            where: { id: lease_id },
            data: {
              deposit_status: "paid",
              deposit_paid_at: new Date(),
            },
          });
        }
      });

      break;
    }
    case "checkout.session.expired": {
      // session expire হলে — tenant আর কিছু করেনি
      const session = event.data.object as Stripe.Checkout.Session;
      const { payment_id } = session.metadata ?? {};

      if (!payment_id) break;

      // session_id clear — নতুন session তৈরি করতে পারবে
      await prisma.payment.update({
        where: { id: payment_id },
        data: { stripe_session_id: null },
      });
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      await prisma.payment.updateMany({
        where: {
          stripe_payment_id: paymentIntent.id,
        },
        data: { status: "failed" },
      });

      break;
    }
  }

  return { received: true };
};

export const webhookService = { handleWebhook };
