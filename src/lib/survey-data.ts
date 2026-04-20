import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";

import {
  type SurveyData,
  type SurveyQuestion,
  type SurveyRecord,
  type TargetGroupId,
} from "@/src/lib/survey-types";

const MULTI_SELECT_QUESTIONS = new Set<string>([
  "Welche Haustiere hast du in der Vergangenheit bereits aus einem Tierheim adoptiert?",
  "Über welche Informationsquellen informierst du dich hauptsächlich?",
  "Welche Social-Media-Kanäle nutzt du?",
  "Was machst du, um Dein Haustier zu erziehen?",
  "Unabhängig vom Thema Tier: Welche belastenden Lebenssituationen hast du bisher erlebt?",
  "Zu welchen Zeiten könntest du dich ehrenamtlich engagieren?",
  "Was motiviert dich, ehrenamtlich aktiv zu sein?",
  "Was hält dich aktuell davon ab, dich ehrenamtlich zu engagieren?",
  "In welchem Bereich bist du/warst du ehrenamtlich tätig?",
]);

const ADOPTED_QUESTION =
  "Hast du bereits ein Haustier aus einem Tierheim adoptiert?";
const FUTURE_ADOPTION_QUESTION =
  "Kannst du dir vorstellen, künftig ein Haustier aus einem Tierheim zu adoptieren?";
const SURRENDERED_QUESTION =
  "Hast du schon einmal ein Haustier bei einem Tierheim abgegeben?";
const FUTURE_SURRENDER_QUESTION =
  "Könntest du dir vorstellen, ein Haustier an ein Tierheim abzugeben, wenn es die Umstände erfordern würden?";
const VOLUNTEERED_QUESTION = "Warst du schon einmal ehrenamtlich engagiert?";
const ACTIVE_VOLUNTEER_QUESTION = "Engagierst du dich ehrenamtlich?";
const AGE_QUESTION = "Wie alt bist du?";

const QUESTION_GROUPS: Array<{ label: string; questions: string[] }> = [
  {
    label: "Allgemeine Fragen",
    questions: [
      "Wie alt bist du?",
      "Hast du bereits ein Haustier aus einem Tierheim adoptiert?",
      "Welche Haustiere hast du in der Vergangenheit bereits aus einem Tierheim adoptiert?",
      "Kannst du dir vorstellen, künftig ein Haustier aus einem Tierheim zu adoptieren?",
      "Hast du schon einmal ein Haustier bei einem Tierheim abgegeben?",
      "Könntest du dir vorstellen, ein Haustier an ein Tierheim abzugeben, wenn es die Umstände erfordern würden?",
      "Warst du schon einmal ehrenamtlich engagiert?",
      "Engagierst du dich ehrenamtlich?",
    ],
  },
  {
    label: "Tieradoptierende (25-35 Jahre)",
    questions: [
      "Über welche Informationsquellen informierst du dich hauptsächlich?",
      "Welche Informationsquelle nutzt du am häufigsten?",
      "Welche Social-Media-Kanäle nutzt du?",
    ],
  },
  {
    label: "Tieradoptierende (35-45 Jahre)",
    questions: ["Hast du Kinder?", "Wie viele Kinder hast du?"],
  },
  {
    label: "Tieradoptierende (45-59 Jahre)",
    questions: [
      "Hattest du schon einmal ein Haustier?",
      "Wie viel Erfahrung hast du im Umgang mit Haustieren?",
      "Was machst du, um Dein Haustier zu erziehen?",
    ],
  },
  {
    label: "Tierabgebende (18-24 Jahre)",
    questions: [
      "Unabhängig vom Thema Tier: Welche belastenden Lebenssituationen hast du bisher erlebt?",
      "Wie hast du dich während des Abgabeprozesses gefühlt?",
      "Könntest du dir unter anderen Umständen vorstellen, erneut ein Tier zu adoptieren?",
      "Was waren die wichtigsten Gründe für deine Entscheidung, dein Tier abzugeben?",
    ],
  },
  {
    label: "Ehrenamtliche (25-30 Jahre)",
    questions: [
      "In welchem Bereich bist du/warst du ehrenamtlich tätig?",
      "Wie wichtig ist dir eine flexible Zeiteinteilung bei ehrenamtlichen Tätigkeiten?",
      "Zu welchen Zeiten könntest du dich ehrenamtlich engagieren?",
      "Was motiviert dich, ehrenamtlich aktiv zu sein?",
      "Was hält dich aktuell davon ab, dich ehrenamtlich zu engagieren?",
    ],
  },
];

let surveyDataPromise: Promise<SurveyData> | undefined;
const TIMESTAMP_PATTERN = /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/;

function normalizeAge(value: string): string {
  const cleaned = value.trim();

  switch (cleaned) {
    case "25-34":
      return "25-35";
    case "35-44":
      return "35-45";
    case "45-50":
    case "45-59":
    case "-> (45-59)":
      return "45-59";
    case "18-24":
    case "-> (18-24)":
      return "18-24";
    default:
      return cleaned || "Keine Angabe";
  }
}

