import { SurveyDashboard } from "@/src/components/survey-dashboard";
import { getSurveyData } from "@/src/lib/survey-data";

export default async function HomePage() {
  const surveyData = await getSurveyData();

  return <SurveyDashboard surveyData={surveyData} />;
}
