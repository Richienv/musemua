import { createClient } from "@/utils/supabase/client";

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
  const supabase = createClient();

  try {
    // Check for forbidden content
    if (containsForbiddenContent(message.content)) {
      throw new Error("FORBIDDEN_CONTENT");
    }

    console.log('Sending message:', message);

    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        content: message.content,
        created_at: new Date().toISOString(),
        is_read: false,
        message_type: 'text'
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error sending message:', messageError);
      throw messageError;
    }

    console.log('Message sent successfully:', messageData);
    return messageData;
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_CONTENT") {
      throw new Error("FORBIDDEN_CONTENT");
    }
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