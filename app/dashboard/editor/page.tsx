import Editor from "@/components/Editor";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserPlanFromDB } from "@/lib/plans-server";

export default async function DashboardEditorPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const plan = session ? await getUserPlanFromDB(session.user.id) : "free";
  const isPremium = plan !== "free";

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Editor isPremium={isPremium} />
    </div>
  );
}
