import { CheckCircle2, XCircle, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Hypothesis } from "@/interfaces/interfaces";

interface SuggestionResultProps {
  status: 'success' | 'failure';
  message: string;
  attempts: number;
  hypotheses: Hypothesis[];
  testedHypotheses?: Hypothesis[] | null;
}

export function SuggestionResult({ status, message, attempts, hypotheses, testedHypotheses }: SuggestionResultProps) {
  const isSuccess = status === 'success';

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
                  <p className="text-sm text-muted-foreground">Trait: {hyp.trait}</p>
                </div>
              ))}
            </div>
          )}

          {testedHypotheses && testedHypotheses.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><ListChecks /> Tested Hypotheses</h4>
              <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-secondary rounded-md">
                {testedHypotheses.map((hyp, i) => (
                  <p key={i} className="text-xs text-muted-foreground font-mono truncate" title={`${hyp.snp}: ${hyp.trait}`}>
                    {hyp.snp}: {hyp.trait}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}