import { message, Hypothesis, ValidationReport } from "../../interfaces/interfaces";
import { cn } from "../../lib/utils";
import { Bot, User } from "lucide-react";
import { IntermediateSteps } from "./IntermediateSteps";
import { Markdown } from "./markdown";
import { HypothesisSuggestions } from "./HypothesisSuggestions";

function isHypothesisArray(steps: any): steps is Hypothesis[] {
  return Array.isArray(steps) && steps.length > 0 && typeof steps[0] === 'object' && 'snp' in steps[0] && 'trait' in steps[0];
}

function isValidationReport(steps: any): steps is ValidationReport {
    return steps && typeof steps === 'object' && 'intermediate_steps' in steps && 'explanation' in steps;
}

export function Message({ message, onValidateHypothesis }: { message: message, onValidateHypothesis: (hypothesis: Hypothesis) => void }) {
  const { role, content } = message;
  const isAssistant = role === "assistant";

  return (
    <div className="flex flex-col group md:items-center">
      <div className="flex gap-4 p-4 md:max-w-3xl md:w-full">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary shrink-0">
          {isAssistant ? <Bot size={20} /> : <User size={20} />}
        </div>
        <div className="flex-1 space-y-4">
          <Markdown>{content}</Markdown>
          {message.intermediate_steps && isValidationReport(message.intermediate_steps) && (
            <IntermediateSteps report={message.intermediate_steps} />
          )}
          {message.intermediate_steps && isHypothesisArray(message.intermediate_steps) && (
            <HypothesisSuggestions suggestions={message.intermediate_steps} onSelect={onValidateHypothesis} />
          )}
        </div>
      </div>
    </div>
  );
}

export function ThinkingMessage() {
  return (
    <div className="flex flex-col group md:items-center">
      <div className="flex gap-4 p-4 md:max-w-3xl md:w-full">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary shrink-0">
          <Bot size={20} />
        </div>
        <div className="flex flex-col min-w-0 w-full">
          <div className="font-semibold">
            Assistant
          </div>
          <div className="min-w-0 h-8 flex items-center">
            <div className="bouncing-loader">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
