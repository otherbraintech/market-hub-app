import { NextResponse } from "next/server";
import { uploadToObFiles } from "@/lib/ob-files";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Manejar peticiones JSON (base64 directo)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { filename, fileBase64, mimeType } = body;

      if (!filename || !fileBase64 || !mimeType) {
        return NextResponse.json(
          { success: false, error: "Faltan campos requeridos: filename, fileBase64, mimeType" },
          { status: 400 }
        );
      }

      const result = await uploadToObFiles({ filename, fileBase64, mimeType });
      return NextResponse.json(result);
    }

    // 2. Manejar FormData directamente desde inputs tipo <input type="file" />
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No se proporcionó ningún archivo en el FormData" },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const filename = file.name || "archivo_subido";
      const mimeType = file.type || "application/octet-stream";

      const result = await uploadToObFiles({ filename, fileBase64: base64, mimeType });
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: "Tipo de contenido no soportado. Use JSON o FormData" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error en API /api/upload-ob-files:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Error interno al procesar el archivo" },
      { status: 500 }
    );
  }
}
