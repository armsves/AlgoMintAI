"use client";

import { useState } from "react";
import Image from "next/image";
import { pinata } from "@/utils/config";
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { sha512_256 } from 'js-sha512'
import { getAlgodConfigFromViteEnvironment } from '@/utils/network/getAlgoClientConfigs'

export default function MintNFT() {
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cid, setCid] = useState<string | null>(null);
  const [metaCid, setMetaCid] = useState<string | null>(null);
  const [collectionUrl, setCollectionUrl] = useState<string>("");

  const { transactionSigner, activeAddress } = useWallet();

  const uploadFile = async () => {
    if (!file) {
      alert("No file selected");
      return;
    }
    if (!collectionUrl) {
      alert("Please provide your collection metadata IPFS URL");
      return;
    }

    try {
      setUploading(true);
      setCid(null);
      setMetaCid(null);
      const urlRequest = await fetch("/api/url");
      const urlResponse = await urlRequest.json();
      const upload = await pinata.upload.public
        .file(file)
        .url(urlResponse.url);
      if (upload && upload.cid) {
        setCid(upload.cid);
        const imageUrl = `https://gateway.pinata.cloud/ipfs/${upload.cid}`;
        // Add collection reference in metadata
        const metadata = {
          name: "MasterPass",
          description: "This is a MasterPass NFT",
          image: imageUrl,
          decimals: 0,
          unitName: "MP",
          image_integrity: `sha256-${upload.cid}`,
          image_mimetype: file?.type || "image/png",
          properties: {
            Tier: "Gold",
            Person: 2
          },
          collection: collectionUrl
        };
        const metaUrlRequest = await fetch("/api/url");
        const metaUrlResponse = await metaUrlRequest.json();
        const metaBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
        const metaFile = new File([metaBlob], "metadata.json", { type: "application/json" });
        const metaUpload = await pinata.upload.public
          .file(metaFile)
          .url(metaUrlResponse.url);
        if (metaUpload && metaUpload.cid) {
          setMetaCid(metaUpload.cid);
          const metaUrl = `https://gateway.pinata.cloud/ipfs/${metaUpload.cid}`;
          await mintNFT(metaUrl);
        }
      }
      setUploading(false);
    } catch (e) {
      console.log(e);
      setUploading(false);
      alert("Trouble uploading file");
    }
  };

  const mintNFT = async (metadataUrl: string) => {
    if (!transactionSigner || !activeAddress) {
      alert('Please connect wallet first');
      return;
    }
    try {
      // Fetch collection metadata to get creator address
      let managerAddress: string | undefined = undefined;
      if (collectionUrl) {
        // Convert ipfs:// to https:// if needed
        const colMetaUrl = collectionUrl.startsWith("ipfs://")
          ? `https://gateway.pinata.cloud/ipfs/${collectionUrl.replace("ipfs://", "")}`
          : collectionUrl;
        try {
          const res = await fetch(colMetaUrl);
          if (res.ok) {
            const json = await res.json();
            // Get the creator from the first collection object
            const collection = json.collections?.[0];
            if (collection && collection.creator) {
              managerAddress = collection.creator;
            } else {
              alert("Collection metadata does not contain a creator address.");
              return;
            }
          } else {
            alert("Failed to fetch collection metadata.");
            return;
          }
        } catch (e) {
          console.warn("Could not fetch collection metadata", e);
          alert("Could not fetch collection metadata.");
          return;
        }
      }

      const algodConfig = getAlgodConfigFromViteEnvironment();
      const algorand = AlgorandClient.fromConfig({ algodConfig });
      const metadataHash = new Uint8Array(sha512_256.digest(metadataUrl));
      const result = await algorand.send.assetCreate({
        sender: activeAddress,
        signer: transactionSigner,
        total: BigInt(1),
        decimals: 0,
        assetName: 'MasterPass Ticket',
        unitName: 'MP',
        url: metadataUrl,
        metadataHash,
        defaultFrozen: false,
        manager: managerAddress, // Set manager to collection creator
      });
      alert(`✅ NFT Minted! ASA ID: ${result.assetId}`);
    } catch (e) {
      alert('Failed to mint NFT');
      console.log(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target?.files?.[0];
    setFile(selectedFile);
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  return (
    <main className="w-full min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#e0e7ff] via-[#f0f4ff] to-[#e9d5ff]">
      <section className="mb-8 w-full max-w-md bg-white/95 p-10 rounded-3xl shadow-2xl border border-indigo-200">
        <h2 className="font-extrabold text-3xl mb-8 text-indigo-800 tracking-tight drop-shadow">Mint NFT in Collection</h2>
        <input
          className="mb-5 w-full border border-indigo-300 rounded-xl px-4 py-3 text-lg text-gray-800 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition placeholder:text-indigo-400"
          type="text"
          placeholder="Collection Metadata IPFS URL (e.g. ipfs://...)"
          value={collectionUrl}
          onChange={e => setCollectionUrl(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          className="mb-5 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
          onChange={handleChange}
        />
        {preview && (
          <div className="mt-4 flex justify-center">
            <Image
              src={preview}
              alt="Selected preview"
              width={320}
              height={256}
              className="rounded-xl shadow-lg border border-indigo-100"
              style={{ objectFit: "contain" }}
            />
          </div>
        )}
        <button
          type="button"
          disabled={uploading}
          onClick={uploadFile}
          className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-3 px-4 rounded-xl text-lg shadow mt-6 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              Uploading...
            </span>
          ) : (
            "Upload & Mint"
          )}
        </button>
        {cid && (
          <div className="mt-6 text-center">
            <a
              href={`https://gateway.pinata.cloud/ipfs/${cid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-800 underline break-all font-mono text-sm"
            >
              View uploaded image: https://gateway.pinata.cloud/ipfs/{cid}
            </a>
          </div>
        )}
        {metaCid && (
          <div className="mt-2 text-center">
            <a
              href={`https://gateway.pinata.cloud/ipfs/${metaCid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-800 underline break-all font-mono text-sm"
            >
              View metadata JSON: https://gateway.pinata.cloud/ipfs/{metaCid}
            </a>
          </div>
        )}
      </section>
    </main>
  );
}