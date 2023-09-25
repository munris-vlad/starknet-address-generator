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

	const argentXaccountClassHash = "0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003";
	
	const masterNode = ethers.HDNodeWallet.fromSeed(toBeHex(BigInt(wallet.privateKey)))
    	const childNode = masterNode.derivePath(`m/44'/9004'/0'/0/0`)
	const privateKey = `0x${ec.starkCurve.grindKey(childNode.privateKey)}`
	const publicKey = ec.starkCurve.getStarkKey(privateKey);
	const constructorcallData = CallData.compile({ owner: ec.starkCurve.getStarkKey(privateKey), guardian: 0})

	const contractAddress = hash.calculateContractAddressFromHash(publicKey, argentXaccountClassHash, constructorCallData, 0)

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
