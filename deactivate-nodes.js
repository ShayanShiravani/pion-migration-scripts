import Web3 from 'web3';
import ABI from './abis/MuonNodeStaking.json' assert { type: "json" };
import 'dotenv/config';

const RPC_URL = "https://endpoints.omniatech.io/v1/avax/mainnet/public"
const MAX_GAS = "7000000"

const missingPrivateKey = () => {
  throw Error('PrivateKey missing')
}

const missingContractAddress = () => {
  throw Error('MuonNodeStaking address missing')
}

const main = async () => {
  const contractAddr = process.env.NODE_STAKING_ADDRESS || missingContractAddress()
  const privateKey = process.env.PRIVATE_KEY || missingPrivateKey()

  const web3 = new Web3(RPC_URL)
  const account = web3.eth.accounts.privateKeyToAccount(
    `0x${privateKey}`
  )

  const args = process.argv.slice(2)

  const contract = new web3.eth.Contract(ABI.abi, contractAddr)

  const staker = args[0];
  const tx = contract.methods.deactiveMuonNode(staker)

  const options = {
    to: contractAddr,
    data: tx.encodeABI(),
    gas: MAX_GAS,
    gasPrice: await web3.eth.getGasPrice(),
    nonce: await web3.eth.getTransactionCount(account.address)
  }
  const signed  = await web3.eth.accounts.signTransaction(options, privateKey)
  const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction)

  console.log(receipt.transactionHash) 
}

main()


