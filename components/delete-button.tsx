"use client";

import { deleteDriver, deleteVehicle } from "@/app/dashboard/actions";

export function DeleteButton({
  id,
  kind,
  confirmText,
  title,
}: {
  id: string;
  kind: "driver" | "vehicle";
  confirmText: string;
  title: string;
}) {
  const action = kind === "driver" ? deleteDriver : deleteVehicle;
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="row-del" title={title} aria-label={title}>
        ×
      </button>
    </form>
  );
}
