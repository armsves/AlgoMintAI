"use client";

import { useState } from "react";
import Image from "next/image";
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { sha512_256 } from 'js-sha512'
import { getAlgodConfigFromViteEnvironment } from '@/utils/network/getAlgoClientConfigs'
import axios from "axios";

export default function MintNFT() {
  const [collectionName, setCollectionName] = useState<string>("MasterPass");
  const [prompt, setPrompt] = useState<string>("A cute orange cat ghibli style");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [metadataUrl, setMetadataUrl] = useState<string>("");
  const [assetId, setAssetId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { transactionSigner, activeAddress } = useWallet();

  const collectionUrl = "https://gateway.pinata.cloud/ipfs/bafkreidw3sdevqw6qs6jzyuoihw7uyr2ue2s6nuy3hqc33xesoh4k3dvfy";

  // These should be set in your .env and exposed as NEXT_PUBLIC_*
  const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT!;

  // Generate image using OpenAI DALL·E and upload to IPFS
  const handleGenerateImage = async () => {
    setLoading(true);
    setImageUrl("");
    setAssetId(""); // Reset asset ID when generating new image
    setMetadataUrl(""); // Reset metadata URL
    try {
      // 1. Generate image with OpenAI DALL·E
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, collectionName }),
      });
      const data = await res.json();
      setImageUrl(data.imageUrl);
    } catch (e) {
      alert("Failed to generate or upload image");
      console.error(e);
    }
    setLoading(false);
  };

  // Mint NFT with generated image
  const handleMintNFT = async () => {
    setLoading(true);
    if (!transactionSigner || !activeAddress) {
      alert("Please connect wallet first");
      setLoading(false);
      return;
    }
    if (!imageUrl) {
      alert("Please generate an image first");
      setLoading(false);
      return;
    }
    try {
      // Extract IPFS hash from image URL for image_integrity
      const imageHash = imageUrl.split('/ipfs/')[1];
      
      // 1. Create metadata JSON in the correct format
      const metadata = {
        name: collectionName,
        description: `This is a ${collectionName} NFT`,
        image: imageUrl,
        decimals: 0,
        unitName: "MP",
        image_integrity: `sha256-${imageHash}`,
        image_mimetype: "image/png",
        properties: {
          Tier: "Gold",
          Person: 2,
        },
        collection: collectionUrl,
      };

      // 2. Upload metadata to Pinata
      const metaBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      const metaForm = new FormData();
      metaForm.append("file", metaBlob, "metadata.json");

      const metaRes = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        metaForm,
        {
          headers: {
            Authorization: `Bearer ${PINATA_JWT}`,
            ...metaForm instanceof window.FormData ? {} : metaForm.getHeaders?.(),
          },
        }
      );
      const metaCid = metaRes.data.IpfsHash;
      const metaUrl = `https://gateway.pinata.cloud/ipfs/${metaCid}`;
      setMetadataUrl(metaUrl);

      // 3. Mint NFT
      const algodConfig = getAlgodConfigFromViteEnvironment();
      const algorand = AlgorandClient.fromConfig({ algodConfig });
      const metadataHash = new Uint8Array(sha512_256.digest(metaUrl));
      const result = await algorand.send.assetCreate({
        sender: activeAddress,
        signer: transactionSigner,
        total: BigInt(1),
        decimals: 0,
        assetName: `${collectionName} NFT`,
        unitName: "MP",
        url: metaUrl,
        metadataHash,
        defaultFrozen: false,
      });
      setAssetId(result.assetId.toString());
      alert(`✅ NFT Minted! ASA ID: ${result.assetId}`);
    } catch (e) {
      alert("Failed to mint NFT");
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <main className="w-full min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#e0e7ff] via-[#f0f4ff] to-[#e9d5ff]">
      <section className="mb-8 w-full max-w-md bg-white/95 p-10 rounded-3xl shadow-2xl border border-indigo-200">
        <h2 className="font-extrabold text-3xl mb-8 text-indigo-800 tracking-tight drop-shadow">
          Mint NFT in Collection
        </h2>
        <input
          className="mb-4 w-full border border-indigo-300 rounded-xl px-4 py-3 text-lg text-gray-800 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition placeholder:text-indigo-400"
          type="text"
          placeholder="Collection Name"
          value={collectionName}
          onChange={e => setCollectionName(e.target.value)}
          disabled={loading}
        />
        <input
          className="mb-4 w-full border border-indigo-300 rounded-xl px-4 py-3 text-lg text-gray-800 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition placeholder:text-indigo-400"
          type="text"
          placeholder="Prompt for image generation"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={loading}
        />
        <button
          type="button"
          disabled={loading}
          onClick={handleGenerateImage}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-lg shadow mb-6 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Generating..." : "Generate Image"}
        </button>
        {imageUrl && (
          <div className="mb-6 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Generated NFT"
              className="rounded-xl shadow-lg border border-indigo-100 max-h-64"
              style={{ objectFit: "contain" }}
            />
          </div>
        )}
        <button
          type="button"
          disabled={loading || !imageUrl}
          onClick={handleMintNFT}
          className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-3 px-4 rounded-xl text-lg shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Minting..." : "Mint NFT"}
        </button>
        {metadataUrl && (
          <div className="mt-4 text-center">
            <a
              href={metadataUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-800 underline break-all font-mono text-sm"
            >
              View metadata JSON: {metadataUrl}
            </a>
          </div>
        )}
        {assetId && (
          <div className="mt-4 text-center">
            <a
              href={`https://explorer.perawallet.app/asset/${assetId}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition"
            >
              🔍 View on Pera Explorer
            </a>
            <p className="text-gray-600 text-sm mt-2">
              Asset ID: {assetId}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}