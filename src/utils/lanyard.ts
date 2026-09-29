import { LanyardData } from '../types';

export const DISCORD_USER_ID = '1224502828371017788';

export async function fetchLanyardUser(userId: string = DISCORD_USER_ID): Promise<LanyardData | null> {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as LanyardData;
    }
  } catch (err) {
    console.warn('Lanyard REST error:', err);
  }
  return null;
}

export function subscribeToLanyard(
  userId: string = DISCORD_USER_ID,
  onUpdate: (data: LanyardData) => void,
  onError?: () => void
): () => void {
  let ws: WebSocket | null = null;
  let heartbeatInterval: number | null = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;
    try {
      ws = new WebSocket('wss://api.lanyard.rest/socket');

      ws.onopen = () => {
        ws?.send(
          JSON.stringify({
            op: 2,
            d: {
              subscribe_to_id: userId
            }
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.op === 1 && msg.d && msg.d.heartbeat_interval) {
            heartbeatInterval = window.setInterval(() => {
              ws?.send(JSON.stringify({ op: 3 }));
            }, msg.d.heartbeat_interval);
          }

          if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') {
            if (msg.d) {
              onUpdate(msg.d as LanyardData);
            }
          }
        } catch (e) {
          console.warn('WS message parse error', e);
        }
      };

      ws.onclose = () => {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (!isClosed) {
          setTimeout(connect, 5000);
        }
      };

      ws.onerror = () => {
        if (onError) onError();
        ws?.close();
      };
    } catch {
      if (onError) onError();
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (ws) ws.close();
  };
}
