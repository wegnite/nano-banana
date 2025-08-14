import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { handleOrderSession } from "@/services/order";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get("session_id");
    const locale = searchParams.get("locale") || "en";

    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id parameter" }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY || "");
    
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    await handleOrderSession(session);
    console.log(`Payment callback processed successfully for order: ${session.metadata?.order_no}`);

    // Redirect to success page with locale support
    const successUrl = process.env.NEXT_PUBLIC_PAY_SUCCESS_URL || "/";
    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
    
    if (webUrl) {
      // Handle locale-aware redirect
      const localePrefix = locale === "en" ? "" : `/${locale}`;
      const redirectUrl = `${webUrl}${localePrefix}${successUrl}`;
      return NextResponse.redirect(redirectUrl);
    } else {
      return NextResponse.json({ 
        success: true, 
        message: "Payment processed successfully",
        order_no: session.metadata?.order_no 
      });
    }

  } catch (error: any) {
    console.error("Payment callback error:", error);
   
    // Redirect to failure page with locale support
    const failUrl = process.env.NEXT_PUBLIC_PAY_FAIL_URL || "/";
    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
    const locale = new URL(request.url).searchParams.get("locale") || "en";
    
    if (webUrl) {
      // Handle locale-aware redirect
      const localePrefix = locale === "en" ? "" : `/${locale}`;
      const redirectUrl = `${webUrl}${localePrefix}${failUrl}`;
      return NextResponse.redirect(redirectUrl);
    } else {
      return NextResponse.json({ 
        error: "Payment callback processing failed",
        message: error.message 
      }, { status: 500 });
    }
  }
}
