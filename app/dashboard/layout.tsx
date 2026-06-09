import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getAiCount } from "@/lib/ai-act";
import { getSession } from "@/lib/auth";
import { getCounts, getDocFields } from "@/lib/deadlines";
import { fmtDate } from "@/lib/format";
import { getLang, t } from "@/lib/i18n";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const lang = await getLang();
  const dict = t(lang);
  const [counts, aiSystems, driverFields, vehicleFields] = await Promise.all([
    getCounts(),
    getAiCount(),
    getDocFields("driver", lang),
    getDocFields("vehicle", lang),
  ]);
  const todayLabel = fmtDate(new Date(), dict.locale);

  const entryLabels = {
    addEntry: dict.addEntry,
    newDriver: dict.newDriver,
    newVehicle: dict.newVehicle,
    driver: dict.colDriver,
    vehicle: dict.colVehicle,
    name: dict.fName,
    employeeNo: dict.fEmployeeNo,
    plate: dict.fPlate,
    model: dict.fModel,
    save: dict.save,
    cancel: dict.cancel,
    errName: dict.errName,
    errPlate: dict.errPlate,
    until: dict.untilSuffix,
    last: dict.lastSuffix,
  };

  return (
    <div className="app">
      <Sidebar
        nav={dict.nav}
        management={dict.management}
        logoutLabel={dict.logout}
        counts={{ ...counts, aiSystems }}
      />
      <div className="main">
        <Topbar
          nav={dict.nav}
          todayLabel={todayLabel}
          todayPrefix={dict.today}
          lang={lang}
          driverFields={driverFields}
          vehicleFields={vehicleFields}
          entryLabels={entryLabels}
        />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
