import * as React from "react"
import { Card } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Avatar } from "@/src/components/ui/avatar"
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Info, ArrowLeft } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { fetchConversations, fetchMessages, sendMessage } from "@/src/lib/db"



export default function Inbox() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [activeConversation, setActiveConversation] = React.useState<any>(null);
  const [showSidebarOnMobile, setShowSidebarOnMobile] = React.useState(true);
  const [newMessage, setNewMessage] = React.useState('');
  const [messagesByConv, setMessagesByConv] = React.useState<Record<string, any[]>>({});
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    fetchConversations().then(convos => {
      setConversations(convos);
      const memberId = searchParams.get('memberId');
      
      let active = convos[0];
      if (memberId) {
        const found = convos.find((c: any) => c.id === memberId);
        if (found) {
          active = found;
        }
        searchParams.delete('memberId');
        setSearchParams(searchParams, { replace: true });
        setShowSidebarOnMobile(false);
      }
      
      if (active) {
        setActiveConversation(active);
      }
    });
  }, []);

  React.useEffect(() => {
    if (activeConversation && !messagesByConv[activeConversation.id]) {
      fetchMessages(activeConversation.id).then(msgs => {
        setMessagesByConv(prev => ({
          ...prev,
          [activeConversation.id]: msgs
        }));
      });
    }
  }, [activeConversation]);

  const currentMessages = activeConversation ? (messagesByConv[activeConversation.id] || []) : [];

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, activeConversation]);

  const addMessageToUI = (newMsg: any) => {
    setMessagesByConv(prev => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), newMsg]
    }));
    
    setConversations(prev => {
      const copy = [...prev];
      const idx = copy.findIndex(c => c.id === activeConversation.id);
      if (idx !== -1) {
        copy[idx] = {
          ...copy[idx],
          lastMessage: newMsg.text,
          time: newMsg.time
        };
        // Move to top
        const conv = copy.splice(idx, 1)[0];
        copy.unshift(conv);
      }
      return copy;
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;
    
    const text = newMessage;
    setNewMessage('');
    
    try {
      const newMsg = await sendMessage(activeConversation.id, text, true);
      addMessageToUI(newMsg);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeConversation) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      try {
        const newMsg = await sendMessage(activeConversation.id, `📎 Attached file: ${file.name}`, true);
        addMessageToUI(newMsg);
      } catch (error) {
        console.error("Error sending file:", error);
      }
    }
  };

  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(c => String(c.name || '').toLowerCase().includes(query) || String(c.lastMessage || '').toLowerCase().includes(query));
  }, [conversations, searchQuery]);

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[500px] flex gap-6">
      {/* Sidebar */}
      <Card className={`w-full md:w-80 shrink-0 flex-col overflow-hidden ${showSidebarOnMobile ? 'flex' : 'hidden'} md:flex`}>
        <div className="p-4 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4">Inbox</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search messages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-transparent focus-visible:bg-white" 
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">No conversations found</div>
          ) : filteredConversations.map((conv) => (
            <div 
              key={conv.id}
              onClick={() => {
                setActiveConversation(conv);
                setShowSidebarOnMobile(false);
              }}
              className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-slate-50 ${
                activeConversation?.id === conv.id ? 'bg-orange-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="relative shrink-0">
                <Avatar fallback={conv.avatar} />
                {conv.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="text-sm font-semibold text-slate-900 truncate pr-2">{conv.name}</h3>
                  <span className="text-[10px] text-slate-500 shrink-0">{conv.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500 truncate pr-2">{conv.lastMessage}</p>
                  {conv.unread > 0 && (
                    <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Main Chat Area */}
      <Card className={`flex-1 flex-col overflow-hidden ${!showSidebarOnMobile ? 'flex' : 'hidden'} md:flex`}>
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white z-10 shadow-sm">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mr-1 md:hidden text-slate-500" 
                  onClick={() => setShowSidebarOnMobile(true)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="relative">
                  <Avatar fallback={activeConversation.avatar} />
                  {activeConversation.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{activeConversation.name}</h2>
                  <p className="text-xs text-slate-500">{activeConversation.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-full hidden sm:inline-flex">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-full hidden sm:inline-flex">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              <div className="space-y-6 flex flex-col">
                <div className="text-center">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">Conversation History</span>
                </div>
                
                {currentMessages.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm mt-4">No messages yet. Send a message to start the conversation!</div>
                ) : null}
                
                {currentMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex max-w-[80%] ${msg.isSender ? 'ml-auto justify-end' : ''}`}
                  >
                    {!msg.isSender && (
                      <Avatar fallback={activeConversation.avatar} size="sm" className="h-8 w-8 mr-2 shrink-0 mt-auto mb-1" />
                    )}
                    <div className={`flex flex-col ${msg.isSender ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`px-4 py-2.5 rounded-2xl text-sm ${
                          msg.isSender 
                            ? 'bg-[var(--color-primary)] text-white rounded-br-sm' 
                            : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              <form 
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 bg-slate-50 rounded-full p-1 pr-2 border border-slate-100 focus-within:border-orange-200 focus-within:ring-2 focus-within:ring-orange-100 transition-all"
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <Button type="button" variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 shrink-0" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input 
                  type="text" 
                  placeholder="Type your message..." 
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 text-slate-700"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className={`rounded-full shrink-0 transition-colors ${
                    newMessage.trim() ? 'bg-[var(--color-primary)] text-white hover:bg-orange-600' : 'bg-slate-200 text-slate-400'
                  }`}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4 ml-0.5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <Info className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">No conversation selected</p>
            <p className="text-sm">Select a member from the sidebar to view messages.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
