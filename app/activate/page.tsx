import type { Metadata } from "next";
import { ActivateForm } from "./activate-form";

export const metadata: Metadata = {
  title: "Activar cuenta · OpenDayCare",
};

export default async function ActivateAccountPage({
  searchParams,
}: PageProps<"/activate">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-auth-bg px-10 py-10">
      <ActivateForm prefilledEmail={email} />
    </div>
  );
}
