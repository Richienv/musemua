"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, AlertTriangle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { createClient } from "@/utils/supabase/client";
import { getConversations, getMessages, sendMessage } from '@/services/message-service';
import { formatMessageTime, formatMessageDate, formatLastMessageTime } from '@/utils/date-format';
import { toast } from "sonner";
import { Toaster } from 'sonner';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface StreamerProfile {
  id: number;
  first_name: string;
  last_name: string;
  image_url: string;
  user_id: string;
}

interface ClientProfile {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string;
}

interface Conversation {
  id: string;
  streamer_id: number;
  client_id: string;
  created_at: string;
  streamer?: StreamerProfile;
  client?: ClientProfile;
  messages?: Message[];
  lastMessage?: Message;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileChat, setIsMobileChat] = useState(false);
  const [userType, setUserType] = useState<'streamer' | 'client' | null>(null);

  useEffect(() => {
    const initializeChat = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/sign-in');
        return;
      }

      // Get user type
      const { data: userData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (userData) {
        setUserType(userData.user_type as 'streamer' | 'client');
      }

      setCurrentUser(user);

      try {
        let conversationsData;

        if (userData?.user_type === 'client') {
          // Fetch conversations for client
          const { data } = await supabase
            .from('conversations')
            .select(`
              *,
              streamer:streamers (
                id, first_name, last_name, image_url, user_id
              ),
              messages (
                id, content, created_at, sender_id, conversation_id
              )
            `)
            .eq('client_id', user.id)
            .order('created_at', { ascending: false });
          
          conversationsData = data;
        } else if (userData?.user_type === 'streamer') {
          // First get the streamer's ID
          const { data: streamerData } = await supabase
            .from('streamers')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (streamerData) {
            // Fetch conversations for streamer
            const { data } = await supabase
              .from('conversations')
              .select(`
                *,
                client:users!conversations_client_id_fkey (
                  id, first_name, last_name, profile_picture_url
                ),
                messages (
                  id, content, created_at, sender_id, conversation_id
                )
              `)
              .eq('streamer_id', streamerData.id)
              .order('created_at', { ascending: false });
            
            conversationsData = data;
          }
        }

        if (conversationsData) {
          const processedConversations = conversationsData.map((conv: any) => ({
            ...conv,
            lastMessage: conv.messages && conv.messages.length > 0 
              ? conv.messages.sort((a: Message, b: Message) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0]
              : null
          }));

          console.log('Processed conversations:', processedConversations);
          setConversations(processedConversations);
          
          if (processedConversations.length > 0) {
            setSelectedConversation(processedConversations[0]);
            const messagesData = await getMessages(processedConversations[0].id);
            setMessages(messagesData || []);
          }
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast.error('Failed to load conversations');
      }
    };

    initializeChat();
  }, [router]);

  useEffect(() => {
    // Scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const WarningModal = () => {
    return (
      <div className="fixed inset-90 z-[10] flex items-center justify-center">
        {/* Dimmed background with blur */}
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        
        {/* Modal content - Added min-w-[500px] for desktop */}
        <div className="relative w-[95%] sm:w-[20%] min-w-[300px] md:min-w-[600px] bg-white rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 mx-auto">
          <div className="p-4 sm:p-8">
            {/* Warning Icon Header - Made smaller */}
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>

            {/* Content - Adjusted text sizes */}
            <div className="text-center space-y-4 sm:space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Peringatan Keamanan
              </h3>
              <div className="space-y-3 sm:space-y-4 max-w-[95%] mx-auto">
                <p className="text-sm sm:text-base text-gray-600">
                  Untuk melindungi pengguna dan streamer dari penipuan, Anda tidak dapat membagikan informasi pribadi di platform Salda.
                </p>
                <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-100">
                  <p className="text-sm sm:text-base font-medium text-red-600 whitespace-normal">
                    ⚠️ Pelanggaran berulang terhadap kebijakan ini dapat mengakibatkan pemblokiran akun secara permanen.
                  </p>
                </div>
                <p className="text-sm sm:text-base text-gray-600">
                  Silakan hubungi{" "}
                  <a href="mailto:admin@trollife.id" className="text-blue-600 hover:text-blue-700 font-medium">
                    admin@trollife.id
                  </a>
                  {" "}untuk bantuan lebih lanjut.
                </p>
              </div>
            </div>

            {/* Action Button - Adjusted padding */}
            <div className="mt-6 sm:mt-8">
              <Button
                onClick={() => toast.dismiss()}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Saya Mengerti
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ShippingInquiryModal = () => {
    return (
      <div className="fixed inset-90 z-[10] flex items-center justify-center">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        
        <div className="relative w-[95%] sm:w-[20%] min-w-[300px] md:min-w-[600px] bg-white rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 mx-auto">
          <div className="p-4 sm:p-8">
            <div className="text-center space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Pengiriman Barang
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Kamu ingin mengirim barang ke livestreamer? Silakan hubungi admin Salda untuk membantu mengatur pengiriman product yang ingin di review oleh streamer kami.
              </p>
              <div className="mt-4">
                <a
                  href="https://wa.me/62821544902561"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  Klik di sini
                </a>
              </div>
              <div className="mt-6">
                <Button
                  onClick={() => toast.dismiss()}
                  variant="outline"
                  className="w-full"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const InlineNotification = () => {
    return (
      <div className="flex justify-center mb-3">
        <div className="bg-gray-50/90 rounded-lg p-4 max-w-[90%] border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-700 mb-1">
            Kamu ingin mengirim barang ke livestreamer? Silakan hubungi admin kami.{" "}
            <a
              href="https://wa.me/62821544902561"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              Klik di sini
            </a>
            .
          </p>
        </div>
      </div>
    );
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    try {
      await sendMessage({
        conversation_id: selectedConversation.id,
        sender_id: currentUser.id,
        content: newMessage.trim()
      });

      setNewMessage('');
      
      // Refresh messages
      const messagesData = await getMessages(selectedConversation.id);
      setMessages(messagesData || []);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "FORBIDDEN_CONTENT") {
          toast.custom((t) => <WarningModal />, {
            duration: Infinity,
            position: "top-center",
          });
        } else {
          console.error('Error sending message:', error);
          toast.error("Gagal mengirim pesan. Silakan coba lagi.");
        }
      }
    }
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsMobileChat(true);
    try {
      const messagesData = await getMessages(conversation.id);
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const renderMessages = () => {
    let currentDate = '';
    
    return messages.map((message, index) => {
      const messageDate = formatMessageDate(message.created_at);
      let showDateSeparator = false;
      
      // Check if we need to show a date separator
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        showDateSeparator = true;
      }

      // Check if the current message contains shipping keywords
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

      const showShippingNotification = containsShippingKeywords(message.content);

      return (
        <div key={message.id}>
          {showDateSeparator && (
            <div className="flex justify-center my-4">
              <div className="bg-gray-100 rounded-full px-4 py-1 text-sm text-gray-600">
                {messageDate}
              </div>
            </div>
          )}
          <div 
            className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'} mb-3`}
          >
            <div 
              className={`rounded-lg p-3 max-w-[70%] ${
                message.sender_id === currentUser?.id 
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.sender_id === currentUser?.id ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatMessageTime(message.created_at)}
              </p>
            </div>
          </div>
          {showShippingNotification && <InlineNotification />}
        </div>
      );
    });
  };

  const renderConversationList = () => (
    conversations.map((conversation) => (
      <div 
        key={conversation.id} 
        className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 ${
          selectedConversation?.id === conversation.id ? 'bg-gray-100' : ''
        }`}
        onClick={() => handleConversationSelect(conversation)}
      >
        <Image
          src={userType === 'client' 
            ? (conversation.streamer?.image_url || '/default-avatar.png')
            : (conversation.client?.profile_picture_url || '/default-avatar.png')
          }
          alt={userType === 'client'
            ? `${conversation.streamer?.first_name || ''} ${conversation.streamer?.last_name || ''}`
            : `${conversation.client?.first_name || ''} ${conversation.client?.last_name || ''}`
          }
          width={48}
          height={48}
          className="rounded-full mr-4"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-base">
              {userType === 'client'
                ? `${conversation.streamer?.first_name || ''} ${conversation.streamer?.last_name || ''}`
                : `${conversation.client?.first_name || ''} ${conversation.client?.last_name || ''}`
              }
            </h3>
            {conversation.lastMessage && (
              <span className="text-xs text-gray-500">
                {formatLastMessageTime(conversation.lastMessage.created_at)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">
            {conversation.lastMessage?.content || 'No messages yet'}
          </p>
        </div>
      </div>
    ))
  );

  const handleBackNavigation = () => {
    if (isMobileChat) {
      setIsMobileChat(false);
    } else if (userType === 'streamer') {
      router.push('/streamer-dashboard');
    } else {
      router.push('/protected');
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-100">
      <Toaster richColors position="top-center" />

      {/* Header */}
      <div className="w-full bg-white border-b border-gray-200 flex-shrink-0">
        <div className="w-full px-4">
          <div className="flex items-center h-16">
            <Button 
              onClick={handleBackNavigation}
              variant="ghost" 
              size="sm" 
              className="mr-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h1 className="text-xl flex items-center gap-2">
              Messages
            </h1>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List */}
        <div className={`w-full md:w-[350px] lg:w-[400px] bg-white border-r border-gray-200 
          overflow-y-auto flex-shrink-0 ${isMobileChat ? 'hidden md:block' : 'block'}`}>
          {conversations.length > 0 ? renderConversationList() : (
            <div className="p-4 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Your chat history will appear here</p>
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className={`flex-1 flex-col bg-gray-50 min-w-0 
          ${isMobileChat ? 'flex' : 'hidden md:flex'}`}>
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="bg-white p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <Image
                    src={userType === 'client'
                      ? (selectedConversation.streamer?.image_url || '/default-avatar.png')
                      : (selectedConversation.client?.profile_picture_url || '/default-avatar.png')
                    }
                    alt="Profile"
                    width={40}
                    height={40}
                    className="rounded-full mr-3"
                  />
                  <span className="font-semibold text-base truncate">
                    {userType === 'client'
                      ? `${selectedConversation.streamer?.first_name || ''} ${selectedConversation.streamer?.last_name || ''}`
                      : `${selectedConversation.client?.first_name || ''} ${selectedConversation.client?.last_name || ''}`
                    }
                  </span>
                </div>
              </div>

              {/* Warning Banner */}
              <div className="bg-blue-50 p-3 text-sm text-blue-800 flex items-start border-b border-blue-100">
                <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                <p className="flex-1">
                  Hati-hati penipuan! Mohon tidak bertransaksi di luar Salda dan tidak memberikan data pribadi kepada streamer, seperti nomor HP dan alamat. Tetap berinteraksi melalui aplikasi Salda, ya.
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                {renderMessages()}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="bg-white p-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    size="default" 
                    className="bg-gradient-to-r from-[#1e40af] to-[#6b21a8] hover:from-[#1e3a8a] hover:to-[#581c87] flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col">
              <div className="bg-blue-600 p-3 text-sm text-white flex items-start border-b border-blue-700">
                <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                <p className="flex-1">
                  Hati-hati penipuan! Mohon tidak bertransaksi di luar Salda dan tidak memberikan data pribadi kepada streamer, seperti nomor HP dan alamat. Tetap berinteraksi melalui aplikasi Salda, ya.
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center p-4 text-center text-gray-500">
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
