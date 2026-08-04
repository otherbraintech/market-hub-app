/**
 * OB-FILES Client Utility
 * Integración oficial con el servicio de almacenamiento multimedia OtherBrain (OB-FILES)
 */

const OB_FILES_ENDPOINT = "https://otherbrain-tech-ob-files-oficial.ddt6vc.easypanel.host/api/upload";

export interface ObFileUploadOptions {
  filename: string;
  fileBase64: string; // Base64 puro sin prefijos "data:...;base64,"
  mimeType: string;
  projectToken?: string;
}

export interface ObFileUploadResponse {
  success: boolean;
  id?: string;
  url?: string;
  filename?: string;
  mimeType?: string;
  extension?: string;
  sizeBytes?: number;
  createdAt?: string;
  error?: string;
}

/**
 * Sube un archivo (imagen, audio, video, PDF) al almacenamiento multimedia OB-FILES
 */
export async function uploadToObFiles(options: ObFileUploadOptions): Promise<ObFileUploadResponse> {
  const token = 
    options.projectToken || 
    process.env["OB-FILES"] || 
    process.env.OB_FILES_PROJECT_TOKEN || 
    "sk_77babbbac8086746d69256e3e6d9ef7df5728649a0783ea9";

  // Limpiar prefijos Data URL si vienen incluidos por error ("data:image/png;base64,...")
  let cleanBase64 = options.fileBase64;
  if (cleanBase64.includes(";base64,")) {
    cleanBase64 = cleanBase64.split(";base64,")[1];
  }

  try {
    const response = await fetch(OB_FILES_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        token_project: token,
        filename: options.filename,
        file: cleanBase64,
        mimeType: options.mimeType,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Error HTTP ${response.status}: ${errorText || response.statusText}`,
      };
    }

    const data: ObFileUploadResponse = await response.json();
    return data;
  } catch (err: any) {
    console.error("Error al subir archivo a OB-FILES:", err);
    return {
      success: false,
      error: err?.message || "Error de conexión con el servidor OB-FILES",
    };
  }
}
