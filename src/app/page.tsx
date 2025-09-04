"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="w-full min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#e0e7ff] via-[#f0f4ff] to-[#e9d5ff]">
      <section className="max-w-xl w-full bg-white/95 p-10 rounded-3xl shadow-2xl border border-indigo-200 text-center">
        <h1 className="text-4xl font-extrabold mb-6 text-indigo-800 tracking-tight drop-shadow">
          InstaNFT on Algorand
        </h1>
        <p className="mb-8 text-lg text-gray-800">
          InstaNFT lets you create ARC-53 NFT collections and mint NFTs into them
          on the Algorand blockchain.
        </p>
        <ul className="mb-10 text-left list-disc list-inside text-indigo-700 font-medium">
          <li>Create a collection with rich metadata (ARC-53 standard)</li>
          <li>Upload collection metadata to IPFS</li>
          <li>Mint NFTs that reference your collection</li>
        </ul>
        <div className="flex flex-col gap-4 items-center">
          <Link
            href="/create-collection"
            className="w-64 py-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-lg shadow transition"
          >
            Create Collection
          </Link>
          <Link
            href="/mint"
            className="w-64 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-lg shadow transition"
          >
            Mint NFT in Collection
          </Link>
          <Link
            href="/my-nfts"
            className="w-64 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow transition"
          >
            My Minted NFTs
          </Link>
        </div>
        <div className="mt-10 text-xs text-indigo-400 font-mono">
          Built for Algohack Berlin 2025
        </div>
      </section>
    </main>
  );
}