function splitMultiValue(value: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let parenDepth = 0;

  for (const char of value) {
    if (char === "(") {
      parenDepth += 1;
    }

    if (char === ")" && parenDepth > 0) {
      parenDepth -= 1;
    }

    if (char === "," && parenDepth === 0) {
      if (current.trim()) {
        tokens.push(current.trim());
      }
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens;
}

function normalizeAnswer(question: string, rawValue: string): string[] {
  const cleaned = rawValue.trim();

  if (!cleaned) {
    return [];
  }

  if (MULTI_SELECT_QUESTIONS.has(question)) {
    return splitMultiValue(cleaned)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [question === AGE_QUESTION ? normalizeAge(cleaned) : cleaned];
}

function hasValidTimestamp(row: Record<string, string>): boolean {
  const submittedAt = row["Zeitstempel"]?.trim() ?? "";
  return TIMESTAMP_PATTERN.test(submittedAt);
}

function isAdopter(row: Record<string, string>): boolean {
  const adopted = row[ADOPTED_QUESTION]?.trim();
  const future = row[FUTURE_ADOPTION_QUESTION]?.trim();

  return adopted !== "" && adopted !== "Keine"
    ? true
    : future === "Ja" || future === "Vielleicht";
}

function isSurrenderingPerson(row: Record<string, string>): boolean {
  const surrendered = row[SURRENDERED_QUESTION]?.trim();
  const future = row[FUTURE_SURRENDER_QUESTION]?.trim();

  return surrendered !== "" && surrendered !== "Keine"
    ? true
    : future === "Ja" || future === "Vielleicht";
}

function isVolunteer(row: Record<string, string>): boolean {
  const volunteered = row[VOLUNTEERED_QUESTION]?.trim();
  const active = row[ACTIVE_VOLUNTEER_QUESTION]?.trim();

  return volunteered === "Ja" || active === "Ja";
}

function getGroups(row: Record<string, string>, ageBracket: string): TargetGroupId[] {
  const groups: TargetGroupId[] = [];

  if (ageBracket === "25-35" && isAdopter(row)) {
    groups.push("adopters-25-35");
  }

  if (ageBracket === "35-45" && isAdopter(row)) {
    groups.push("adopters-35-45");
  }

  if (ageBracket === "45-59" && isAdopter(row)) {
    groups.push("adopters-45-59");
  }

  if (ageBracket === "18-24" && isSurrenderingPerson(row)) {
    groups.push("surrendering-18-24");
  }

  if (ageBracket === "25-35" && isVolunteer(row)) {
    groups.push("volunteers-25-30");
  }

  return groups;
}

async function loadSurveyData(): Promise<SurveyData> {
  const csvPath = path.join(process.cwd(), "data", "Umfrage.csv");
  const csvText = await readFile(csvPath, "utf8");
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    throw new Error(`CSV parsing failed: ${parsed.errors[0]?.message ?? "Unknown error"}`);
  }

  const headers = parsed.meta.fields ?? [];
  const headerSet = new Set(headers.filter((header) => header !== "Zeitstempel"));
  const groupedQuestions = QUESTION_GROUPS.flatMap((group) =>
    group.questions
      .filter((question) => headerSet.has(question))
      .map((question) => ({
        id: question,
        label: question,
        multiSelect: MULTI_SELECT_QUESTIONS.has(question),
        groupLabel: group.label,
      })),
  );

  const remainingQuestions = [...headerSet]
    .filter((header) => !groupedQuestions.some((question) => question.id === header))
    .map((header) => ({
      id: header,
      label: header,
      multiSelect: MULTI_SELECT_QUESTIONS.has(header),
      groupLabel: "Weitere Fragen",
    }));

  const questions: SurveyQuestion[] = [...groupedQuestions, ...remainingQuestions];

  const records: SurveyRecord[] = parsed.data
    .map((row, index) => ({ row, csvRow: index + 2 }))
    .filter(({ row }) => hasValidTimestamp(row))
    .map(({ row, csvRow }, index) => {
      const ageBracket = normalizeAge(row[AGE_QUESTION] ?? "");
      const answers = Object.fromEntries(
        questions.map((question) => [
          question.id,
          normalizeAnswer(question.id, row[question.id] ?? ""),
        ]),
      );

      return {
        id: `response-${index + 1}`,
        csvRow,
        submittedAt: row["Zeitstempel"]?.trim() || "Keine Angabe",
        ageBracket,
        groups: getGroups(row, ageBracket),
        answers,
      };
    });

  return {
    totalResponses: records.length,
    questions,
    records,
  };
}

export function getSurveyData(): Promise<SurveyData> {
  surveyDataPromise ??= loadSurveyData();
  return surveyDataPromise;
}
