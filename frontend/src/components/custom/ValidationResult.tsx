import { CheckCircle2, XCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";

interface Evidence {
  pmid: number;
  p_value_log: number;
}

interface ValidationResultProps {
  is_supported: boolean;
  supporting_evidence: Evidence[];
  confidence_score: number;
  explanation: string;
}

export function ValidationResult({ is_supported, supporting_evidence, confidence_score, explanation }: ValidationResultProps) {
  return (
    <Card className={is_supported ? "border-green-500" : "border-red-500"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {is_supported ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
          Validation Result: {is_supported ? "Supported" : "Not Supported"}
        </CardTitle>
        <CardDescription>{explanation}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">

          {is_supported && supporting_evidence && supporting_evidence.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Supporting Evidence</h4>
              <div className="space-y-2">
                {supporting_evidence.map((evi, index) => {
                  const pValueLogText = typeof evi.p_value_log === 'number' 
                    ? evi.p_value_log.toFixed(2) 
                    : 'N/A';

                  return (
                    <a
                      key={evi.pmid || index}
                      href={evi.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${evi.pmid}`: '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                    >
                      <FileText className="h-4 w-4" />
                      <span>PMID: {evi.pmid || 'N/A'} (p-log: {pValueLogText})</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}