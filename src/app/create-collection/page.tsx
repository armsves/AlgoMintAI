"use client";

import { useState } from "react";
import { pinata } from "@/utils/config";
import { useWallet } from '@txnlab/use-wallet-react'

export default function CreateCollection() {
  const [collectionName, setCollectionName] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [collectionIpfs, setCollectionIpfs] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { activeAddress } = useWallet();

  // Helper to upload a file to IPFS via Pinata and return the CID
  const uploadToIPFS = async (file: File) => {
    const urlRequest = await fetch("/api/url");
    const urlResponse = await urlRequest.json();
    const upload = await pinata.upload.public.file(file).url(urlResponse.url);
    return upload?.cid ? `ipfs://${upload.cid}` : null;
  };

  const handleCreateCollection = async () => {
    if (!collectionName) {
      alert("Collection name required");
      return;
    }
    if (!activeAddress) {
      alert("Connect your wallet to set as creator");
      return;
    }
    setCreating(true);
    try {
      let bannerUrl = "";
      let avatarUrl = "";
      if (bannerFile) bannerUrl = (await uploadToIPFS(bannerFile)) ?? "";
      if (avatarFile) avatarUrl = (await uploadToIPFS(avatarFile)) ?? "";

      const collectionJson = {
        collections: [
          {
            name: collectionName,
            network: "algorand",
            banner_image: bannerUrl,
            avatar_image: avatarUrl,
            explicit: false,
            royalty_percentage: 0,
            creator: activeAddress, // Add creator address
          }
        ]
      };

      const metaBlob = new Blob([JSON.stringify(collectionJson)], { type: "application/json" });
      const metaFile = new File([metaBlob], "collection.json", { type: "application/json" });
      const cid = await uploadToIPFS(metaFile);
      setCollectionIpfs(cid);
      alert(`Collection uploaded! IPFS: ${cid}`);
    } catch (e) {
      alert("Failed to create collection");
      console.error(e);
    }
    setCreating(false);
  };

  return (
    <main className="w-full min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#e0e7ff] via-[#f0f4ff] to-[#e9d5ff]">
      <section className="mb-8 w-full max-w-md bg-white/95 p-10 rounded-3xl shadow-2xl border border-indigo-200">
        <h2 className="font-extrabold text-3xl mb-8 text-indigo-800 tracking-tight drop-shadow">Create NFT Collection (ARC-53)</h2>
        <input
          className="mb-5 w-full border border-indigo-300 rounded-xl px-4 py-3 text-lg text-gray-800 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition placeholder:text-indigo-400"
          type="text"
          placeholder="Collection Name"
          value={collectionName}
          onChange={e => setCollectionName(e.target.value)}
        />
        <div className="flex gap-4 mb-6">
          <label className="flex-1 flex flex-col items-start">
            <span className="text-xs text-indigo-700 mb-2 font-semibold">Banner Image</span>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
              onChange={e => setBannerFile(e.target.files?.[0] || null)}
            />
          </label>
          <label className="flex-1 flex flex-col items-start">
            <span className="text-xs text-indigo-700 mb-2 font-semibold">Avatar Image</span>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
              onChange={e => setAvatarFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
        <button
          className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-3 px-4 rounded-xl text-lg shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={creating || !collectionName}
          onClick={handleCreateCollection}
        >
          {creating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              Uploading...
            </span>
          ) : (
            "Create Collection"
          )}
        </button>
        {collectionIpfs && (
          <div className="mt-8 text-center">
            <a
              href={`https://gateway.pinata.cloud/ipfs/${collectionIpfs.replace("ipfs://", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-800 underline break-all font-mono text-sm"
            >
              View Collection Metadata: {collectionIpfs}
            </a>
          </div>
        )}
      </section>
    </main>
  );
}