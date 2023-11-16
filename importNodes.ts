import Web3, { Web3BaseWalletAccount } from 'web3';
import {abi} from './abis/MuonNodeManager.json';
import {promises as fs} from 'fs';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';

const RPC_URL = "https://rpc.ankr.com/bsc_testnet_chapel"
const MAX_GAS = "7000000"
const FILE_NAME = "./data/nodes.csv"

const missingPrivateKey = () => {
  throw Error('PrivateKey missing')
}

const missingContractAddress = () => {
  throw Error('MuonNodeManager address missing')
}

const main = async () => {
  const contractAddr: string = process.env.NODE_MANAGER_ADDRESS || missingContractAddress()
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

  let nodeIds: Array<string> = []
  let nodeAddresses: Array<string> = []
  let stakerAddresses: Array<string> = []
  let peerIds: Array<string> = []
  let tiers: Array<string> = []

  records.map((row: Array<string>) => {
    nodeIds.push(row[0])
    nodeAddresses.push(row[1])
    stakerAddresses.push(row[2])
    peerIds.push(row[3])
    tiers.push(row[4])
  })

  const contract = new web3.eth.Contract(abi, contractAddr)
  const tx = await (contract.methods.migrate as any)(
    nodeIds, nodeAddresses, stakerAddresses, peerIds, tiers
  )
  let options = {
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


