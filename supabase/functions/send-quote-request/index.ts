import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CRM_URL = "https://ggmvlmokvlvqjtmrgayy.supabase.co";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CRM_KEY = Deno.env.get("CRM_SUPABASE_SERVICE_ROLE_KEY");
    if (!CRM_KEY) {
      throw new Error("CRM_SUPABASE_SERVICE_ROLE_KEY is not configured");
    }

    const body = await req.json();
    const {
      client_name,
      client_email,
      client_phone,
      message,
      products,
      company,
    } = body;

    // Validate required fields
    if (!client_name || typeof client_name !== "string" || client_name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Nome é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!client_email || typeof client_email !== "string" || !client_email.includes("@")) {
      return new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(JSON.stringify({ error: "Pelo menos um produto é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const crm = createClient(CRM_URL, CRM_KEY);

    // Build notes with product details and message
    const productLines = products.map((p: any) =>
      `• ${p.name} (${p.internal_id}) — ${p.type}${p.dimensoes ? ` — ${p.dimensoes}` : ""}`
    ).join("\n");

    const notes = [
      `--- Pedido de Cotação via Loja Online (${company || "Multimarmore"}) ---`,
      "",
      `Produtos:`,
      productLines,
      "",
      message ? `Mensagem do cliente:\n${message}` : "",
      "",
      `Data: ${new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}`,
    ].filter(Boolean).join("\n");

    // Insert lead into CRM
    const { data, error } = await crm.from("leads").insert({
      contact_name: client_name.trim(),
      email: client_email.trim(),
      phone: client_phone?.trim() || null,
      source: "loja_online",
      notes,
      is_active: true,
    }).select("id").single();

    if (error) {
      console.error("CRM insert error:", error);
      throw new Error(`Erro ao criar lead no CRM: ${error.message}`);
    }

    // Create an opportunity linked to the lead
    const oppTitle = products.length === 1
      ? `Cotação: ${products[0].name} (${products[0].internal_id})`
      : `Cotação: ${products.length} produtos`;

    const oppDescription = [
      `Pedido de cotação via loja online ${company || "Multimarmore"}`,
      "",
      `Cliente: ${client_name.trim()}`,
      `Email: ${client_email.trim()}`,
      client_phone ? `Telefone: ${client_phone.trim()}` : null,
      "",
      `Produtos:`,
      productLines,
      "",
      message ? `Mensagem:\n${message}` : null,
    ].filter(Boolean).join("\n");

    await crm.from("opportunities").insert({
      lead_id: data.id,
      title: oppTitle,
      description: oppDescription,
      stage: "lead",
      origin: "website",
      priority: "medium",
    });

    return new Response(
      JSON.stringify({ success: true, lead_id: data.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Quote request error:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
