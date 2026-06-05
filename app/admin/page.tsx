import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminDashboardClient from "@/components/AdminDashboardClient";

export const metadata = {
  title: "Admin Dashboard — IDmission FluentVerify",
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== "admin") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    include: {
      assessments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return <AdminDashboardClient users={users} />;
}
