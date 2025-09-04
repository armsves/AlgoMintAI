"use client";

import { useEffect, useState } from "react";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { getAlgodConfigFromViteEnvironment } from "@/utils/network/getAlgoClientConfigs";
import { useWallet } from "@txnlab/use-wallet-react";
import Image from "next/image";
import React from "react";

interface NFTAsset {
  id: number;
  name: string;
  unitName: string;
  url: string;
  image?: string;
  metadata?: any;
}

interface CollectionMeta {
  name: string;
  banner_image?: string;
  avatar_image?: string;
  [key: string]: any;
}

function ipfsToHttp(url: string, gateway = "https://gateway.pinata.cloud/ipfs/") {
  if (!url) return "";
  if (url.startsWith("ipfs://")) {
    return gateway + url.replace("ipfs://", "");
  }
  return url;
}

export default function MyNFTs() {
  const { activeAddress, transactionSigner } = useWallet();
  const [assets, setAssets] = useState<NFTAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [collectionMetas, setCollectionMetas] = useState<Record<string, CollectionMeta | null>>({});

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!activeAddress) return;
    setLoading(true);

    const indexerUrl = "https://testnet-idx.algonode.cloud/v2/assets?creator=" + activeAddress;

    fetch(indexerUrl)
      .then(res => res.json())
      .then(async data => {
        const nfts: NFTAsset[] = [];
        const collectionUrls = new Set<string>();
        for (const asset of data.assets || []) {
          if (asset.params.decimals === 0 && asset.params.total === 1) {
            let image, metadata;
            const metaUrl = asset.params.url;
            if (metaUrl) {
              let urlToTry = metaUrl;
              if (metaUrl.startsWith("ipfs://")) {
                urlToTry = ipfsToHttp(metaUrl);
              }
              try {
                const metaRes = await fetch(urlToTry);
                if (metaRes.ok) {
                  metadata = await metaRes.json();
                  if (metadata.image) {
                    image = metadata.image.startsWith("ipfs://")
                      ? ipfsToHttp(metadata.image)
                      : metadata.image;
                  }
                  // Collect collection URLs
                  if (metadata.collection && typeof metadata.collection === "string") {
                    collectionUrls.add(metadata.collection);
                  }
                }
              } catch (err) {
                console.warn("Metadata fetch failed for", urlToTry, err);
              }
            }
            nfts.push({
              id: asset.index,
              name: asset.params.name,
              unitName: asset.params["unit-name"],
              url: asset.params.url,
              image,
              metadata,
            });
          }
        }
        setAssets(nfts);

        // Fetch collection metadata for each unique collection URL
        const metas: Record<string, CollectionMeta | null> = {};
        await Promise.all(
          Array.from(collectionUrls).map(async (colUrl) => {
            try {
              const colMetaUrl = ipfsToHttp(colUrl);
              const res = await fetch(colMetaUrl);
              if (res.ok) {
                const json = await res.json();
                // Assume first collection in array
                metas[colUrl] = json.collections?.[0] || null;
              } else {
                metas[colUrl] = null;
              }
            } catch {
              metas[colUrl] = null;
            }
          })
        );
        setCollectionMetas(metas);

        setLoading(false);
      })
      .catch((err) => {
        console.error("Indexer fetch failed", err);
        setLoading(false);
      });
  }, [activeAddress]);

  // Group NFTs by collection URL
  const groupedByCollection: Record<string, NFTAsset[]> = {};
  assets.forEach((nft) => {
    const colUrl = nft.metadata?.collection;
    if (colUrl && typeof colUrl === "string") {
      if (!groupedByCollection[colUrl]) groupedByCollection[colUrl] = [];
      groupedByCollection[colUrl].push(nft);
    } else {
      if (!groupedByCollection["__no_collection__"]) groupedByCollection["__no_collection__"] = [];
      groupedByCollection["__no_collection__"].push(nft);
    }
  });

  const handleDelete = async (assetId: number) => {
    if (!activeAddress || !transactionSigner) {
      alert("Connect your wallet first.");
      return;
    }
    if (!window.confirm("Are you sure you want to destroy this NFT? This cannot be undone.")) {
      return;
    }
    try {
      const algodConfig = getAlgodConfigFromViteEnvironment();
      const algorand = AlgorandClient.fromConfig({ algodConfig });
      const destroyResult = await algorand.send.assetDestroy({
        sender: activeAddress,
        signer: transactionSigner,
        assetId: BigInt(assetId),
      });
      alert(`Asset destroyed! Transaction ID: ${destroyResult.transaction.txID}`);
      // Optionally refresh the NFT list
      setAssets((prev) => prev.filter((nft) => nft.id !== assetId));
    } catch (e) {
      alert("Failed to destroy asset. Make sure you own all units of this NFT.");
      console.error(e);
    }
  };

  return (
    <main className="w-full min-h-screen flex flex-col items-center bg-gradient-to-br from-[#e0e7ff] via-[#f0f4ff] to-[#e9d5ff] py-12">
      <section className="max-w-3xl w-full bg-white/95 p-8 rounded-3xl shadow-2xl border border-indigo-200">
        <h2 className="text-3xl font-extrabold mb-8 text-indigo-800 tracking-tight drop-shadow text-center">
          My Minted NFTs
        </h2>
        {!hasMounted ? (
          <div className="text-center text-indigo-700 font-semibold py-8">
            Loading...
          </div>
        ) : !activeAddress ? (
          <div className="text-center text-indigo-700 font-semibold py-8">
            Connect your wallet to view your NFTs.
          </div>
        ) : loading ? (
          <div className="text-center text-indigo-700 font-semibold py-8">
            Loading...
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No NFTs found for this address.
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(groupedByCollection).map(([colUrl, nfts]) => {
                const colMeta = colUrl !== "__no_collection__" ? collectionMetas[colUrl] : null;
                return (
                  <div key={colUrl} className="mb-2 bg-white rounded-xl shadow p-4 flex flex-col items-center">
                    {colMeta ? (
                      <div className="mb-2 flex flex-col items-center w-full">
                        <div className="flex items-center gap-2 mb-2">
                          {colMeta.avatar_image && (
                            <Image
                              src={ipfsToHttp(colMeta.avatar_image)}
                              alt={colMeta.name + " avatar"}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                          )}
                          <span className="text-base font-bold text-purple-900">{colMeta.name}</span>
                        </div>
                        {colMeta.banner_image && (
                          <Image
                            src={ipfsToHttp(colMeta.banner_image)}
                            alt={colMeta.name + " banner"}
                            width={120}
                            height={32}
                            className="rounded object-cover mb-2"
                          />
                        )}
                      </div>
                    ) : colUrl !== "__no_collection__" ? (
                      <div className="mb-2 text-purple-700 font-semibold text-sm">
                        Collection: {colUrl}
                      </div>
                    ) : (
                      <div className="mb-2 text-gray-700 font-semibold text-sm">
                        No Collection
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-4 w-full">
                      {nfts.map((nft) => (
                        <div key={nft.id} className="rounded-lg shadow p-2 bg-indigo-50 flex flex-col items-center">
                          {nft.image && (
                            <Image
                              src={nft.image}
                              alt={nft.name}
                              width={120}
                              height={120}
                              className="rounded object-cover mb-2"
                            />
                          )}
                          <h3 className="font-bold text-base mb-1">{nft.name}</h3>
                          <p className="text-indigo-700 mb-1 text-xs">{nft.unitName}</p>
                          {/* Properties */}
                          {nft.metadata && nft.metadata.properties && (
                            <div className="mb-1 w-full">
                              <div className="text-xs text-indigo-700 font-semibold mb-1">Properties:</div>
                              <ul className="text-xs text-gray-700 bg-indigo-100 rounded p-1">
                                {Object.entries(nft.metadata.properties).map(([key, value]) => (
                                  <li key={key}>
                                    <span className="font-semibold">{key}:</span> {String(value)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* Action buttons */}
                          <div className="flex gap-1 mt-1 mb-1 w-full justify-center">
                            <button
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded transition"
                              onClick={() => alert(`Send NFT ${nft.id}`)}
                            >
                              Send
                            </button>
                            <button
                              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded transition"
                              onClick={() => alert(`Sell NFT ${nft.id}`)}
                            >
                              Sell
                            </button>
                            {nft.metadata &&
                              nft.metadata.asset &&
                              nft.metadata.asset.params &&
                              nft.metadata.asset.params.manager &&
                              nft.metadata.asset.params.manager !==
                                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ" && (
                                <button
                                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded transition"
                                  onClick={() => handleDelete(nft.id)}
                                >
                                  Delete
                                </button>
                              )}
                          </div>
                          <a
                            href={`https://testnet.explorer.perawallet.app/asset/${nft.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 underline text-xs"
                          >
                            View on PeraExplorer
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}