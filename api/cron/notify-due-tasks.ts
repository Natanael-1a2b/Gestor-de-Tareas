import { getErrorMessage, type VercelRequest, type VercelResponse } from '../_lib/types';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin';
import { sendPush } from '../_lib/webpush';

declare const process: { env: Record<string, string | undefined> };

interface PendingNotification {
  task_id: string;
  user_id: string;
  title: string;
  due_date: string;
  lead_days: number;
}

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

function groupByUser(subs: PushSubscriptionRow[]): Record<string, PushSubscriptionRow[]> {
  return subs.reduce<Record<string, PushSubscriptionRow[]>>((acc, sub) => {
    (acc[sub.user_id] ??= []).push(sub);
    return acc;
  }, {});
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const admin = getSupabaseAdmin();

    const { data: candidates, error: candidatesError } = await admin.rpc('get_pending_due_notifications');
    if (candidatesError) throw candidatesError;

    const pending = (candidates ?? []) as PendingNotification[];
    if (pending.length === 0) {
      return res.status(200).json({ processed: 0, sent: 0, cleaned: 0 });
    }

    const userIds = [...new Set(pending.map((c) => c.user_id))];
    const { data: subs, error: subsError } = await admin
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth_key')
      .in('user_id', userIds);
    if (subsError) throw subsError;

    const subsByUser = groupByUser((subs ?? []) as PushSubscriptionRow[]);

    let sent = 0;
    let cleaned = 0;
    const toMarkNotified: { task_id: string; user_id: string; due_date_notified: string }[] = [];

    for (const task of pending) {
      const userSubs = subsByUser[task.user_id] ?? [];
      if (userSubs.length === 0) continue; // sin dispositivo registrado: reintentar en próximas corridas

      for (const sub of userSubs) {
        const result = await sendPush(sub, {
          title: 'Tarea próxima a vencer',
          body: `"${task.title}" vence el ${task.due_date}`,
          taskId: task.task_id,
        });

        if (result.ok) {
          sent++;
        } else if (result.statusCode === 404 || result.statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', sub.id);
          cleaned++;
        }
      }

      toMarkNotified.push({
        task_id: task.task_id,
        user_id: task.user_id,
        due_date_notified: task.due_date,
      });
    }

    if (toMarkNotified.length > 0) {
      const { error: markError } = await admin
        .from('task_due_notifications')
        .upsert(toMarkNotified, { onConflict: 'task_id' });
      if (markError) throw markError;
    }

    return res.status(200).json({ processed: pending.length, sent, cleaned });
  } catch (error: unknown) {
    console.error('Error en /api/cron/notify-due-tasks:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
