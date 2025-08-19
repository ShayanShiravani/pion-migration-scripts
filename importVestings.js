import Web3 from 'web3';
import ABI from './abis/MuonVestingManager.json' with { type: "json" };
import {promises as fs} from 'fs';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';

const RPC_URL = "https://endpoints.omniatech.io/v1/avax/mainnet/public"
const MAX_GAS = "7000000"
const FILE_NAME = "./data/vestings-v6.csv"

const missingPrivateKey = () => {
  throw Error('PrivateKey missing')
}

const missingContractAddress = () => {
  throw Error('MuonVesting address missing')
}

const main = async () => {
  const contractAddr = process.env.MUON_VESTING_ADDRESS || missingContractAddress()
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

  let stakers = []
  let balances = []

  records.map((row) => {
    stakers.push(row[0])
    balances.push(row[1])
  })

  const contract = new web3.eth.Contract(ABI.abi, contractAddr)
  const tx = contract.methods.bulkImport(
    stakers, balances
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


