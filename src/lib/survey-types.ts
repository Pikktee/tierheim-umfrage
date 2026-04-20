export type TargetGroupId =
  | "all"
  | "adopters-25-35"
  | "adopters-35-45"
  | "adopters-45-59"
  | "surrendering-18-24"
  | "volunteers-25-30";

export type SurveyQuestion = {
  id: string;
  label: string;
  multiSelect: boolean;
};

export type SurveyRecord = {
  id: string;
  ageBracket: string;
  groups: TargetGroupId[];
  answers: Record<string, string[]>;
};

export type SurveyData = {
  totalResponses: number;
  questions: SurveyQuestion[];
  records: SurveyRecord[];
};

export const targetGroups: Array<{ id: TargetGroupId; label: string }> = [
  { id: "all", label: "Alle Datensätze" },
  { id: "adopters-25-35", label: "Tieradoptierende (25-35 Jahre)" },
  { id: "adopters-35-45", label: "Tieradoptierende (35-45 Jahre)" },
  { id: "adopters-45-59", label: "Tieradoptierende (45-59 Jahre)" },
  { id: "surrendering-18-24", label: "Tierabgebende (18-24 Jahre)" },
  { id: "volunteers-25-30", label: "Ehrenamtliche (25-30 Jahre)" },
];
