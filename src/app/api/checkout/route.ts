import { getUserEmail, getUserUuid } from "@/services/user";
import { insertOrder, updateOrderSession } from "@/models/order";
import { respData, respErr } from "@/lib/resp";

import { Order } from "@/types/order";
import { Creem } from 'creem';
import Stripe from "stripe";
import { findUserByUuid } from "@/models/user";
import { getSnowId } from "@/lib/hash";
import { getPricingPage } from "@/services/page";
import { PricingItem } from "@/types/blocks/pricing";
import { orders } from "@/db/schema";
import { headers, cookies } from "next/headers";
import { 
  getOrCreateAttributionCookie,
  getOrderAttributionForStorage,
  parseUserAgent,
  parseIPLocation,
  getAttributionFromRequest
} from "@/services/attribution";

export async function POST(req: Request) {
  try {
    const payProvider = process.env.PAY_PROVIDER || 'stripe';
    let {
      credits,
      currency,
      amount,
      interval,
      product_id,
      product_name,
      valid_months,
      cancel_url,
      locale,
    } = await req.json();

    if (!cancel_url) {
      cancel_url = `${
        process.env.NEXT_PUBLIC_PAY_CANCEL_URL ||
        process.env.NEXT_PUBLIC_WEB_URL
      }`;

      if (cancel_url && cancel_url.startsWith("/")) {
        // relative url
        cancel_url = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}${cancel_url}`;
      }
    }

    if (!amount || !interval || !currency || !product_id) {
      return respErr("invalid params");
    }

    // validate checkout params
    const page = await getPricingPage(locale);
    if (!page || !page.pricing || !page.pricing.items) {
      return respErr("invalid pricing table");
    }

    const item = page.pricing.items.find(
      (item: PricingItem) => item.product_id === product_id
    );

    let isPriceValid = false;

    if (currency === "cny") {
      isPriceValid = item?.cn_amount === amount;
    } else {
      isPriceValid = item?.amount === amount && item?.currency === currency;
    }

    if (
      !item ||
      !item.amount ||
      !item.interval ||
      !item.currency ||
      item.interval !== interval ||
      item.credits !== credits ||
      item.valid_months !== valid_months ||
      !isPriceValid
    ) {
      return respErr("invalid checkout params");
    }

    if (!["year", "month", "one-time"].includes(interval)) {
      return respErr("invalid interval");
    }

    const is_subscription = interval === "month" || interval === "year";

    if (interval === "year" && valid_months !== 12) {
      return respErr("invalid valid_months");
    }

    if (interval === "month" && valid_months !== 1) {
      return respErr("invalid valid_months");
    }

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth, please sign-in");
    }

    let user_email = await getUserEmail();
    if (!user_email) {
      const user = await findUserByUuid(user_uuid);
      if (user) {
        user_email = user.email;
      }
    }
    if (!user_email) {
      return respErr("invalid user");
    }

    const order_no = getSnowId();

    const currentDate = new Date();
    const created_at = currentDate.toISOString();

    let expired_at = "";

    const timePeriod = new Date(currentDate);
    timePeriod.setMonth(currentDate.getMonth() + valid_months);

    const timePeriodMillis = timePeriod.getTime();
    let delayTimeMillis = 0;

    // subscription
    if (is_subscription) {
      delayTimeMillis = 24 * 60 * 60 * 1000; // delay 24 hours expired
    }

    const newTimeMillis = timePeriodMillis + delayTimeMillis;
    const newDate = new Date(newTimeMillis);

    expired_at = newDate.toISOString();

    // Get order attribution data from current session
    let orderAttributionData = {};
    try {
      // Get attribution from request
      const attributionData = await getAttributionFromRequest(req, req.url);
      
      // Get attribution cookie for source tracking
      const attributionCookie = await getOrCreateAttributionCookie();
      
      // Combine current session data with cookie data for order attribution
      const currentAttribution = {
        ...attributionData,
        source: attributionCookie.last.source || attributionData.source,
        medium: attributionCookie.last.medium || attributionData.medium,
        campaign: attributionCookie.last.campaign || attributionData.campaign,
        sessionId: attributionCookie.visitor.sessionId,
      };
      
      // Get order attribution fields
      orderAttributionData = getOrderAttributionForStorage(currentAttribution);
      
      console.log("Order attribution data:", orderAttributionData);
    } catch (attrError) {
      // Log error but don't fail order creation
      console.error("Failed to get order attribution:", attrError);
    }

    const order = {
      order_no: order_no,
      created_at: new Date(created_at),
      user_uuid: user_uuid,
      user_email: user_email,
      amount: amount,
      interval: interval,
      expired_at: new Date(expired_at),
      status: "created",
      credits: credits,
      currency: currency,
      product_id: product_id,
      product_name: product_name,
      valid_months: valid_months,
      ...orderAttributionData, // Add attribution data to order
    };
    await insertOrder(order as typeof orders.$inferInsert);

    if (payProvider === 'creem') {
      const CREEM_PRODUCTS = JSON.parse(process.env.CREEM_PRODUCTS || "{}");
      const creemProductId = CREEM_PRODUCTS[product_id];
      if (!creemProductId) {
        return respErr("creem product mapping not found");
      }

      const baseUrl =
      process.env.CREEM_ENV === "prod"
        ? "https://api.creem.io"
        : "https://test-api.creem.io";

      const resp = await fetch(`${baseUrl}/v1/checkouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.CREEM_API_KEY || "",
        },
        body: JSON.stringify({
          product_id: creemProductId,
          request_id: order_no,
          units: 1,
          customer: {
            email: user_email, 
          },          
          success_url: `${process.env.NEXT_PUBLIC_WEB_URL}/api/pay/callback/creem?order_no=${order_no}&locale=${locale}`,
          metadata: {
            order_no,
            product_id,
            product_name,
            credits,
            user_uuid,
            user_email,
          },
        }),
      });
    
      if (!resp.ok) {
        const err = await resp.text();
        console.error("Creem API error:", err);
        return respErr("create creem session failed: " + err);
      }
    
      const creemData = await resp.json();
      const url = creemData.checkout_url || creemData.url;
      if (!url) {
        console.error("Creem response missing checkout_url:", creemData);
        return respErr("create creem session failed: missing URL");
      }
    
      await updateOrderSession(order_no, creemData.id, JSON.stringify(creemData));
    
      return respData({
        provider: "creem",
        order_no,
        url,
      });

    } else {    

      const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY || "");

      let options: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: product_name,
              },
              unit_amount: amount,
              recurring: is_subscription
                ? {
                    interval: interval,
                  }
                : undefined,
            },
            quantity: 1,
          },
        ],
        allow_promotion_codes: true,
        metadata: {
          project: process.env.NEXT_PUBLIC_PROJECT_NAME || "",
          product_name: product_name,
          order_no: order_no.toString(),
          user_email: user_email,
          credits: credits,
          user_uuid: user_uuid,
        },
        mode: is_subscription ? "subscription" : "payment",
        success_url: `${process.env.NEXT_PUBLIC_WEB_URL}/api/pay/callback/stripe?session_id={CHECKOUT_SESSION_ID}&locale=${locale}`,
        cancel_url: cancel_url,
      };

      if (user_email) {
        options.customer_email = user_email;
      }

      if (is_subscription) {
        options.subscription_data = {
          metadata: options.metadata,
        };
      }

      if (currency === "cny") {
        options.payment_method_types = ["wechat_pay", "alipay", "card"];
        options.payment_method_options = {
          wechat_pay: {
            client: "web",
          },
          alipay: {},
        };
      }

      const order_detail = JSON.stringify(options);

      const session = await stripe.checkout.sessions.create(options);

      const stripe_session_id = session.id;
      await updateOrderSession(order_no, stripe_session_id, order_detail);

      return respData({
        public_key: process.env.STRIPE_PUBLIC_KEY,
        order_no: order_no,
        session_id: stripe_session_id,
      });
    }
  } catch (e: any) {
    console.log("checkout failed: ", e);
    return respErr("checkout failed: " + e.message);
  }
}
