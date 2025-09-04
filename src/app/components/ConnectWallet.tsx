import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import Account from './Account'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  // Render as a dropdown panel, not a dialog
  if (!openModal) return null;

  return (
    <div
      className="bg-white border rounded shadow-lg min-w-[260px] p-4"
      onClick={e => e.stopPropagation()}
    >
      <h3 className="font-bold text-lg mb-2">Select wallet provider</h3>
      <div className="grid m-2 pt-2">
        {activeAddress && (
          <>
            <Account />
            <div className="divider" />
          </>
        )}

        {!activeAddress &&
          wallets?.map((wallet) => (
            <button
              type="button"
              data-test-id={`${wallet.id}-connect`}
              className="btn border-teal-800 border-1 m-2"
              key={`provider-${wallet.id}`}
              onClick={e => {
                e.preventDefault()
                wallet.connect()
                closeModal()
              }}
            >
              {!isKmd(wallet) && (
                <img
                  alt={`wallet_icon_${wallet.id}`}
                  src={wallet.metadata.icon}
                  style={{ objectFit: 'contain', width: '30px', height: 'auto' }}
                />
              )}
              <span>{isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}</span>
            </button>
          ))}
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          data-test-id="close-wallet-modal"
          className="btn"
          onClick={e => {
            e.preventDefault()
            closeModal()
          }}
        >
          Close
        </button>
        {activeAddress && (
          <button
            type="button"
            className="btn btn-warning"
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
        )}
      </div>
    </div>
  )
}
export default ConnectWallet
