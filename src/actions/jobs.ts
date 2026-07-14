"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { sendMail, appUrl } from "@/lib/mail";
import { CITIES } from "@/lib/const";
import type { FormState } from "./auth";
import { JobCategory, EmploymentType, SalaryPeriod, ApplicationStatus } from "@prisma/client";

const jobSchema = z
  .object({
    title: z.string().trim().min(3, "Název min. 3 znaky").max(90, "Název max 90 znaků"),
    category: z.nativeEnum(JobCategory),
    employmentType: z.nativeEnum(EmploymentType),
    city: z.string().refine((c) => CITIES.includes(c as never), "Vyber město ze seznamu"),
    address: z.string().trim().max(120).optional(),
    salaryMin: z.coerce.number().int().min(0).max(9_999_999).optional().or(z.literal("")),
    salaryMax: z.coerce.number().int().min(0).max(9_999_999).optional().or(z.literal("")),
    salaryPeriod: z.nativeEnum(SalaryPeriod).optional(),
    description: z.string().trim().min(20, "Popiš pozici aspoň pár větami (min. 20 znaků)").max(10000),
  })
  .refine(
    (data) =>
      !(typeof data.salaryMin === "number" && typeof data.salaryMax === "number") ||
      data.salaryMin <= data.salaryMax,
    { message: "Mzda od nemůže být vyšší než do" }
  );

function parseJobForm(formData: FormData) {
  const raw = Object.fromEntries(formData);
  if (raw.salaryMin === "") delete (raw as Record<string, unknown>).salaryMin;
  if (raw.salaryMax === "") delete (raw as Record<string, unknown>).salaryMax;
  return jobSchema.safeParse(raw);
}

export async function createJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.kind !== "INSTITUTION") return { error: "Inzeráty mohou vystavovat jen podniky." };

  const parsed = parseJobForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const data = parsed.data;
  const hasSalary = typeof data.salaryMin === "number" || typeof data.salaryMax === "number";

  const job = await db.job.create({
    data: {
      institutionId: user.id,
      title: data.title,
      category: data.category,
      employmentType: data.employmentType,
      city: data.city,
      address: data.address || null,
      salaryMin: typeof data.salaryMin === "number" ? data.salaryMin : null,
      salaryMax: typeof data.salaryMax === "number" ? data.salaryMax : null,
      salaryPeriod: hasSalary ? (data.salaryPeriod ?? "MESIC") : null,
      description: data.description,
    },
    select: { id: true },
  });

  revalidatePath("/jobs");
  redirect(`/jobs/${job.id}`);
}

export async function updateJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");
  const job = await db.job.findUnique({ where: { id: jobId }, select: { institutionId: true } });
  if (!job || job.institutionId !== user.id) return { error: "Inzerát nenalezen." };

  const parsed = parseJobForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const data = parsed.data;
  const hasSalary = typeof data.salaryMin === "number" || typeof data.salaryMax === "number";
  const status = formData.get("status") === "CLOSED" ? "CLOSED" : "OPEN";

  await db.job.update({
    where: { id: jobId },
    data: {
      title: data.title,
      category: data.category,
      employmentType: data.employmentType,
      city: data.city,
      address: data.address || null,
      salaryMin: typeof data.salaryMin === "number" ? data.salaryMin : null,
      salaryMax: typeof data.salaryMax === "number" ? data.salaryMax : null,
      salaryPeriod: hasSalary ? (data.salaryPeriod ?? "MESIC") : null,
      description: data.description,
      status,
    },
  });

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}`);
}

export async function toggleJobStatusAction(jobId: string): Promise<void> {
  const user = await requireUser();
  const job = await db.job.findUnique({ where: { id: jobId }, select: { institutionId: true, status: true } });
  if (!job || job.institutionId !== user.id) return;
  await db.job.update({
    where: { id: jobId },
    data: { status: job.status === "OPEN" ? "CLOSED" : "OPEN" },
  });
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
}

const applySchema = z.object({
  jobId: z.string().min(1),
  message: z.string().trim().max(2000, "Zpráva max 2000 znaků").optional(),
});

export async function applyToJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.kind !== "PERSON") return { error: "Hlásit se mohou jen osobní profily." };

  const parsed = applySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };

  const job = await db.job.findUnique({
    where: { id: parsed.data.jobId },
    select: { id: true, title: true, status: true, institutionId: true, institution: { select: { email: true } } },
  });
  if (!job) return { error: "Inzerát nenalezen." };
  if (job.status !== "OPEN") return { error: "Pozice už je obsazená." };

  try {
    const application = await db.application.create({
      data: { jobId: job.id, applicantId: user.id, message: parsed.data.message || null },
      select: { id: true },
    });
    await notify({
      userId: job.institutionId,
      actorId: user.id,
      type: "APPLICATION",
      jobId: job.id,
      applicationId: application.id,
    });
    await sendMail({
      to: job.institution.email,
      subject: `Cookus — nová přihláška: ${job.title}`,
      text: `${user.name} se hlásí na pozici „${job.title}“.\n\nProfil a přihlášku najdete tady: ${appUrl(`/jobs/${job.id}/applicants`)}\n\nCookus`,
    });
  } catch {
    return { error: "Na tuhle pozici už ses přihlásil/a." };
  }

  revalidatePath(`/jobs/${job.id}`);
  revalidatePath("/applications");
  return { ok: "Přihláška odeslána! Podnik uvidí tvůj profil a ozve se ti." };
}

export async function setApplicationStatusAction(applicationId: string, status: ApplicationStatus): Promise<void> {
  const user = await requireUser();
  if (!Object.values(ApplicationStatus).includes(status)) return;

  const application = await db.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      applicantId: true,
      status: true,
      job: { select: { id: true, institutionId: true } },
    },
  });
  if (!application || application.job.institutionId !== user.id) return;
  if (application.status === status) return;

  await db.application.update({ where: { id: applicationId }, data: { status } });

  if (status === "SHORTLISTED" || status === "HIRED" || status === "REJECTED") {
    await notify({
      userId: application.applicantId,
      actorId: user.id,
      type: "APPLICATION_STATUS",
      jobId: application.job.id,
      applicationId,
    });
  }

  revalidatePath(`/jobs/${application.job.id}/applicants`);
  revalidatePath("/applications");
}
