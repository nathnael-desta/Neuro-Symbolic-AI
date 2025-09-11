// frontend/src/pages/chat.tsx (or wherever your file is located)

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

import { Header } from "@/components/custom/header";

import { Message, ThinkingMessage } from "@/components/custom/message";
import { ChatInput } from "@/components/custom/chatinput";
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { fetchVocabulary } from "@/services/apiService";
import { message } from "@/interfaces/interfaces";
import { Button } from "@/components/ui/button";

const validationExamples = [
  { snp: 'rs7825175', trait: 'thyroid_stimulating_hormone', label: 'TSH' },
  { snp: 'rs599839', trait: 'ldl', label: 'LDL Cholesterol' },
  { snp: 'rs429358', trait: 'alzheimers_disease', label: "Alzheimer's" },
  { snp: 'rs12946510', trait: 'coronary_heart_disease', label: 'Heart Disease' },
];


export function Chat() {
  const [messages, setMessages] = useState<message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  
  // Vocabulary state
  const [snps, setSnps] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

const [messagesContainerRef, bottomRef] = useScrollToBottom<HTMLDivElement>();

  // Fetch vocabulary on mount
  useEffect(() => {
    const loadVocab = async () => {
      setSnps(await fetchVocabulary('unique_snps.txt'));
      setTraits(await fetchVocabulary('unique_traits.txt'));
      setCategories(await fetchVocabulary('unique_categories.txt'));
    };
    loadVocab();
  }, []);

useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
}, [messages]);

  const handleToggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Handles manual validation
  const handleValidate = async (snp: string, trait: string) => {
    if (isLoading) return;
    setIsLoading(true);

    const userContent = `Validating SNP: ${snp} with Trait: ${trait.replace(/_/g, ' ')}`;
    setMessages(prev => [...prev, { content: userContent, role: "user", id: uuidv4() }]);

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/v1/validate`;
      const response = await axios.post(apiUrl, { snp, trait });
      const data = response.data;

      const newMessage: message = {
        content: data.explanation,
        role: "assistant",
        id: uuidv4(), // FIX: Use a new unique ID for the assistant message
        response_data: data,
      };
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error("Validation API error:", error);
      setMessages(prev => [...prev, {
        content: "An error occurred during validation. Please check the console.",
        role: "assistant",
        id: uuidv4(), // FIX: Use a new unique ID for the error message
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handles AI-powered suggestions
  const handleSuggest = async (topic: string) => {
    if (isLoading) return;
    setIsLoading(true);

    const userContent = `Generating hypotheses for topic: ${topic}`;
    setMessages(prev => [...prev, { content: userContent, role: "user", id: uuidv4() }]);

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/v1/generate-hypotheses`;
      const response = await axios.post(apiUrl, { topic });
      const data = response.data;

      const newMessage: message = {
        content: data.message,
        role: "assistant",
        id: uuidv4(), // FIX: Use a new unique ID for the assistant message
        response_data: data,
      };
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error("Suggestion API error:", error);
      setMessages(prev => [...prev, {
        content: "An error occurred while generating suggestions. Please check the console.",
        role: "assistant",
        id: uuidv4(), // FIX: Use a new unique ID for the error message
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-dvh bg-background">
      {/* <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onQuestionClick={handleSuggest} /> */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header title="Causal AI Validator" onToggleSidebar={handleToggleSidebar} onSuggestHypotheses={() => handleSuggest("a new hypothesis")} />
        <main ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-2xl text-center p-8">
                <h1 className="text-2xl font-bold mb-4">Causal AI Validator</h1>
                <p className="text-muted-foreground mb-8">
                  Select a mode below to begin. Use 'Manual Validation' to test a specific SNP-trait pair, or 'AI Suggestions' to generate new hypotheses based on a topic.
                </p>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-muted-foreground">Or, try an example:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {validationExamples.map((pair, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto text-wrap"
                        onClick={() => handleValidate(pair.snp, pair.trait)}
                      >
                        <span className="font-mono">{pair.snp}</span>
                        <span className="mx-2">→</span>
                        <span>{pair.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {messages.map((msg) => <Message key={msg.id} message={msg} />)}
          {isLoading && <ThinkingMessage />}
        </main>
        <div className="p-4 border-t">
                  <ChatInput
          snps={snps}
          traits={traits}
          categories={categories}
          isLoading={isLoading}
          onValidate={handleValidate}
          onSuggest={handleSuggest}
        />
        </div>

      </div>
    </div>
  );
}