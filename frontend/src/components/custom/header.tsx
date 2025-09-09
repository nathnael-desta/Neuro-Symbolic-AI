import { ThemeToggle } from "./theme-toggle";
import { Button } from "../ui/button";
import { PanelLeftOpen, Sparkles } from "lucide-react";

interface HeaderProps {
  title: string;
  onToggleSidebar: () => void;
  onSuggestHypotheses: () => void;
}

export function Header({ title, onToggleSidebar, onSuggestHypotheses }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="md:hidden">
          <PanelLeftOpen className="h-5 w-5" />
          <span className="sr-only">Toggle Suggestions</span>
        </Button>
        <h1 className="text-xl font-bold md:ml-0 ml-4">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onSuggestHypotheses}>
          <Sparkles className="mr-2 h-4 w-4" />
          Suggest Hypotheses
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}