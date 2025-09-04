import { useWallet } from '@txnlab/use-wallet-react'
import { useMemo } from 'react'
import { ellipseAddress } from '@/utils/ellipseAddress'
import { getAlgodConfigFromViteEnvironment } from '@/utils/network/getAlgoClientConfigs'

const Account = () => {
  const { activeAddress } = useWallet()
  const algoConfig = getAlgodConfigFromViteEnvironment()

  const networkName = useMemo(() => {
    return algoConfig.network === '' ? 'localnet' : algoConfig.network.toLocaleLowerCase()
  }, [algoConfig.network])

  return (
    <div>
      <a
        className="text-xl text-gray-900 font-mono font-semibold"
        target="_blank"
        href={`https://lora.algokit.io/${networkName}/account/${activeAddress}/`}
        rel="noopener noreferrer"
      >
        Address: {ellipseAddress(activeAddress)}
      </a>
      <div className="text-xl text-gray-800 font-semibold">
        Network: {networkName}
      </div>
    </div>
  )
}

export default Account
