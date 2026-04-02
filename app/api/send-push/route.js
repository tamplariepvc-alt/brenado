import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL lipseste din .env.local");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY lipseste din .env.local");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, message, url = "/" } = body;

const { data: privilegedUsers, error: adminsError } = await supabase
  .from("profiles")
  .select("id, role")
  .in("role", ["admin", "manager"]);

    if (adminsError) {
      return Response.json({ error: adminsError.message }, { status: 500 });
    }

const adminIds = (privilegedUsers || []).map((item) => item.id);

if (!adminIds.length) {
  return Response.json({ ok: true, sent: 0 });
}

const notificationRows = adminIds.map((userId) => ({
      user_id: userId,
      title,
      message,
      url,
      is_read: false,
    }));

    const { error: insertNotificationError } = await supabase
      .from("app_notifications")
      .insert(notificationRows);

    if (insertNotificationError) {
      console.error("Eroare insert notificari:", insertNotificationError.message);
    }

    const { data: subscriptions, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", adminIds);

    if (subsError) {
      return Response.json({ error: subsError.message }, { status: 500 });
    }

    let sent = 0;

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
        sent += 1;
      } catch (err) {
        console.error("Push failed:", err.message);
      }
    }

    return Response.json({ ok: true, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}