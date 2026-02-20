import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserPlanFromDB } from "@/lib/plans-server";
import { PLANS, PlanType } from "@/lib/plans";

type PremiumGateProps = {
  children: React.ReactNode;
  requiredPlans?: PlanType[];
};

// Server component that gates access to premium features
export default async function PremiumGate({
  children,
  requiredPlans = ["pro", "friend"],
}: PremiumGateProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const userPlan = await getUserPlanFromDB(session.user.id);

  // Check if user's plan is in the required plans
  if (!requiredPlans.includes(userPlan)) {
    redirect("/dashboard?upgrade=true");
  }

  return <>{children}</>;
}
