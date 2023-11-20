import Web3, { Web3BaseWalletAccount } from 'web3';
import {abi} from './abis/BulkTransfer.json';
import {promises as fs} from 'fs';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';

const RPC_URL = "https://rpc.ankr.com/bsc_testnet_chapel"
const MAX_GAS = "7000000"
const FILE_NAME = "./data/pions.csv"

const missingPrivateKey = () => {
  throw Error('PrivateKey missing')
}

const missingContractAddress = () => {
  throw Error('BondedPION address missing')
}

const main = async () => {
  const contractAddr: string = process.env.BULK_TRANSFER_ADDRESS || missingContractAddress()
  const privateKey: string = process.env.PRIVATE_KEY || missingPrivateKey()

  const web3 = new Web3(RPC_URL)
  const account: Web3BaseWalletAccount = web3.eth.accounts.privateKeyToAccount(
    `0x${privateKey}`
  )

  const args: Array<string> = process.argv.slice(2)
  const content = await fs.readFile(`./${FILE_NAME}`)
  const records = await parse(content, {
      bom: true,
      delimiter: ",", 
      from_line: parseInt(args[0]),
      to_line: parseInt(args[1]) 
  })

  let addresses: Array<string> = []
  let amounts: Array<string> = []

  records.map((row: Array<string>) => {
    addresses.push(row[0])
    amounts.push(row[1])
  })


  const contract = new web3.eth.Contract(abi, contractAddr)
  const tx = (contract.methods.bulkTransfer as any)(
    addresses, amounts
  )

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


