import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    if (!scriptUrl) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 1. Lire le fichier en buffer
    const buffer = await file.arrayBuffer();
    
    // 2. Générer un nom de fichier unique (GUID/UUID)
    const extension = file.name.split(".").pop() || "jpg";
    const uniqueFileName = `${crypto.randomUUID()}.${extension}`;

    // 3. Convertir en Base64 pour l'Apps Script
    const base64 = Buffer.from(buffer).toString("base64");

    // 4. Envoyer au Google Apps Script
    const response = await fetch(scriptUrl, {
      method: "POST",
      body: JSON.stringify({
        fileName: uniqueFileName,
        mimeType: file.type,
        base64: base64,
      }),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Upload failed in Apps Script");
    }

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
