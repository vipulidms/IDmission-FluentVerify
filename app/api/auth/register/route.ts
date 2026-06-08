import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, mobileNumber, email, password, targetCefrLevel, assessmentLanguage } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const computedName = [firstName, lastName].filter(Boolean).join(" ");

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "admin" : "user";

    const user = await prisma.user.create({
      data: { 
        name: computedName, 
        firstName, 
        lastName, 
        mobileNumber, 
        email, 
        password: hashedPassword, 
        role, 
        targetCefrLevel: targetCefrLevel || null,
        assessmentLanguage: assessmentLanguage || "english"
      },
    });

    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
