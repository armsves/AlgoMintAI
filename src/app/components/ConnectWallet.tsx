import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import Account from './Account'
import Image from 'next/image'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
  hideClose?: boolean
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  // Render as a dropdown panel, not a dialog
  if (!openModal) return null;

  return (
    <div
      className="p-6 bg-gray rounded-xl shadow-lg min-w-[280px] border border-indigo-100"
      onClick={e => e.stopPropagation()}
    >
      <h3 className="font-bold text-lg mb-4 text-indigo-700">Select wallet provider</h3>
      <div className="grid gap-3 mb-4">
        {activeAddress && (
          <>
            <div className="bg-indigo-50 rounded-lg p-3 mb-2">
              <Account />
            </div>
            <hr className="my-2 border-indigo-200" />
          </>
        )}

        {!activeAddress &&
          wallets?.map((wallet) => (
            <button
              type="button"
              data-test-id={`${wallet.id}-connect`}
              className="flex items-center gap-2 border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-100 transition m-0"
              key={`provider-${wallet.id}`}
              onClick={e => {
                e.preventDefault()
                wallet.connect()
                closeModal()
              }}
            >
              {!isKmd(wallet) && (
                <Image
                  alt={`wallet_icon_${wallet.id}`}
                  src={wallet.metadata.icon}
                  width={28}
                  height={28}
                  style={{ objectFit: 'contain' }}
                />
              )}
              <span className="font-medium text-indigo-800">{isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}</span>
            </button>
          ))}
      </div>
      {activeAddress && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            className="text-red-600 hover:text-red-800 font-bold px-3 py-1 rounded transition"
            data-test-id="logout"
            onClick={async e => {
              e.preventDefault()
              if (wallets) {
                const activeWallet = wallets.find((w) => w.isActive)
                if (activeWallet) {
                  await activeWallet.disconnect()
                } else {
                  localStorage.removeItem('@txnlab/use-wallet:v3')
                  window.location.reload()
                }
              }
              closeModal()
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
export default ConnectWallet
