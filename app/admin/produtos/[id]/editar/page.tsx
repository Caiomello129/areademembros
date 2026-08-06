import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";
import { EditProductForm } from "./edit-product-form";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
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

  const { data: product } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      description,
      thumbnail_url,
      ggcheckout_product_id,
      status,
      position,
      store_enabled,
      store_price_cents,
      store_compare_price_cents,
      store_badge,
      store_button_text,
      store_link_type,
      store_url
    `)
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    notFound();
  }

  return (
    <AdminShell
      title="Editar produto"
      description="Atualize as informações da área de membros e da loja."
    >
      <EditProductForm product={product} />
    </AdminShell>
  );
}