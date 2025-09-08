// frontend/src/pages/chat.tsx (or wherever your file is located)

import { ChatInput } from "@/components/custom/chatinput";
import { PreviewMessage, ThinkingMessage } from "../../components/custom/message";
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { useState } from "react";
import { message } from "../../interfaces/interfaces"
import { Header } from "@/components/custom/header";
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Sidebar } from "@/components/custom/sidebar";

export function Chat() {
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const [messages, setMessages] = useState<message[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  async function handleSubmit(text?: string) {
    if (isLoading) return;

    const messageText = text || question;
    if (!messageText) return;

    setIsLoading(true);
    if (isSidebarOpen && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    const traceId = uuidv4();
    setMessages(prev => [...prev, { content: messageText, role: "user", id: traceId }]);
    setQuestion("");

    // --- MODIFICATION START: Input Parsing and API Logic ---

    // 1. Parse the input to get SNP and Trait
    const parts = messageText.trim().toLowerCase().split(' ');
    if (parts[0] !== 'validate' || !parts.includes('and') || parts.length < 4) {
      const errorMessage: message = {
        content: "Sorry, I didn't understand that. Please use the format: validate <snp> and <trait>",
        role: "assistant",
        id: traceId
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      return; // Stop execution if format is incorrect
    }
    
    const snp = parts[1];
    const traitIndex = parts.indexOf('and') + 1;
    const trait = parts[traitIndex];

    try {
      // 2. Build the API URL for the new endpoint
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/v1/validate`;

      // 3. Make the API call with the new payload
      const response = await axios.post(apiUrl, { snp, trait });

      // 4. Extract the explanation and the full report from the response
      const validationReport = response.data;
      const botAnswer = validationReport.explanation;

      // Add the complete bot response to the UI
      const newMessage: message = {
        content: botAnswer, // The user-friendly explanation
        role: "assistant",
        id: traceId,
        // We can pass the full report for detailed display if needed
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
    // --- MODIFICATION END ---
  }

  return (
    <div className="flex h-dvh bg-background">
      {/* TODO: Update Sidebar with gene-trait related questions */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onQuestionClick={handleSubmit}
      />
      <div className="flex flex-col flex-1 min-w-0">
        {/* MODIFICATION: Updated Header Title */}
        <Header 
          title="Gene-Trait Validation Chatbot" 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        <div className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4" ref={messagesContainerRef}>
            {/* MODIFICATION: Updated Welcome/Empty State Message */}
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
                To begin, please use the format: <strong>validate [snp] and [trait]</strong>
              </p>
              <p className="mt-6 text-muted-foreground">
                For example: <strong>validate rs2543600 and age_at_death</strong>
              </p>
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <PreviewMessage key={index} message={message} />
          ))}
          {isLoading && <ThinkingMessage />}
          <div ref={messagesEndRef} className="shrink-0 min-w-[24px] min-h-[24px]" />
        </div>
        <div className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          <ChatInput
            question={question}
            setQuestion={setQuestion}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};