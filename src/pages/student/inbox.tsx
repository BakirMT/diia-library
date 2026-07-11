import * as React from "react"
import { Card } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Avatar } from "@/src/components/ui/avatar"
import { Send, Paperclip } from "lucide-react"
import { fetchMessages, sendMessage } from "@/src/lib/db"
import { useAuth } from "@/src/lib/AuthContext"
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import { db } from "@/src/lib/firebase"

export default function StudentInbox() {
  const { user } = useAuth();
  const [memberId, setMemberId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const init = async () => {
      if (!user) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : null;

        const membersSnap = await getDocs(collection(db, 'members'));
        
        const isEmailMatch = (email1: string, email2: string) => {
          if (!email1 || !email2) return false;
          const clean = (e: string) => e.toLowerCase().trim().replace('@gmai.com', '@gmail.com');
          return clean(email1) === clean(email2);
        };

        membersSnap.forEach(d => {
          const data = d.data();
          const safeId = d.id.replace(/[^a-zA-Z0-9]/g, '');
          const internalEmail = `${safeId}@v2.member.libsys.local`;
          if (
            (userData?.username && data.username?.toLowerCase() === userData.username.toLowerCase()) ||
            (userData?.email && isEmailMatch(data.email, userData.email)) ||
            (user.email && isEmailMatch(data.email, user.email)) ||
            user.email === internalEmail
          ) {
            setMemberId(d.id);
          }
        });
      } catch (err) {
        console.error("Error matching student inbox", err);
      }
    };
    init();
  }, [user]);

  React.useEffect(() => {
    if (!memberId) return;

    // Use onSnapshot for real-time updates
    const q = query(collection(db, "messages"), where("memberId", "==", memberId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ ...doc.data(), id: doc.id });
      });
      msgs.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [memberId]);

  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !memberId) return;

    const text = newMessage;
    setNewMessage('');
    
    try {
      await sendMessage(memberId, text, false);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Chat with Admin</h2>
          <p className="text-sm text-slate-500">Send messages to the library administrators.</p>
        </div>
      </div>
      
      <Card className="flex-1 flex-col overflow-hidden flex">
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="space-y-6 flex flex-col">
            <div className="text-center">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">Conversation History</span>
            </div>
            
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 text-sm mt-4">No messages yet. Send a message to start!</div>
            ) : null}
            
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex max-w-[80%] ${!msg.isSender ? 'ml-auto justify-end' : ''}`}
              >
                {msg.isSender && (
                  <Avatar fallback="A" size="sm" className="h-8 w-8 mr-2 shrink-0 mt-auto mb-1 bg-slate-200" />
                )}
                <div className={`flex flex-col ${!msg.isSender ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`px-4 py-2.5 rounded-2xl text-sm ${
                      !msg.isSender 
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
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="flex-1 bg-transparent border-none focus:outline-none text-sm px-4 text-slate-700"
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
      </Card>
    </div>
  )
}
