import { createClient } from "@/utils/supabase/client";
import { createNotification } from "@/services/notification-service";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  message_type: string;
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_id: string;
  last_message_time: string;
}

const FORBIDDEN_PATTERNS = [
  /\d{3,}/,  // 3 or more consecutive numbers
  /(?:08|\+62|62)\d+/, // Indonesian phone numbers
  /\d{2,}[\s-]?\d{2,}/ // Numbers with spaces or dashes
];

function containsForbiddenContent(message: string): boolean {
  return FORBIDDEN_PATTERNS.some(pattern => pattern.test(message));
}

const containsPhoneNumber = (text: string): boolean => {
  // Matches sequences of numbers that could be phone numbers (3 or more digits)
  const phonePattern = /\d{3,}/;
  return phonePattern.test(text);
};

const containsEmailPattern = (text: string): boolean => {
  // Matches common email patterns like:
  // - anything@anything
  // - anything.com
  // - anything.co.id
  // - anything.id
  const emailPattern = /[@]|[.](com|net|org|edu|gov|mil|biz|info|io|co|id|co\.id)\b/i;
  return emailPattern.test(text);
};

const containsShippingKeywords = (text: string): boolean => {
  const shippingKeywords = [
    /kirim\s*barang/i,
    /pengiriman/i,
    /ngirim/i,
    /kirimkan/i,
    /kirimin/i,
    /kirim\s*produk/i,
    /kirim\s*product/i,
    /kirim\s*paket/i
  ];
  return shippingKeywords.some(pattern => pattern.test(text));
};

export async function getConversations(userId: string) {
  const supabase = createClient();
  
  try {
    // Get conversations where user is the client
    const { data: clientConversations, error: clientError } = await supabase
      .from('conversations')
      .select(`
        *,
        streamer:streamers (
          id,
          first_name,
          last_name,
          image_url,
          user_id
        ),
        messages (
          id,
          content,
          created_at,
          sender_id
        )
      `)
      .eq('client_id', userId)
      .order('created_at', { ascending: false });

    if (clientError) throw clientError;

    return clientConversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

export async function getMessages(conversationId: string) {
  const supabase = createClient();
  
  try {
    console.log('Fetching messages for conversation:', conversationId);

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users (
          id, first_name, last_name, profile_picture_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    console.log('Fetched messages:', data);
    return data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function sendMessage(message: {
  conversation_id: string;
  sender_id: string;
  content: string;
}) {
  // Check for forbidden content
  if (containsPhoneNumber(message.content) || containsEmailPattern(message.content)) {
    throw new Error("FORBIDDEN_CONTENT");
  }

  const supabase = createClient();
  
  try {
    // 1. Get conversation details to know recipient
    const { data: conversation } = await supabase
      .from('conversations')
      .select(`
        *,
        client:users!conversations_client_id_fkey (id, first_name, last_name),
        streamer:streamers (id, user_id, first_name, last_name)
      `)
      .eq('id', message.conversation_id)
      .single();

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // 2. Determine recipient and sender details
    const recipient_id = conversation.client_id === message.sender_id 
      ? conversation.streamer.user_id 
      : conversation.client_id;

    const sender = conversation.client_id === message.sender_id
      ? conversation.client
      : conversation.streamer;

    // 3. Send message
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: message.conversation_id,
          sender_id: message.sender_id,
          content: message.content,
          is_read: false
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // 4. Create notification for the recipient
    await createNotification({
      user_id: recipient_id,
      message: `Kamu dapat pesan baru dari ${sender.first_name} ${sender.last_name}`,
      type: 'new_message',
      is_read: false
    });

    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export function subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
  const supabase = createClient();
  
  return supabase
    .channel(`messages:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      callback(payload.new as Message);
    })
    .subscribe();
}

export function subscribeToConversations(userId: string, callback: (conversation: any) => void) {
  const supabase = createClient();
  
  return supabase
    .channel(`conversations:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'conversations',
      filter: `or(participant1_id.eq.${userId},participant2_id.eq.${userId})`
    }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
}

export async function createOrGetConversation(clientId: string, streamerId: number) {
  const supabase = createClient();
  
  try {
    // Check for existing conversation
    const { data: existingConversation, error: searchError } = await supabase
      .from('conversations')
      .select(`
        *,
        streamer:streamers (
          id,
          first_name,
          last_name,
          image_url,
          user_id
        )
      `)
      .eq('client_id', clientId)
      .eq('streamer_id', streamerId)
      .single();

    if (!searchError && existingConversation) {
      console.log('Found existing conversation:', existingConversation);
      return existingConversation;
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        client_id: clientId,
        streamer_id: streamerId,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        streamer:streamers (
          id,
          first_name,
          last_name,
          image_url,
          user_id
        )
      `)
      .single();

    if (createError) throw createError;

    console.log('Created new conversation:', newConversation);
    return newConversation;
  } catch (error) {
    console.error('Error in createOrGetConversation:', error);
    throw error;
  }
} 