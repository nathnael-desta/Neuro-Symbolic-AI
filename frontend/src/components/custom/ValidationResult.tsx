import { CheckCircle2, XCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";

interface Evidence {
  pmid: number;
  p_value_log: number;
}

interface ValidationResultProps {
  isSupported: boolean;
  supportingEvidence: Evidence[];
  confidenceScore: number;
  explanation: string;
}

export function ValidationResult({ isSupported, supportingEvidence, confidenceScore, explanation }: ValidationResultProps) {
  return (
    <Card className={isSupported ? "border-green-500" : "border-red-500"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSupported ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
          Validation Result: {isSupported ? "Supported" : "Not Supported"}
        </CardTitle>
        <CardDescription>{explanation}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Confidence Score</h4>
            <Badge variant={isSupported ? "default" : "destructive"}>
              {(confidenceScore * 100).toFixed(2)}%
            </Badge>
          </div>
          {isSupported && supportingEvidence.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Supporting Evidence</h4>
              <div className="space-y-2">
                {supportingEvidence.map((evi) => (
                  <a
                    key={evi.pmid}
                    href={`https://pubmed.ncbi.nlm.nih.gov/${evi.pmid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <FileText className="h-4 w-4" />
                    <span>PMID: {evi.pmid} (p-log: {evi.p_value_log.toFixed(2)})</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}