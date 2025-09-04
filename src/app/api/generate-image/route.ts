export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

// Helper to parse multipart form data (for file uploads)
async function parseMultipartForm(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) return null;

  // Use the web API to parse form data
  const formData = await req.formData();
  const file = formData.get("file");
  if (file && typeof file === "object" && "arrayBuffer" in file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return { file, buffer, filename: file.name, contentType: file.type };
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // --- Handle file upload to IPFS ---
    const multipart = await parseMultipartForm(req);
    if (multipart) {
      const pinataJWT = process.env.PINATA_JWT;
      if (!pinataJWT) {
        return NextResponse.json({ error: "Missing Pinata JWT" }, { status: 500 });
      }
      
      // Use Web API FormData for file uploads
      const imageForm = new FormData();
      const blob = new Blob([multipart.buffer], { type: multipart.contentType || "application/octet-stream" });
      imageForm.append("file", blob, multipart.filename || "upload");

      const imagePinRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJWT}`,
        },
        body: imageForm,
      });

      if (!imagePinRes.ok) {
        const error = await imagePinRes.text();
        return NextResponse.json({ error: "Failed to upload file to IPFS: " + error }, { status: 500 });
      }

      const imagePinData = await imagePinRes.json();
      const imageIpfsHash = imagePinData.IpfsHash;
      // Use default Pinata gateway
      const imageGatewayUrl = `https://gateway.pinata.cloud/ipfs/${imageIpfsHash}`;
      return NextResponse.json({ ipfsHash: imageIpfsHash, gatewayUrl: imageGatewayUrl });
    }

    // --- Existing DALL·E logic ---
    console.log("STEP 1: Parsing request body");
    const { prompt, collectionName = "CuteCats", description = "" } = await req.json();

    console.log("STEP 2: Checking API keys");
    const apiKey = process.env.OPENAI_API_KEY;
    const pinataJWT = process.env.PINATA_JWT;

    if (!apiKey) {
      console.error("ERROR: Missing OpenAI API key");
      return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 500 });
    }
    if (!pinataJWT) {
      console.error("ERROR: Missing Pinata JWT");
      return NextResponse.json({ error: "Missing Pinata JWT" }, { status: 500 });
    }

    // 1. Generate image with DALL·E
    console.log("STEP 3: Requesting image from OpenAI DALL·E");
    const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    if (!dalleRes.ok) {
      let error;
      try { error = await dalleRes.json(); } catch { error = await dalleRes.text(); }
      console.error("ERROR: OpenAI DALL·E response not ok", error);
      return NextResponse.json({ error }, { status: dalleRes.status });
    }

    console.log("STEP 4: Parsing OpenAI response");
    const dalleData = await dalleRes.json();
    const imageUrl = dalleData.data?.[0]?.url;
    if (!imageUrl) {
      console.error("ERROR: No image URL returned from OpenAI");
      return NextResponse.json({ error: "No image URL returned" }, { status: 500 });
    }
    console.log("STEP 4.1: Got image URL from OpenAI:", imageUrl);

    // 2. Download the image as a buffer (no CORS issue on server)
    console.log("STEP 5: Downloading image from OpenAI URL");
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      console.error("ERROR: Failed to download generated image", await imageRes.text());
      return NextResponse.json({ error: "Failed to download generated image" }, { status: 500 });
    }
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    console.log("STEP 5.1: Downloaded image buffer, size:", imageBuffer.length);

    // 3. Upload image to Pinata using Web API FormData
    console.log("STEP 6: Uploading image to Pinata");
    const imageForm = new FormData();
    const blob = new Blob([imageBuffer], { type: "image/png" });
    imageForm.append("file", blob, "nft-image.png");

    const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJWT}`,
      },
      body: imageForm,
    });

    if (!pinataRes.ok) {
      const error = await pinataRes.text();
      console.error("ERROR: Failed to upload image to IPFS", error);
      return NextResponse.json({ error: "Failed to upload image to IPFS: " + error }, { status: 500 });
    }

    console.log("STEP 7: Parsing Pinata response");
    const imagePinData = await pinataRes.json();
    const imageIpfsHash = imagePinData.IpfsHash;
    // Use default Pinata gateway
    const imageGatewayUrl = `https://gateway.pinata.cloud/ipfs/${imageIpfsHash}`;
    console.log("STEP 7.1: Uploaded to IPFS, hash:", imageIpfsHash);

    return NextResponse.json({ imageUrl: imageGatewayUrl });
  } catch (e) {
    console.error("FATAL ERROR:", e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : String(e) || "Unknown error" 
    }, { status: 500 });
  }
}