"use client";

import { deleteAiSystem } from "@/app/dashboard/ai-act/actions";

export function AiDeleteButton({ id, confirmText, title }: { id: string; confirmText: string; title: string }) {
  return (
    <form
      action={deleteAiSystem}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="mbtn del-text">
        {title}
      </button>
    </form>
  );
}
