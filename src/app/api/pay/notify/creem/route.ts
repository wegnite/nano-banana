import { handleOrderPaid } from "@/services/order";
import { respOk } from "@/lib/resp";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("creem-signature");
    const secret = process.env.CREEM_WEBHOOK_SECRET;
    const body = await req.text();

    if (!signature || !secret) {
      throw new Error("invalid webhook config");
    }

    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSig) {
      throw new Error("invalid signature");
    }

    const event = JSON.parse(body);
    console.log("Creem webhook event:", event);

    const data = event.object;
    const metadata = data.metadata || {};
    const order_no = metadata.order_no;
    if (!order_no) {
      throw new Error("missing order_no in metadata");
    }

    const paid_email = data.customer?.email || metadata.user_email || "";

    await handleOrderPaid(order_no, data, paid_email);

    return respOk();
  } catch (e: any) {
    console.error("Creem webhook failed:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}