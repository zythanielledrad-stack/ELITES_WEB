import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = Date.now();

  // Better session ID fallback (still not perfect, but safer)
  const sessionId =
    req.headers['x-session-id'] ||
    req.headers['user-agent'] + req.socket.remoteAddress;

  try {
    // LIVE USERS (5 min window)
    await redis.zadd('live_users', { score: now, member: sessionId });
    await redis.zremrangebyscore('live_users', 0, now - 300000);
    const live = await redis.zcard('live_users');

    // REFRESH PROTECTION (1 min)
    const sessionKey = `visit:${sessionId}`;
    const lastVisit = await redis.get(sessionKey);

    const todayKey = `today_${new Date().toISOString().split('T')[0]}`;
    let today = parseInt(await redis.get(todayKey) || '0', 10);
    let total = parseInt(await redis.get('total_all') || '0', 10);

    if (!lastVisit || now - parseInt(lastVisit, 10) >= 60000) {
      today += 1;
      total += 1;

      await redis.set(todayKey, today);
      await redis.set('total_all', total);

      // expire after 1 hour
      await redis.set(sessionKey, now, { ex: 3600 });
    }

    return res.status(200).json({ live, today, total, timestamp: now });

  } catch (e) {
    console.error('Redis error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}