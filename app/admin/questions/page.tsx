import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminQuestionsClient from "./AdminQuestionsClient";

export default async function AdminQuestionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== "admin") {
    redirect("/dashboard");
  }

  const questionSets = await prisma.speakingQuestionSet.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <AdminQuestionsClient questionSets={questionSets} />;
}
