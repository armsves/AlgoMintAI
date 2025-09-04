"use client";
import { useEffect, useState, useRef } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { FiCopy } from "react-icons/fi";
import Image from "next/image";
import ConnectWallet from "../components/ConnectWallet";
import Link from "next/link";

export default function Navbar() {
  const [openModal, setOpenModal] = useState(false);
  const { activeAddress } = useWallet();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

  // Close modal on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        openModal &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpenModal(false);
      }
    }
    if (openModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openModal]);

  // Copy address to clipboard
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeAddress) {
      await navigator.clipboard.writeText(activeAddress);
    }
  };

  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 bg-gradient-to-r from-indigo-100 via-blue-100 to-violet-100 border-b border-indigo-200 shadow-md relative z-20">
      {/* Logo on the left */}
      <div className="flex items-center">
        <Link href="/" passHref>
          <div className="flex items-center cursor-pointer">
            <Image src="/AlgoMintAI.png" alt="Logo" width={40} height={40} className="mr-2" />
            <span className="font-bold text-xl tracking-wide text-indigo-700 hidden sm:inline">AlgoMintAI</span>
          </div>
        </Link>
      </div>
      {/* Navigation links in the center */}
      <div className="flex-1 flex justify-center items-center gap-6">
        {/* Navigation links in the center */}
        <Link
          href="/create-collection"
          className="text-indigo-700 hover:text-indigo-900 font-semibold text-lg transition"
        >
          Create Collection
        </Link>
        <Link
          href="/mint"
          className="text-violet-700 hover:text-violet-900 font-semibold text-lg transition"
        >
          Mint NFT
        </Link>
        <Link
          href="/my-nfts"
          className="text-blue-700 hover:text-blue-900 font-semibold text-lg transition"
        >
          My NFTs
        </Link>
      </div>
      {/* Connect Wallet button on the right */}
      <div className="flex items-center relative">
        <button
          ref={buttonRef}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
          onClick={() => setOpenModal((v) => !v)}
        >
          {hasMounted && activeAddress ? (
            <>
              <span className="font-mono truncate max-w-[120px]">{activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}</span>
              <FiCopy
                className="cursor-pointer hover:text-indigo-300 transition"
                onClick={handleCopy}
                title="Copy address"
              />
            </>
          ) : (
            "Connect Wallet"
          )}
        </button>
        {/* Modal with backdrop */}
        {openModal && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray bg-opacity-10 z-40" />
            {/* Modal */}
            <div
              ref={modalRef}
              className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-lg p-0 min-w-[280px] border border-indigo-100"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
            >
              <ConnectWallet openModal={openModal} closeModal={() => setOpenModal(false)} hideClose />
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
