import { getChatMessages, checkOwnerHaltFlag } from '@/lib/data/shared-ops';
import { ChatPageClient } from './chat-client';

export const dynamic = 'force-dynamic';

export default function ChatPage() {
  const messages = getChatMessages();
  const haltActive = checkOwnerHaltFlag();

  return <ChatPageClient haltActive={haltActive} initialMessages={messages} />;
}
