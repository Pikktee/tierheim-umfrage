"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  targetGroups,
  type SurveyData,
  type TargetGroupId,
} from "@/src/lib/survey-types";

type DashboardProps = {
  surveyData: SurveyData;
};

const AGE_QUESTION = "Wie alt bist du?";
const ADOPTED_QUESTION = "Hast du bereits ein Haustier aus einem Tierheim adoptiert?";
const FUTURE_ADOPTION_QUESTION =
  "Kannst du dir vorstellen, künftig ein Haustier aus einem Tierheim zu adoptieren?";
const SURRENDERED_QUESTION = "Hast du schon einmal ein Haustier bei einem Tierheim abgegeben?";
const FUTURE_SURRENDER_QUESTION =
  "Könntest du dir vorstellen, ein Haustier an ein Tierheim abzugeben, wenn es die Umstände erfordern würden?";
const VOLUNTEERED_QUESTION = "Warst du schon einmal ehrenamtlich engagiert?";
const ACTIVE_VOLUNTEER_QUESTION = "Engagierst du dich ehrenamtlich?";

const relevantQuestionsByGroup: Record<TargetGroupId, string[]> = {
  all: [
    AGE_QUESTION,
    ADOPTED_QUESTION,
    FUTURE_ADOPTION_QUESTION,
    SURRENDERED_QUESTION,
    FUTURE_SURRENDER_QUESTION,
    VOLUNTEERED_QUESTION,
    ACTIVE_VOLUNTEER_QUESTION,
  ],
  "adopters-25-35": [AGE_QUESTION, ADOPTED_QUESTION, FUTURE_ADOPTION_QUESTION],
  "adopters-35-45": [AGE_QUESTION, ADOPTED_QUESTION, FUTURE_ADOPTION_QUESTION],
  "adopters-45-59": [AGE_QUESTION, ADOPTED_QUESTION, FUTURE_ADOPTION_QUESTION],
  "surrendering-18-24": [AGE_QUESTION, SURRENDERED_QUESTION, FUTURE_SURRENDER_QUESTION],
  "volunteers-25-30": [AGE_QUESTION, VOLUNTEERED_QUESTION, ACTIVE_VOLUNTEER_QUESTION],
};

const chartColors = [
  "#B55D32",
  "#2F6F62",
  "#D89B4A",
  "#7A8C3E",
  "#9E5E81",
  "#4E7D96",
  "#CA6E44",
  "#658A74",
  "#B96E9F",
  "#C96D2D",
];

function formatPercentage(count: number, total: number): string {
  if (total === 0) {
    return "0,0 %";
  }

  return `${((count / total) * 100).toFixed(1).replace(".", ",")} %`;
}

