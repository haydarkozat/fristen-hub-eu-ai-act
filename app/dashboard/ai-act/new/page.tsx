import { AiSurvey, type SurveyQuestion } from "@/components/ai-survey";
import { getActiveRuleset } from "@/lib/ai-act";
import { getLang, t } from "@/lib/i18n";

export default async function NewAiSystemPage() {
  const lang = await getLang();
  const dict = t(lang);
  const ruleset = await getActiveRuleset();

  const questions: SurveyQuestion[] = (ruleset?.rules ?? []).map((r) => ({
    code: r.code,
    question: lang === "tr" ? r.questionTr : r.questionDe,
    help: lang === "tr" ? r.helpTr : r.helpDe,
  }));

  return (
    <>
      <div className="sec-head">
        <h2>{dict.aiNewTitle}</h2>
        {ruleset ? <span className="count">{lang === "tr" ? ruleset.labelTr : ruleset.labelDe}</span> : null}
      </div>
      <div className="panel" style={{ padding: 22 }}>
        <AiSurvey
          questions={questions}
          labels={{
            title: dict.aiNewTitle,
            stepBasics: dict.aiStepBasics,
            stepSurvey: dict.aiStepSurvey,
            name: dict.fName,
            errName: dict.errName,
            purpose: dict.aiFPurpose,
            errPurpose: dict.aiErrPurpose,
            provider: dict.aiFProvider,
            providerInternal: dict.aiProviderInternal,
            providerThirdParty: dict.aiProviderThirdParty,
            thirdPartyName: dict.aiFThirdPartyName,
            personalData: dict.aiFPersonalData,
            yes: dict.aiYes,
            no: dict.aiNo,
            next: dict.aiNext,
            back: dict.aiBack,
            classify: dict.aiClassify,
            cancel: dict.cancel,
          }}
        />
      </div>
    </>
  );
}
