import { NextResponse } from "next/server";
import { sendAccessEmail } from "@/lib/email/send-access-email";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "E-mail obrigatório." },
        { status: 400 }
      );
    }

    const result = await sendAccessEmail({
      email,
      customerName: "Cliente Teste",
      productNames: ["Produto de Teste"],
    });

    return NextResponse.json({
      success: true,
      emailId: result.emailId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido.",
      },
      { status: 500 }
    );
  }
}