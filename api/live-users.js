// Upstash Redis Live Users - Production Ready
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv(); // Auto-loads from Vercel env vars

export default async function handler(req, res) {
  const sessionId = req.headers['x-session-id'] || 
                   req.cookies?.sessionId || 
                   `anon_${Math.random().toString(36).substr(2,9)}`;
  
  const now = Date.now();
  const TTL_MS = 300000; // 5 minutes

  try {
    // Add current session
    await redis.zadd('live_users', { score: now, member: sessionId });
    
    // Remove expired sessions
    await redis.zremrangebyscore('live_users', 0, now - TTL_MS);
    
    // Get live count
    const liveCount = await redis.zcard('live_users');
    
    return res.status(200).json({
      live: liveCount,
      timestamp: now
    });
    
  } catch (error) {
    console.error('Upstash error:', error);
    return res.status(500).json({ live: 0 });
  }
}