import Stripe from "stripe";
import { envVariables } from "./env";

export const stripe = new Stripe(envVariables.STRIPE.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});
