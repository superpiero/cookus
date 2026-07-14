import { CookusMark } from "@/components/ui/Logo";

/** Okamžitá odezva při serverové navigaci — studený start jinak vypadá jako mrtvý klik. */
export default function Loading() {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3">
      <div className="animate-bounce">
        <CookusMark size={48} />
      </div>
      <p className="font-script text-lg text-cherry">načítám…</p>
    </div>
  );
}
