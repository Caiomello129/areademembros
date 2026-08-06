import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "./product-form";

export default async function NewProductPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <AdminShell
      title="Novo produto"
      description="Cadastre um produto na área de membros e na loja."
    >
      <ProductForm />
    </AdminShell>
  );
}