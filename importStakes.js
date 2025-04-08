import Web3 from 'web3';
import ABI from './abis/MuonNodeStaking.json' assert { type: "json" };
import {promises as fs} from 'fs';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';

const RPC_URL = "https://endpoints.omniatech.io/v1/avax/mainnet/public"
const MAX_GAS = "7000000"
const FILE_NAME = "./data/stakes.csv"

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
  const content = await fs.readFile(`./${FILE_NAME}`)
  const records = await parse(content, {
      bom: true,
      delimiter: ",", 
      from_line: parseInt(args[0]),
      to_line: parseInt(args[1]) 
  })

  let users = []
  let balances = []
  let paidRewards = []
  let paidRewardPerTokens = []
  let pendingRewards = []
  let tokenIds = []
  let nodeAddresses = []
  let peerIds = []

  records.map((row) => {
    users.push(row[0])
    balances.push(row[1])
    paidRewards.push("0")
    paidRewardPerTokens.push("0")
    pendingRewards.push("0")
    tokenIds.push(row[2])
    nodeAddresses.push(row[3])
    peerIds.push(row[4])
  })

  const contract = new web3.eth.Contract(ABI.abi, contractAddr)
  const tx = contract.methods.migrate(
    users,
    balances,
    paidRewards,
    paidRewardPerTokens,
    pendingRewards,
    tokenIds,
    nodeAddresses,
    peerIds
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


