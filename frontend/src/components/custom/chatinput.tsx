import { cx } from 'classix';
import { toast } from 'sonner';
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Send, Loader } from "lucide-react";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch"; // Assuming you have a Switch component
import { useEffect, useState } from 'react';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSendMessage: () => void;
  isLoading: boolean;
  isSuggestMode: boolean;
  setSuggestMode: (value: boolean) => void;
  handleSuggestHypotheses: () => void;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSendMessage,
  isLoading,
  isSuggestMode,
  setSuggestMode,
  handleSuggestHypotheses,
}: ChatInputProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="relative w-full flex flex-col gap-4">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        multiple
        tabIndex={-1}
      />

      <div className="absolute top-[-30px] right-0 flex items-center space-x-2">
        <Label htmlFor="suggest-mode">Suggest Hypotheses</Label>
        <Switch
          id="suggest-mode"
          checked={isSuggestMode}
          onCheckedChange={setSuggestMode}
        />
      </div>
      {isSuggestMode ? (
        <Button onClick={handleSuggestHypotheses} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Generate Suggestions"
          )}
        </Button>
      ) : (
        <>
          <Textarea
            placeholder="Type your hypothesis here or use 'Suggest Hypotheses'..."
            className={cx(
              'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-xl text-base bg-muted pr-16',
            )}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={3}
            autoFocus={isDesktop}
          />
          <Button
            size="icon"
            className="absolute top-1/2 right-3 transform -translate-y-1/2 rounded-full p-1.5 h-fit m-0.5 border dark:border-zinc-600"
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </>
      )}
    </div>
  );
}