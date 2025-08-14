import { NextRequest, NextResponse } from "next/server";
import { handleOrderPaid } from "@/services/order";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const order_no = searchParams.get("order_no");
    const customer_id = searchParams.get("customer_id");
    const locale = searchParams.get("locale") || "en";

    if (!order_no) {
      return NextResponse.json({ error: "Missing order_no" }, { status: 400 });
    }

    let email = "";
    let checkoutData: any = null;

    if (customer_id && process.env.CREEM_API_KEY) {
      try {
        const baseUrl =
        process.env.CREEM_ENV === "prod"
          ? "https://api.creem.io"
          : "https://test-api.creem.io";        
        const res = await fetch(`${baseUrl}/v1/customers?customer_id=${customer_id}`, {
          headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.CREEM_API_KEY || "",
          },
        });
        if (res.ok) {
          checkoutData = await res.json();
          email = checkoutData?.email || "";
        }
      } catch (err) {
        console.error("Fetch Creem customer failed:", err);
      }
    }

    await handleOrderPaid(order_no, {
      source: "creem-callback",
      customer: {
        id: customer_id || checkoutData?.id || "",
        email: email,
      },
      metadata: {
        user_email: email,
      },
    }, email);

    const successUrl = process.env.NEXT_PUBLIC_PAY_SUCCESS_URL || "/";
    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
    const localePrefix = locale === "en" ? "" : `/${locale}`;
    return NextResponse.redirect(`${webUrl}${localePrefix}${successUrl}`);
  } catch (e: any) {
    console.error("Creem callback failed:", e);
    const failPath = process.env.NEXT_PUBLIC_PAY_FAIL_URL || "/";
    const fallbackOrigin = request.nextUrl.origin;
    const failUrl = new URL(failPath, fallbackOrigin);
    return NextResponse.redirect(failUrl);
  }
}
