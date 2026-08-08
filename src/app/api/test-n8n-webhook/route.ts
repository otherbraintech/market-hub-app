import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetUrl = body.webhookUrl || "https://n8n-n8n-start.ddt6vc.easypanel.host/webhook/scrap-negocio";
    
    const payload = {
      reportId: body.reportId || `test_${Date.now()}`,
      type: body.type || "MY_BUSINESS",
      channel: body.channel || "WEBSITE",
      url: body.url || "https://www.polocruz.com/",
      businessId: body.businessId || "test_biz_123",
      competitorName: body.competitorName || "",
      businessName: body.businessName || "Negocio de Prueba",
      callbackUrl: body.callbackUrl || `${process.env.APP_URL || "http://localhost:3000"}/api/webhook/callback`,
    };

    console.log("--------------------------------------------------");
    console.log("⚡ [TEST-N8N] DISPARANDO PRUEBA DE WEBHOOK N8N VIA POST");
    console.log("📍 WEBHOOK TARGET URL:", targetUrl);
    console.log("📦 PAYLOAD ENVIADO:", JSON.stringify(payload, null, 2));
    console.log("--------------------------------------------------");

    const startTime = Date.now();
    let status = 0;
    let statusText = "";
    let resHeaders: Record<string, string> = {};
    let rawText = "";
    let jsonResponse: any = null;
    let errorMsg = null;

    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      status = res.status;
      statusText = res.statusText;
      res.headers.forEach((val, key) => {
        resHeaders[key] = val;
      });

      rawText = await res.text();
      try {
        jsonResponse = JSON.parse(rawText);
      } catch (e) {
        jsonResponse = null;
      }
    } catch (fetchErr: any) {
      errorMsg = fetchErr.message;
      console.error("❌ [TEST-N8N] ERROR AL CONECTAR CON N8N:", fetchErr);
    }

    const durationMs = Date.now() - startTime;

    console.log("--------------------------------------------------");
    console.log(`📥 [TEST-N8N] RESPUESTA RECIBIDA DE N8N (${durationMs}ms)`);
    console.log(`STATUS HTTP: ${status} ${statusText}`);
    console.log("BODY RECIBIDO:", rawText);
    console.log("--------------------------------------------------");

    return NextResponse.json({
      success: status >= 200 && status < 300,
      sent: {
        targetUrl,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        payload,
      },
      received: {
        status,
        statusText,
        durationMs,
        headers: resHeaders,
        rawText,
        jsonResponse,
        error: errorMsg,
      },
    });
  } catch (err: any) {
    console.error("CRITICAL ERROR IN TEST N8N ROUTE:", err);
    return NextResponse.json(
      { error: "Error en el test runner de n8n", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
