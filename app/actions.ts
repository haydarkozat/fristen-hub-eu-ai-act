"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/session";

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export async function setLang(formData: FormData): Promise<void> {
  const lang = String(formData.get("lang") ?? "");
  if (lang === "de" || lang === "tr") {
    (await cookies()).set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  revalidatePath("/", "layout");
}
