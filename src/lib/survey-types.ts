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
  groupLabel: string;
};

export type SurveyRecord = {
  id: string;
  submittedAt: string;
  ageBracket: string;
  groups: TargetGroupId[];
  answers: Record<string, string[]>;
};

export type SurveyData = {
  totalResponses: number;
  questions: SurveyQuestion[];
  records: SurveyRecord[];
};

export const targetGroups: Array<{
  id: TargetGroupId;
  label: string;
  description: string;
}> = [
  {
    id: "all",
    label: "Alle",
    description: "Zeigt alle Antworten aus der Umfrage ohne zusätzliche Filterung nach Alter oder Rolle.",
  },
  {
    id: "adopters-25-35",
    label: "Tieradoptierende (25-35 Jahre)",
    description:
      "Berücksichtigt Personen im Altersbereich 25 bis 35, die bereits ein Tier aus dem Tierheim adoptiert haben oder sich eine künftige Adoption vorstellen können.",
  },
  {
    id: "adopters-35-45",
    label: "Tieradoptierende (35-45 Jahre)",
    description:
      "Berücksichtigt Personen im Altersbereich 35 bis 45, die bereits ein Tier aus dem Tierheim adoptiert haben oder sich eine künftige Adoption vorstellen können.",
  },
  {
    id: "adopters-45-59",
    label: "Tieradoptierende (45-59 Jahre)",
    description:
      "Berücksichtigt Personen im Altersbereich 45 bis 59. Die Gruppe wird über die Altersfrage sowie über bestehende oder potenzielle Tieradoptionen bestimmt.",
  },
  {
    id: "surrendering-18-24",
    label: "Tierabgebende (18-24 Jahre)",
    description:
      "Berücksichtigt Personen im Alter von 18 bis 24, die bereits ein Tier abgegeben haben oder sich vorstellen können, ein Tier bei veränderten Umständen an ein Tierheim abzugeben.",
  },
  {
    id: "volunteers-25-30",
    label: "Ehrenamtliche (25-30 Jahre)",
    description:
      "Berücksichtigt Antworten aus der vorhandenen Altersklasse 25 bis 35 von Personen, die schon ehrenamtlich engagiert waren oder sich aktuell engagieren. Eine feinere 25-30-Trennung liegt in der CSV nicht vor.",
  },
];
