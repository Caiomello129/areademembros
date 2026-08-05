"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(
    formData.get("confirmPassword") ?? ""
  );

  if (password.length < 8) {
    redirect(
      "/definir-senha?error=A senha precisa ter pelo menos 8 caracteres"
    );
  }

  if (password !== confirmPassword) {
    redirect("/definir-senha?error=As senhas não coincidem");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?error=O link expirou ou não é mais válido"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(
      `/definir-senha?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/dashboard");
}