import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export function createEchoInstance(token) {
  const echo = new Echo({
    broadcaster: 'pusher',
    key: process.env.REACT_APP_PUSHER_KEY || 'default_key',
    cluster: process.env.REACT_APP_PUSHER_CLUSTER || 'mt1',
    encrypted: true,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  return echo;
}

export function subscribeToConversation(echo, conversationId, onMessageReceived) {
  return echo
    .private(`conversation.${conversationId}`)
    .listen('MessageSent', (event) => {
      if (onMessageReceived) {
        onMessageReceived(event.message);
      }
    });
}

export function subscribeToUserChannel(echo, userId, onConversationUpdated) {
  return echo
    .private(`user.${userId}`)
    .listen('ConversationUpdated', (event) => {
      if (onConversationUpdated) {
        onConversationUpdated(event.conversation);
      }
    });
}
