import { HDNodeWallet, Mnemonic, toBeHex, Wallet, ethers } from 'ethers'
import { Account, constants, ec, json, stark, Provider, hash, CallData } from "starknet";
import { createObjectCsvWriter } from 'csv-writer';

const csvWriter = createObjectCsvWriter({
    path: 'wallets.csv',
    header: [
        { id: 'address', title: 'address'},
        { id: 'mnemonic', title: 'mnemonic'},
        { id: 'pk', title: 'pk'},
        { id: 'starknet_address', title: 'starknet_address'},
        { id: 'starknet_key', title: 'starknet_key'},
    ]
});

const args = process.argv.slice(2);
const count = args[0];
let csvData = [];

async function generateArgentWallet() {
	const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_GOERLI } });
	const wallet = Wallet.createRandom();

	const argentXaccountClassHash = "0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2";
	const argentXproxyClassHash = "0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918";
	
	const masterNode = ethers.HDNodeWallet.fromSeed(toBeHex(BigInt(wallet.privateKey)))
    const childNode = masterNode.derivePath(`m/44'/9004'/0'/0/0`)
	const privateKey = `0x${ec.starkCurve.grindKey(childNode.privateKey)}`
	const publicKey = ec.starkCurve.getStarkKey(privateKey);
	const constructorCallData = CallData.compile({
		implementation: argentXaccountClassHash,
		selector: hash.getSelectorFromName('initialize'),
		calldata: CallData.compile({ signer: publicKey, guardian: '0' })
	});

	const contractAddress = hash.calculateContractAddressFromHash(publicKey, argentXproxyClassHash, constructorCallData, 0)

	csvData.push({
		address: wallet.address,
		mnemonic: wallet.mnemonic.phrase,
		pk: wallet.privateKey,
		starknet_address: contractAddress.replace('0x', '0x0'),
		starknet_key: privateKey.replace('0x', '0x0')
	});
}

function generateWallets() {
	for (var i = 0; i < count; i++) {
		generateArgentWallet();
	}
}

async function main() {
	await generateWallets();
	csvWriter.writeRecords(csvData)
        .then(() => console.log('Запись в CSV файл завершена'))
        .catch(error => console.error('Произошла ошибка при записи в CSV файл:', error));
}

main();