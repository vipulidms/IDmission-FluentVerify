import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";

export const metadata = {
  title: "Dashboard — IDmission FluentVerify",
  description: "View your assessment history, progress, and CEFR scores.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  const userId = (session.user as { id?: string }).id;

  const assessments = userId
    ? await prisma.assessment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return <DashboardClient session={session} assessments={assessments} />;
}
