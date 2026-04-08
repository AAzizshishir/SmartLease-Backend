import { Request, Response } from "express";
import { webhookService } from "./webhook.service";

const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;

  // try {
  //   // need raw body — not parsed body
  //   await webhookService.handleWebhook(req.body, signature);
  //   res.json({ received: true });
  // } catch (error: any) {
  //   res.status(400).json({ message: error.message });
  // }
  try {
    // এখানে req.body আসবে Buffer আকারে (express.raw middleware এর কারণে)
    const result = await webhookService.handleWebhook(req.body, signature);
    res.json(result);
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

export const webhookController = { handleWebhook };
