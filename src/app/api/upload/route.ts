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
      return NextResponse.json({ error: "Server configuration error: APPS_SCRIPT_URL missing" }, { status: 500 });
    }

    // 1. Lire les données
    const guestName = formData.get("guestName") as string || "";
    const buffer = await file.arrayBuffer();
    
    // 2. Générer un nom de fichier unique (Name_GUID.ext)
    const extension = file.name.split(".").pop() || "jpg";
    const guid = crypto.randomUUID();
    const safeName = guestName.replace(/[^a-z0-9]/gi, "_").substring(0, 50);
    const uniqueFileName = `${safeName ? safeName + "_" : ""}${guid}.${extension}`;

    // 3. Convertir en Base64 pour l'Apps Script
    const base64 = Buffer.from(buffer).toString("base64");

    console.log(`Sending to Apps Script: ${uniqueFileName} (${(base64.length / 1024 / 1024).toFixed(2)} MB base64)`);

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
      // Using no-cors is not needed for server-side fetch, but we need to handle redirects properly
      // Node.js fetch handles redirects automatically.
    });

    // Handle non-200 responses from Google (e.g., Apps Script errors usually return HTML)
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`Apps Script returned HTTP ${response.status}:`, responseText.substring(0, 500));
      throw new Error(`Apps Script failed with status ${response.status}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Apps Script response as JSON. Response was:", responseText.substring(0, 500));
      throw new Error("Apps Script returned an invalid response (not JSON). Check your Apps Script deployment.");
    }

    if (!result.success) {
      throw new Error(result.error || "Upload failed inside Apps Script logic");
    }

    console.log(`Successfully uploaded via Apps Script: fileId=${result.fileId}`);

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
    });

  } catch (error) {
    console.error("Upload error details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
