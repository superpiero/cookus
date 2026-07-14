"use client";

import { useTransition } from "react";
import { setApplicationStatusAction } from "@/actions/jobs";
import { APPLICATION_STATUS_LABELS } from "@/lib/const";
import type { ApplicationStatus } from "@prisma/client";

const ORDER: ApplicationStatus[] = ["SHORTLISTED", "HIRED", "REJECTED"];

export function ApplicationStatusButtons({
  applicationId,
  current,
}: {
  applicationId: string;
  current: ApplicationStatus;
}) {
  const [pending, startTransition] = useTransition();

  const styleFor = (status: ApplicationStatus, active: boolean) => {
    const base = "rounded-full border-2 border-vinyl px-3 py-1 text-xs font-extrabold disabled:opacity-50";
    if (!active) return `${base} bg-porcelain hover:bg-chrome-light`;
    if (status === "HIRED") return `${base} bg-teal text-white`;
    if (status === "REJECTED") return `${base} bg-ketchup text-white`;
    return `${base} bg-mustard`;
  };

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Stav přihlášky">
      {ORDER.map((status) => (
        <button
          key={status}
          type="button"
          disabled={pending || current === status}
          className={styleFor(status, current === status)}
          onClick={() => startTransition(() => setApplicationStatusAction(applicationId, status))}
        >
          {APPLICATION_STATUS_LABELS[status]}
        </button>
      ))}
    </div>
  );
}
