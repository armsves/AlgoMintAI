"use client";
import { useEffect, useState, useRef } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { FiCopy } from "react-icons/fi";
import Image from "next/image";
import ConnectWallet from "../components/ConnectWallet";

export default function Navbar() {
  const [openModal, setOpenModal] = useState(false);
  const { activeAddress } = useWallet();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Prevent hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

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
        <Image src="/file.svg" alt="Logo" width={40} height={40} className="mr-2" />
        <span className="font-bold text-xl tracking-wide text-indigo-700 hidden sm:inline">InstaNFT</span>
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
        {/* Dropdown/modal below the button */}
        {openModal && (
          <div className="absolute right-0 mt-2 z-50">
            <ConnectWallet openModal={openModal} closeModal={() => setOpenModal(false)} />
          </div>
        )}
      </div>
    </nav>
  );
}
