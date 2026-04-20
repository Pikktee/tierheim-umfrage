"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";
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

export function SurveyDashboard({ surveyData }: DashboardProps) {
  const questionSelectId = useId();
  const filterGroupId = useId();
  const [selectedQuestionId, setSelectedQuestionId] = useState(surveyData.questions[0]?.id ?? "");
  const [selectedGroupId, setSelectedGroupId] = useState<TargetGroupId>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const selectedQuestion = useMemo(
    () => surveyData.questions.find((question) => question.id === selectedQuestionId) ?? surveyData.questions[0],
    [selectedQuestionId, surveyData.questions],
  );

  const filteredRecords = useMemo(() => {
    if (selectedGroupId === "all") {
      return surveyData.records;
    }

    return surveyData.records.filter((record) => record.groups.includes(selectedGroupId));
  }, [selectedGroupId, surveyData.records]);

  const chartData = useMemo(() => {
    if (!selectedQuestion) {
      return [];
    }

    const counts = new Map<string, number>();

    for (const record of filteredRecords) {
      const answers = record.answers[selectedQuestion.id] ?? ["Keine Angabe"];
      const uniqueAnswers = [...new Set(answers)];

      for (const answer of uniqueAnswers) {
        counts.set(answer, (counts.get(answer) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .map(([label, count], index) => ({
        label,
        count,
        percentage: formatPercentage(count, filteredRecords.length),
        fill: chartColors[index % chartColors.length],
      }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "de"));
  }, [filteredRecords, selectedQuestion]);

  const activeGroup = targetGroups.find((group) => group.id === selectedGroupId) ?? targetGroups[0];
  const isMultiSelect = selectedQuestion?.multiSelect ?? false;
  const modalText = chartData
    .map((entry) => `${entry.label}: ${entry.percentage} (${entry.count}/${filteredRecords.length})`)
    .join("\n");

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(modalText);
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
              <label className="control-label" htmlFor={questionSelectId}>
                Frage
              </label>
              <select
                className="select-input"
                id={questionSelectId}
                value={selectedQuestionId}
                onChange={(event) => setSelectedQuestionId(event.target.value)}
              >
                {surveyData.questions.map((question) => (
                  <option key={question.id} value={question.id}>
                    {question.label}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="control-group">
              <legend className="control-label" id={filterGroupId}>
                Zielgruppe
              </legend>
              <div className="chip-group" role="radiogroup" aria-labelledby={filterGroupId}>
                {targetGroups.map((group) => (
                  <button
                    key={group.id}
                    className="chip-button"
                    type="button"
                    role="radio"
                    aria-checked={selectedGroupId === group.id}
                    data-active={selectedGroupId === group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="chart-header">
            <div>
              <p className="small-note">Filter: {activeGroup.label}</p>
              <h2 className="chart-title" id="chart-title">
                {selectedQuestion?.label}
              </h2>
            </div>
            <div className="chart-actions">
              <p className="small-note">{filteredRecords.length} Datensaetze in der Auswahl</p>
              <button className="secondary-button" type="button" onClick={() => setIsModalOpen(true)}>
                Textausgabe
              </button>
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
                <ResponsiveContainer width="100%" height={Math.max(380, 420)}>
                  <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <Pie
                      data={chartData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={82}
                      outerRadius={140}
                      paddingAngle={2}
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

          <p className="legend-note">
            {isMultiSelect
              ? "Mehrfachauswahl wird als Balkendiagramm gezeigt. Die Prozentwerte koennen in Summe ueber 100 % liegen."
              : "Einfachauswahl wird als Kreisdiagramm gezeigt. Die Prozentwerte beziehen sich auf die aktuell gefilterte Auswahl."}
          </p>
        </section>
      </section>

      {isModalOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsModalOpen(false);
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
                <p className="small-note">Textausgabe</p>
                <h2 className="modal-title" id="summary-modal-title">
                  {selectedQuestion?.label}
                </h2>
              </div>
              <div className="modal-actions">
                <button className="icon-button" type="button" onClick={handleCopySummary} aria-label="Textausgabe kopieren">
                  <CopyIcon />
                </button>
                <button className="close-button" type="button" onClick={() => setIsModalOpen(false)}>
                  Schliessen
                </button>
              </div>
            </div>

            <ul className="modal-list">
              {chartData.map((entry) => (
                <li key={entry.label}>
                  {entry.label}: {entry.percentage} ({entry.count}/{filteredRecords.length})
                </li>
              ))}
            </ul>

            <p className="copy-status" aria-live="polite">
              {copyStatus === "copied" ? "Textausgabe wurde in die Zwischenablage kopiert." : " "}
            </p>
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
