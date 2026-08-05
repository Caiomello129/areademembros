import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const admin = createAdminClient();

    const { data, error } =
      await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo:
            "http://localhost:3000/definir-senha",
        },
      });

    if (error || !data?.properties?.action_link) {
      return NextResponse.json(
        {
          error: "Não foi possível gerar o link.",
          details: error?.message,
        },
        { status: 500 }
      );
    }

    /*
     * Somente para desenvolvimento.
     * Depois enviaremos esse link por e-mail.
     */
    return NextResponse.json({
      success: true,
      actionLink: data.properties.action_link,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}