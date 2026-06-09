import { getLang, t } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const lang = await getLang();
  const dict = t(lang);
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand-name">
          Fristen<span>·</span>Hub
        </div>
        <div className="subtitle">{dict.loginSubtitle}</div>
        <LoginForm
          labels={{
            email: dict.email,
            password: dict.password,
            signIn: dict.signIn,
            invalid: dict.invalidCreds,
            missing: dict.missingFields,
          }}
        />
      </div>
    </div>
  );
}
