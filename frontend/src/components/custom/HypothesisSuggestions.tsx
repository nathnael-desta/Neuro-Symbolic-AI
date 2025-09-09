import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Hypothesis } from "../../interfaces/interfaces";

interface HypothesisSuggestionsProps {
  suggestions: Hypothesis[];
  onSelect: (hypothesis: Hypothesis) => void;
}

export function HypothesisSuggestions({ suggestions, onSelect }: HypothesisSuggestionsProps) {
  return (
    <div className="space-y-4 my-4">
      {suggestions.map((suggestion, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Suggested Hypothesis
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => onSelect(suggestion)}>
              Validate this
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {suggestion.trait}
            </p>
            <div className="text-xs font-mono pt-2">SNP: {suggestion.snp}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}