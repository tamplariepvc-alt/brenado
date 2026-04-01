import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, message, url = "/" } = body;

const { data: subscriptions, error } = await supabase
  .from("push_subscriptions")
  .select("*, profiles:user_id(role)")
  .eq("profiles.role", "admin");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    for (const sub of subscriptions || []) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title,
            body: message,
            url,
          })
        );
      } catch (err) {
        console.error("Push failed:", err.message);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export async function GET() {
  try {
const { data: subscriptions, error } = await supabase
  .from("push_subscriptions")
  .select("*, profiles:user_id(role)")
  .eq("profiles.role", "admin");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    for (const sub of subscriptions || []) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title: "Test notificare",
            body: "Notificarea push functioneaza corect 🚀",
            url: "/",
          })
        );
      } catch (err) {
        console.error("Push failed:", err.message);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
