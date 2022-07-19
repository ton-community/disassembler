import { Address, Cell, TonClient } from 'ton'
import { fromCode } from './disassembler'
import { compileFift, compileFunc } from 'ton-compiler'


it('should disassemble config', async () => {
    let client = new TonClient({
        endpoint: 'https://scalable-api.tonwhales.com/jsonRPC'
    })
    let address = Address.parseFriendly('Ef9VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVbxn').address
    let state = await client.getContractState(address)
    if (!state.code) {
        console.error('code not found')
        return
    }

    let codeCell = Cell.fromBoc(state.code)[0]

    console.log(fromCode(codeCell))
})

it('should disassemble nft', async () => {
    let client = new TonClient({
        endpoint: 'https://mainnet.tonhubapi.com/jsonRPC'
    })
    let address = Address.parseFriendly('EQBmG4YwsdGsUHG46rL-_GtGxsUrdmn-8Tau1DKkzQMNsGaW').address
    let state = await client.getContractState(address)
    if (!state.code) {
        console.error('code not found')
        return
    }

    let codeCell = Cell.fromBoc(state.code)[0]
    
    console.log(fromCode(codeCell))
})

it('should dump method', async () => {
    let fiftCode = await compileFunc(`
        () main() {

        }

        () owner() method_id {

        }
    `)
    let code = await compileFift(fiftCode);
    let codeCell = Cell.fromBoc(code)[0]

    console.log(fromCode(codeCell))
})

it('should disassemble elector', async () => {
    let client = new TonClient({
        endpoint: 'https://mainnet.tonhubapi.com/jsonRPC'
    })
    let address = Address.parseFriendly('Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF').address
    let state = await client.getContractState(address)
    if (!state.code) {
        console.error('code not found')
        return
    }

    let codeCell = Cell.fromBoc(state.code)[0]
    
    console.log(fromCode(codeCell))
})


it('should disassemble contract', async () => {
    let client = new TonClient({
        endpoint: 'https://mainnet.tonhubapi.com/jsonRPC'
    })
    let address = Address.parseFriendly('EQBRrTk63wHpvreMs7_cDKWh6zrYmQcSBOjKz1i6GcbRTLZX').address
    let state = await client.getContractState(address)
    if (!state.code) {
        console.error('code not found')
        return
    }

    let codeCell = Cell.fromBoc(state.code)[0]
    
    console.log(fromCode(codeCell))
})