"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type AiEntryState, createAiSystem } from "@/app/dashboard/ai-act/actions";

export type SurveyQuestion = { code: string; question: string; help: string };

export type SurveyLabels = {
  title: string;
  stepBasics: string;
  stepSurvey: string;
  name: string;
  errName: string;
  purpose: string;
  errPurpose: string;
  provider: string;
  providerInternal: string;
  providerThirdParty: string;
  thirdPartyName: string;
  personalData: string;
  yes: string;
  no: string;
  next: string;
  back: string;
  classify: string;
  cancel: string;
};

export function AiSurvey({ questions, labels }: { questions: SurveyQuestion[]; labels: SurveyLabels }) {
  const [state, action, pending] = useActionState<AiEntryState, FormData>(createAiSystem, {});
  const [step, setStep] = useState<1 | 2>(1);
  const [provider, setProvider] = useState<"internal" | "third_party">("internal");
  // Adım 1 alanları, adım 2'ye geçince DOM'da kalsın (form tek seferde gönderilir).
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");

  const canAdvance = name.trim() !== "" && purpose.trim() !== "";

  return (
    <form action={action} className="survey">
      <div className="survey-steps">
        <span className={`survey-step${step === 1 ? " active" : ""}`}>1 · {labels.stepBasics}</span>
        <span className={`survey-step${step === 2 ? " active" : ""}`}>2 · {labels.stepSurvey}</span>
      </div>

      {/* ── Adım 1: sistem bilgileri ── */}
      <div hidden={step !== 1}>
        {state.error === "name" ? <div className="login-error">{labels.errName}</div> : null}
        {state.error === "purpose" ? <div className="login-error">{labels.errPurpose}</div> : null}
        <div className="fld">
          <label>{labels.name}</label>
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Bewerber-Screening KI" />
        </div>
        <div className="fld">
          <label>{labels.purpose}</label>
          <input name="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </div>
        <div className="fld">
          <label>{labels.provider}</label>
          <div className="radio-row">
            <label className="radio">
              <input
                type="radio"
                name="provider"
                value="internal"
                checked={provider === "internal"}
                onChange={() => setProvider("internal")}
              />
              {labels.providerInternal}
            </label>
            <label className="radio">
              <input
                type="radio"
                name="provider"
                value="third_party"
                checked={provider === "third_party"}
                onChange={() => setProvider("third_party")}
              />
              {labels.providerThirdParty}
            </label>
          </div>
        </div>
        <div className="fld" hidden={provider !== "third_party"}>
          <label>{labels.thirdPartyName}</label>
          <input name="thirdPartyName" />
        </div>
        <label className="check">
          <input type="checkbox" name="processesPersonalData" />
          {labels.personalData}
        </label>
        <div className="mf">
          <Link href="/dashboard/ai-act" className="mbtn">
            {labels.cancel}
          </Link>
          <button type="button" className="mbtn primary" disabled={!canAdvance} onClick={() => setStep(2)}>
            {labels.next}
          </button>
        </div>
      </div>

      {/* ── Adım 2: risk soruları (karar ağacı) ── */}
      <div hidden={step !== 2}>
        {questions.map((q) => (
          <div className="survey-q" key={q.code}>
            <div className="survey-q-text">{q.question}</div>
            <div className="survey-q-help">{q.help}</div>
            <div className="radio-row">
              <label className="radio">
                <input type="radio" name={`answer_${q.code}`} value="yes" />
                {labels.yes}
              </label>
              <label className="radio">
                <input type="radio" name={`answer_${q.code}`} value="no" defaultChecked />
                {labels.no}
              </label>
            </div>
          </div>
        ))}
        <div className="mf">
          <button type="button" className="mbtn" onClick={() => setStep(1)}>
            {labels.back}
          </button>
          <button type="submit" className="mbtn primary" disabled={pending}>
            {labels.classify}
          </button>
        </div>
      </div>
    </form>
  );
}
