export interface Action {
  tool: string;
  tool_input: string;
}

export interface Step {
  action: Action;
  observation: any;
}

export interface ValidationReport {
  input: string;
  intermediate_steps: Step[];
  explanation: string;
}

export interface message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intermediate_steps?: ValidationReport | Hypothesis[];
  finalAnswer?: string;
}

export interface Hypothesis {
  snp: string;
  trait: string;
  categories: string[] | null;
}