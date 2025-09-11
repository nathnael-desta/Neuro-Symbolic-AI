import { message } from "@/interfaces/interfaces";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { Markdown } from "./markdown";
import { ValidationResult } from "./ValidationResult";
import { SuggestionResult } from "./SuggestionResult";

// Type guards to identify the response structure
function isValidationResponse(data: any): boolean {
  return data && typeof data.is_supported === 'boolean' && 'confidence_score' in data;
}

function isSuggestionResponse(data: any): boolean {
  return data && (data.status === 'success' || data.status === 'failure') && 'attempts' in data;
}

export function Message({ message }: { message: message }) {
  const { role, content, response_data } = message;
  const isAssistant = role === "assistant";

  return (
    <div className={cn("group w-full text-gray-800 dark:text-gray-100", { "flex justify-end": !isAssistant })}>
      <div className="flex gap-4 p-4 max-w-3xl mx-auto">
        {isAssistant && (
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary shrink-0">
            <Bot size={20} />
          </div>
        )}
        <div className="flex-1 space-y-4">
          <div className={cn("p-4 rounded-lg", isAssistant ? "bg-card" : "bg-primary text-primary-foreground")}>
            <Markdown>{content}</Markdown>
          </div>
          {isAssistant && response_data && (
            <div className="pl-0">
              {isValidationResponse(response_data) && <ValidationResult {...response_data} />}
              {isSuggestionResponse(response_data) && <SuggestionResult {...response_data} />}
            </div>
          )}
        </div>
        {!isAssistant && (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <User size={20} />
          </div>
        )}
      </div>
    </div>
  );
}

export function ThinkingMessage() {
  // ... (ThinkingMessage can remain the same)
  return (
    <div className="flex gap-4 p-4 max-w-3xl mx-auto">
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary shrink-0">
        <Bot size={20} />
      </div>
      <div className="flex items-center">
        <div className="bouncing-loader">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  );
}