function buildChartData(records: SurveyData["records"], questionId: string) {
  const counts = new Map<string, number>();
  let respondents = 0;

  for (const record of records) {
    const answers = record.answers[questionId] ?? [];
    if (answers.length === 0) continue;
    respondents++;
    const uniqueAnswers = [...new Set(answers)];
    for (const answer of uniqueAnswers) {
      counts.set(answer, (counts.get(answer) ?? 0) + 1);
    }
  }

  const entries = [...counts.entries()]
    .map(([label, count], index) => ({
      label,
      count,
      percentage: formatPercentage(count, respondents),
      fill: chartColors[index % chartColors.length],
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "de"));

  return { entries, respondents };
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M9 9.75A2.25 2.25 0 0 1 11.25 7.5h7.5A2.25 2.25 0 0 1 21 9.75v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5A2.25 2.25 0 0 1 9 17.25z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M15 7.5V6.75A2.25 2.25 0 0 0 12.75 4.5h-7.5A2.25 2.25 0 0 0 3 6.75v7.5a2.25 2.25 0 0 0 2.25 2.25H6"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

const PIE_LABEL_RADIAN = Math.PI / 180;
const PIE_OUTER_RADIUS = 120;

function renderPiePercentLabel(props: import("recharts").PieLabelRenderProps) {
  const cx = Number(props.cx ?? 0);
  const cy = Number(props.cy ?? 0);
  const midAngle = Number(props.midAngle ?? 0);
  const percent = Number(props.percent ?? 0);
  const payload = props.payload as { percentage?: string } | undefined;
  if (percent < 0.03 || !payload?.percentage) {
    return null;
  }
  const sin = Math.sin(-PIE_LABEL_RADIAN * midAngle);
  const cos = Math.cos(-PIE_LABEL_RADIAN * midAngle);
  const sx = cx + PIE_OUTER_RADIUS * cos;
  const sy = cy + PIE_OUTER_RADIUS * sin;
  const mx = cx + (PIE_OUTER_RADIUS + 16) * cos;
  const my = cy + (PIE_OUTER_RADIUS + 16) * sin;
  const ex = cx + (PIE_OUTER_RADIUS + 24) * cos;
  const ey = cy + (PIE_OUTER_RADIUS + 24) * sin;
  const textAnchor = cos >= 0 ? "start" : "end";
  const textX = ex + (cos >= 0 ? 5 : -5);
  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="rgba(92,70,47,0.3)" strokeWidth={1.2} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill="rgba(92,70,47,0.35)" />
      <text
        x={textX}
        y={ey}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
        fill="#4a3e34"
      >
        {payload.percentage}
      </text>
    </g>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type QuestionSelectProps = {
  groups: Array<{ label: string; questions: SurveyData["questions"] }>;
  value: string;
  onChange: (id: string) => void;
  labelledBy: string;
  id: string;
};

function QuestionSelect({ groups, value, onChange, labelledBy, id }: QuestionSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const allQuestions = useMemo(() => groups.flatMap((group) => group.questions), [groups]);
  const selected = allQuestions.find((question) => question.id === value);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointer = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="question-select" ref={containerRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="question-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelledBy}
        data-open={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="question-select-value">{selected?.label ?? "Frage wählen"}</span>
        <span className="question-select-caret" aria-hidden="true">
          <ChevronIcon />
        </span>
      </button>
      {open ? (
        <div className="question-select-panel" role="listbox" aria-labelledby={labelledBy}>
          {groups.map((group) => (
            <div className="question-select-group" key={group.label}>
              <div className="question-select-group-label">{group.label}</div>
              {group.questions.map((question) => {
                const active = question.id === value;
                return (
                  <button
                    key={question.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-active={active}
                    className="question-select-option"
                    onClick={() => {
                      onChange(question.id);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                  >
                    <span className="question-select-option-check" aria-hidden="true">
                      {active ? <CheckIcon /> : null}
                    </span>
                    <span>{question.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 10.25v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="7.25" r="1" fill="currentColor" />
    </svg>
  );
}

export function SurveyDashboard({ surveyData }: DashboardProps) {
  const questionSelectId = useId();
  const questionSelectLabelId = useId();
  const filterGroupId = useId();
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const tableInnerRef = useRef<HTMLTableElement | null>(null);
  const bottomScrollRef = useRef<HTMLDivElement | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(surveyData.questions[0]?.id ?? "");
  const [selectedGroupId, setSelectedGroupId] = useState<TargetGroupId>("all");
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [openTooltipId, setOpenTooltipId] = useState<TargetGroupId | null>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);

  const selectedQuestion = useMemo(
    () => surveyData.questions.find((question) => question.id === selectedQuestionId) ?? surveyData.questions[0],
    [selectedQuestionId, surveyData.questions],
  );
  const questionGroups = useMemo(() => {
    const grouped = new Map<string, typeof surveyData.questions>();

    for (const question of surveyData.questions) {
      const current = grouped.get(question.groupLabel) ?? [];
      current.push(question);
      grouped.set(question.groupLabel, current);
    }

    return [...grouped.entries()].map(([label, questions]) => ({
      label,
      questions,
    }));
  }, [surveyData]);

  const filteredRecords = useMemo(() => {
    if (selectedGroupId === "all") {
      return surveyData.records;
    }

    return surveyData.records.filter((record) => record.groups.includes(selectedGroupId));
  }, [selectedGroupId, surveyData.records]);

  const { entries: chartData, respondents: chartRespondents } = useMemo(() => {
    if (!selectedQuestion) {
      return { entries: [], respondents: 0 };
    }

    return buildChartData(filteredRecords, selectedQuestion.id);
  }, [filteredRecords, selectedQuestion]);

  const activeGroup = targetGroups.find((group) => group.id === selectedGroupId) ?? targetGroups[0];
  const isMultiSelect = selectedQuestion?.multiSelect ?? false;
  const relevantQuestions = relevantQuestionsByGroup[selectedGroupId];
  const summarySections = useMemo(() => {
    if (!selectedQuestion) {
      return [];
    }

    const groupsToShow =
      selectedGroupId === "all"
        ? targetGroups.filter((group) => group.id !== "all")
        : [activeGroup];

    return groupsToShow.map((group) => {
      const records =
        group.id === "all"
          ? surveyData.records
          : surveyData.records.filter((record) => record.groups.includes(group.id));

      return {
        groupLabel: group.label,
        total: records.length,
        items: buildChartData(records, selectedQuestion.id).entries.map((entry) => ({
          label: entry.label,
          count: entry.count,
          percentage: entry.percentage,
        })),
      };
    });
  }, [activeGroup, selectedGroupId, selectedQuestion, surveyData.records]);

  const modalText = summarySections
    .map((section) =>
      [section.groupLabel, ...section.items.map((entry) => `${entry.label}: ${entry.percentage} (${entry.count}/${section.total})`)].join("\n"),
    )
    .join("\n\n");
  const figJamMarkdownText = summarySections
    .map((section) =>
      [
        `**${section.groupLabel}**`,
        ...(section.items.length > 0
          ? section.items.map(
              (entry) => `- **${entry.percentage}** - ${entry.label} (${entry.count}/${section.total})`,
            )
          : ["- Keine Angaben"]),
      ].join("\n"),
    )
    .join("\n\n");
  const recordsForModal = filteredRecords.map((record) => ({
    number: record.csvRow,
    submittedAt: record.submittedAt,
    groups:
      record.groups.length > 0
        ? record.groups
            .map((groupId) => targetGroups.find((group) => group.id === groupId)?.label ?? groupId)
            .join(", ")
        : "Keine Zuordnung",
    answer: (selectedQuestion ? record.answers[selectedQuestion.id] : ["Keine Angabe"]).join(", "),
    relevantAnswers: relevantQuestions.map((questionId) => ({
      questionId,
      questionLabel: surveyData.questions.find((question) => question.id === questionId)?.label ?? questionId,
      value: (record.answers[questionId] ?? ["Keine Angabe"]).join(", "),
    })),
  }));

  useEffect(() => {
    if (!isSummaryModalOpen && !isRecordsModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSummaryModalOpen(false);
        setIsRecordsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRecordsModalOpen, isSummaryModalOpen]);

  useEffect(() => {
    if (!isRecordsModalOpen) {
      return;
    }

    const syncWidths = () => {
      setTableScrollWidth(tableInnerRef.current?.scrollWidth ?? 0);
    };

    syncWidths();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            syncWidths();
          })
        : null;

    if (resizeObserver && tableInnerRef.current) {
      resizeObserver.observe(tableInnerRef.current);
    }

    window.addEventListener("resize", syncWidths);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", syncWidths);
    };
  }, [isRecordsModalOpen, relevantQuestions.length, recordsForModal.length, selectedQuestion?.id]);

  function syncTableScroll(source: "table" | "bottom") {
    const tableNode = tableScrollRef.current;
    const bottomNode = bottomScrollRef.current;

    if (!tableNode || !bottomNode) {
      return;
    }

    if (source === "table") {
      bottomNode.scrollLeft = tableNode.scrollLeft;
      return;
    }

    tableNode.scrollLeft = bottomNode.scrollLeft;
  }

  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(figJamMarkdownText);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1600);
    } catch {
      setCopyStatus("idle");
    }
  }

  return (
    <main className="page-shell">
      <section className="hero hero-compact" aria-labelledby="dashboard-title">
        <div className="hero-brand">
          <Image
            src="/logo-icon-sm.png"
            alt="Logo Tierheim Hanau"
            width={92}
            height={92}
            className="hero-logo"
            priority
          />
          <div>
            <span className="eyebrow">Tierheim Hanau</span>
            <h1 id="dashboard-title">Umfrage Tierheim Hanau</h1>
          </div>
        </div>
      </section>

      <section className="chart-layout" aria-label="Auswertung">
        <section className="card chart-panel" aria-labelledby="chart-title">
          <div className="controls controls-inline">
            <div className="control-group">
              <span className="control-label" id={questionSelectLabelId}>
                Frage
              </span>
              <QuestionSelect
                id={questionSelectId}
                labelledBy={questionSelectLabelId}
                groups={questionGroups}
                value={selectedQuestionId}
                onChange={setSelectedQuestionId}
              />
            </div>

            <fieldset className="control-group">
              <legend className="control-label" id={filterGroupId}>
                Zielgruppe
              </legend>
              <div className="chip-group" role="radiogroup" aria-labelledby={filterGroupId}>
                {targetGroups.map((group) => (
                  <div className="chip-with-tooltip" key={group.id}>
                    <button
                      className="chip-button"
                      type="button"
                      role="radio"
                      aria-checked={selectedGroupId === group.id}
                      data-active={selectedGroupId === group.id}
                      aria-describedby={`group-help-${group.id}`}
                      onClick={() => setSelectedGroupId(group.id)}
                      onMouseEnter={() => setOpenTooltipId(group.id)}
                      onMouseLeave={() => setOpenTooltipId((current) => (current === group.id ? null : current))}
                      onFocus={() => setOpenTooltipId(group.id)}
                      onBlur={() => setOpenTooltipId((current) => (current === group.id ? null : current))}
                    >
                      <span>{group.label}</span>
                      <span className="chip-button-icon" aria-hidden="true">
                        <InfoIcon />
                      </span>
                    </button>
                    <div
                      className="tooltip-bubble"
                      data-open={openTooltipId === group.id}
                      role="tooltip"
                      id={`group-help-${group.id}`}
                    >
                      {group.description}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="chart-header">
            <div className="chart-heading">
              <p className="small-note chart-kicker">Frage:</p>
              <h2 className="chart-title" id="chart-title">
                {selectedQuestion?.label}
              </h2>
              <p className="selection-count" aria-live="polite">
                {chartRespondents} Antworten in der Auswahl
              </p>
            </div>
            <div className="chart-actions">
              <div className="action-row">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setIsRecordsModalOpen(true)}
                >
                  Datensätze
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setIsSummaryModalOpen(true)}
                >
                  Export
                </button>
              </div>
            </div>
          </div>

          {chartData.length > 0 ? (
            isMultiSelect ? (
              <div
                className="chart-wrapper"
                role="img"
                aria-label={`Balkendiagramm zur Frage ${selectedQuestion?.label} mit ${chartData.length} Antwortoptionen.`}
              >
                <ResponsiveContainer width="100%" height={Math.max(360, chartData.length * 56)}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 8, right: 30, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid horizontal={false} stroke="rgba(92, 70, 47, 0.14)" />
                    <XAxis type="number" allowDecimals={false} stroke="#64584B" />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={220}
                      tick={{ fill: "#1F1A17", fontSize: 13 }}
                      stroke="#64584B"
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(181, 93, 50, 0.08)" }}
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid rgba(92, 70, 47, 0.14)",
                        backgroundColor: "#fffaf3",
                      }}
                      formatter={(value) => [`${String(value ?? 0)} Antworten`, "Anzahl"]}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                      <LabelList dataKey="percentage" position="right" fill="#1F1A17" fontSize={12} />
                      {chartData.map((entry) => (
                        <Cell key={entry.label} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div
                className="chart-wrapper pie-wrapper"
                role="img"
                aria-label={`Kreisdiagramm zur Frage ${selectedQuestion?.label} mit ${chartData.length} Antwortoptionen.`}
              >
                <ResponsiveContainer width="100%" height={430}>
                  <PieChart margin={{ top: 0, right: 60, left: 60, bottom: 20 }}>
                    <Pie
                      data={chartData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={68}
                      outerRadius={PIE_OUTER_RADIUS}
                      paddingAngle={2}
                      label={renderPiePercentLabel}
                      labelLine={false}
                      isAnimationActive={false}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.label} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid rgba(92, 70, 47, 0.14)",
                        backgroundColor: "#fffaf3",
                      }}
                      formatter={(value) => [`${String(value ?? 0)} Antworten`, "Anzahl"]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      formatter={(value) => <span className="legend-value">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )
          ) : (
            <div className="empty-state">
              <p>Fuer diese Zielgruppe liegen zur ausgewaehlten Frage keine Antworten vor.</p>
            </div>
          )}


        </section>
      </section>

      {isSummaryModalOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsSummaryModalOpen(false);
            }
          }}
        >
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="summary-modal-title"
          >
            <div className="modal-header">
              <div>
                <p className="small-note">Export nach FigJam</p>
                <h2 className="modal-title" id="summary-modal-title">
                  {selectedQuestion?.label}
                </h2>
              </div>
              <div className="modal-actions">
                <button
                  className="secondary-button copy-button"
                  type="button"
                  onClick={handleCopySummary}
                  data-state={copyStatus}
                  aria-live="polite"
                >
                  {copyStatus === "copied" ? (
                    <>
                      <CheckIcon />
                      <span>Kopiert</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon />
                      <span>Kopieren</span>
                    </>
                  )}
                </button>
                <button className="close-button" type="button" onClick={() => setIsSummaryModalOpen(false)}>
                  Schliessen
                </button>
              </div>
            </div>

            <div className="summary-sections">
              {summarySections.map((section) => (
                <section className="summary-section" key={section.groupLabel}>
                  <p className="summary-group-label">
                    <strong>{section.groupLabel}</strong>
                  </p>
                  {section.items.length > 0 ? (
                    <ul className="modal-list">
                      {section.items.map((entry) => (
                        <li key={`${section.groupLabel}-${entry.label}`}>
                          <strong>{entry.percentage}</strong> – {entry.label} ({entry.count}/{section.total})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="modal-empty-note">Keine Angaben</p>
                  )}
                </section>
              ))}
            </div>

          </section>
        </div>
      ) : null}

      {isRecordsModalOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsRecordsModalOpen(false);
            }
          }}
        >
          <section
            className="modal-card modal-card-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="records-modal-title"
          >
            <div className="modal-header">
              <div>
                <p className="small-note">Datensaetze hinter dem Chart</p>
                <h2 className="modal-title" id="records-modal-title">
                  {selectedQuestion?.label}
                </h2>
              </div>
              <div className="modal-actions">
                <button className="close-button" type="button" onClick={() => setIsRecordsModalOpen(false)}>
                  Schliessen
                </button>
              </div>
            </div>

            <div
              className="table-wrap"
              ref={tableScrollRef}
              onScroll={() => syncTableScroll("table")}
            >
              <table className="records-table" ref={tableInnerRef}>
                <thead>
                  <tr>
                    <th scope="col">Nr.</th>
                    <th scope="col">Zeitstempel</th>
                    <th scope="col">Zielgruppen</th>
                    {selectedQuestion && !relevantQuestions.includes(selectedQuestion.id) ? (
                      <th scope="col">{selectedQuestion.label}</th>
                    ) : null}
                    {relevantQuestions.map((questionId) => (
                      <th key={questionId} scope="col">
                        {surveyData.questions.find((question) => question.id === questionId)?.label ?? questionId}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recordsForModal.map((record) => (
                    <tr key={`${record.number}-${record.submittedAt}`}>
                      <td>{record.number}</td>
                      <td>{record.submittedAt}</td>
                      <td>{record.groups}</td>
                      {selectedQuestion && !relevantQuestions.includes(selectedQuestion.id) ? (
                        <td>{record.answer}</td>
                      ) : null}
                      {record.relevantAnswers.map((entry) => (
                        <td key={`${record.number}-${entry.questionId}`}>{entry.value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="table-scrollbar"
              ref={bottomScrollRef}
              onScroll={() => syncTableScroll("bottom")}
              aria-label="Horizontaler Scrollbalken fuer die Datensatz-Tabelle"
            >
              <div style={{ width: tableScrollWidth > 0 ? `${tableScrollWidth}px` : "100%" }} />
            </div>
          </section>
        </div>
      ) : null}

      <p className="sr-only">
        Die App ist fuer Tastaturbedienung optimiert. Frageauswahl, Zielgruppenfilter und Modal
        koennen vollstaendig ohne Maus bedient werden.
      </p>
    </main>
  );
}
