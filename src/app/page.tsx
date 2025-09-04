"use client";

export default function Home() {
  return (
    <main className="w-full min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#e0e7ff] via-[#f0f4ff] to-[#e9d5ff]">
      <section className="max-w-xl w-full bg-white/95 p-10 rounded-3xl shadow-2xl border border-indigo-200 text-center">
        <h1 className="text-4xl font-extrabold mb-6 text-indigo-800 tracking-tight drop-shadow">
          AlgoMintAI on Algorand
        </h1>
        <p className="mb-8 text-lg text-gray-800">
          AlgoMintAI is an AI-powered NFT collection generator built on the Algorand
          blockchain. It enables artists, creators, and brands to generate unique,
          high-quality NFT collections with the help of artificial intelligence, and
          mint them seamlessly on Algorand’s fast, eco-friendly, and low-cost network.
        </p>
        <ul className="mb-10 text-left list-disc list-inside text-indigo-700 font-medium">
          <li>
            <span className="font-bold">🎨 AI-Generated Art</span> — Leverage
            advanced generative AI models to create stunning visuals for NFT
            collections.
          </li>
          <li>
            <span className="font-bold">⚡ One-Click Minting</span> — Instantly
            mint your NFTs on Algorand with minimal fees and high scalability.
          </li>
          <li>
            <span className="font-bold">🖼️ Customizable Styles</span> — Choose from
            a variety of artistic styles, themes, and prompts for personalized
            collections.
          </li>
          <li>
            <span className="font-bold">🔗 Blockchain-Powered Ownership</span> —
            Ensure authenticity and provenance with Algorand’s secure smart contracts.
          </li>
        </ul>
        <div className="mt-10 text-xs text-indigo-400 font-mono">
          Built for Algohack Berlin 2025
        </div>
      </section>
    </main>
  );
}