import { useState } from "react";
import { CheckCircle2, XCircle, ListChecks, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Hypothesis } from "@/interfaces/interfaces";
import { ScrollArea } from "../ui/scroll-area";

interface SuggestionResultProps {
  status: 'success' | 'failure';
  message: string;
  attempts: number;
  hypotheses: Hypothesis[];
  tested_hypotheses?: Hypothesis[] | null; // FIX: Changed prop name to snake_case
}

export function SuggestionResult({ status, message, attempts, hypotheses, tested_hypotheses }: SuggestionResultProps) { // FIX: Destructure the correct prop name
  const isSuccess = status === 'success';
  const [showTested, setShowTested] = useState(false);

  return (
    <Card className={isSuccess ? "border-blue-500" : "border-orange-500"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSuccess ? <CheckCircle2 className="text-blue-500" /> : <XCircle className="text-orange-500" />}
          Suggestion Result: {isSuccess ? "Success" : "Failure"}
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Badge variant="secondary">Attempts: {attempts}</Badge>
          
          {isSuccess && hypotheses.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Validated Hypothesis</h4>
              {hypotheses.map((hyp, i) => (
                <div key={i} className="p-2 bg-secondary rounded-md">
                  <p className="font-mono text-sm">SNP: {hyp.snp}</p>
                  <p className="text-sm text-muted-foreground">Trait: {hyp.trait.replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          )}

          {tested_hypotheses && tested_hypotheses.length > 0 && ( // FIX: Check the correct variable
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowTested(!showTested)}
              >
                {showTested ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                {showTested ? 'Hide' : 'Show'} {tested_hypotheses.length} Tested Hypotheses
              </Button>

              {showTested && (
                <ScrollArea className="h-40 w-full rounded-md border p-2 mt-2">
                  <div className="space-y-1">
                    {tested_hypotheses.map((hyp, i) => ( // FIX: Map over the correct variable
                      <div key={i} className="text-xs text-muted-foreground font-mono truncate" title={`${hyp.snp}: ${hyp.trait.replace(/_/g, ' ')}`}>
                        <p className="font-bold">{hyp.snp}</p>
                        <p>{hyp.trait.replace(/_/g, ' ')}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}