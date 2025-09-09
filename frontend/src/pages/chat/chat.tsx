// frontend/src/pages/chat.tsx (or wherever your file is located)

import { ChatInput } from "@/components/custom/chatinput";
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Header } from "../../components/custom/header";
import { Sidebar } from "../../components/custom/sidebar";
import { Message, ThinkingMessage } from "../../components/custom/message";
import { generateHypotheses } from "../../services/apiService";
import { message, Hypothesis } from "../../interfaces/interfaces";
import axios from "axios";

export function Chat() {
  const [messages, setMessages] = useState<message[]>([]);
const [messagesContainerRef, bottomRef] = useScrollToBottom<HTMLDivElement>();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isSuggestMode, setSuggestMode] = useState<boolean>(false);

  const submitQuery = async (query: string) => {
    if (isLoading || !query.trim()) return;

    setIsLoading(true);
    if (isSidebarOpen && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    const traceId = uuidv4();
    setMessages(prev => [...prev, { content: query, role: "user", id: traceId }]);
    setInput("");

    const parts = query.trim().toLowerCase().split(' ');
    const command = parts[0];
    
    if (command !== 'validate' || !parts.includes('snp:') || !parts.includes('trait:')) {
        const errorMessage: message = {
            content: "Sorry, I didn't understand that. Please use the format: validate snp: <snp_id> trait: \"<trait_description>\"",
            role: "assistant",
            id: traceId
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
    }

    try {
        const snpIndex = parts.indexOf('snp:') + 1;
        const traitIndex = parts.indexOf('trait:') + 1;
        const snp = parts[snpIndex];
        const trait = query.split(/trait: "/i)[1].replace(/"$/, '');

        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/v1/validate`;
        const response = await axios.post(apiUrl, { snp, trait });

        const validationReport = response.data;
        const botAnswer = validationReport.explanation;

        const newMessage: message = {
            content: botAnswer,
            role: "assistant",
            id: traceId,
            intermediate_steps: validationReport 
        };
        setMessages(prev => [...prev, newMessage]);

    } catch (error) {
        console.error("API call error:", error);
        const errorMessage: message = {
            content: "Sorry, an error occurred while talking to the API. Please check the server logs.",
            role: "assistant",
            id: traceId
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  }

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async () => {
    await submitQuery(input);
  };

  async function handleSuggestHypotheses() {
    if (isLoading) return;

    const topic = window.prompt("Enter a topic to generate hypotheses (e.g., longevity, inflammation):");
    if (!topic) return;

    setIsLoading(true);

    const traceId = uuidv4();
    setMessages(prev => [...prev, { content: `Generate hypotheses for: ${topic}`, role: "user", id: traceId }]);

    try {
      const suggestions = await generateHypotheses(topic);
      
      const newMessage: message = {
        content: `Here are some suggestions related to "${topic}":`,
        role: "assistant",
        id: traceId,
        intermediate_steps: suggestions 
      };
      setMessages(prev => [...prev, newMessage]);

    } catch (error) {
      console.error("Suggestion generation error:", error);
      const errorMessage: message = {
        content: "Sorry, I couldn't generate suggestions. The API might be down.",
        role: "assistant",
        id: traceId
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleValidateHypothesis = async (hypothesis: Hypothesis) => {
    const command = `validate snp: ${hypothesis.snp} trait: "${hypothesis.trait}"`;
    await submitQuery(command);
  };

useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
}, [messages]);

  return (
    <div className="flex h-dvh bg-background">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onQuestionClick={(q) => submitQuery(q)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Header 
          title="Gene-Trait Validation" 
          onToggleSidebar={handleToggleSidebar}
          onSuggestHypotheses={handleSuggestHypotheses}
        />
        <main ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-xl text-center bg-card rounded-xl shadow-lg p-8 border border-border">
              <h1 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
                Neuro-Symbolic AI Chatbot
                <span role="img" aria-label="dna">🧬</span>
              </h1>
              <p className="mb-4">
                This tool allows you to validate gene-trait associations against a Prolog knowledge base.
              </p>
              <p>
                To begin, please use the format: <strong>validate snp: [snp_id] trait: "[trait_description]"</strong>
              </p>
              <p className="mt-6 text-muted-foreground">
                For example: <strong>validate snp: rs2543600 trait: "age at death"</strong>
              </p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} onValidateHypothesis={handleValidateHypothesis} />
          ))}
          {isLoading && <ThinkingMessage />}
          <div ref={bottomRef} />
        </main>
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSendMessage={handleSendMessage}
            isLoading={isLoading}
            isSuggestMode={isSuggestMode}
            setSuggestMode={setSuggestMode}
            handleSuggestHypotheses={handleSuggestHypotheses}
          />
        </div>
      </div>
  )
};