import { Address, Cell, TonClient } from 'ton'
import { CP0Manual } from './codepages/cp0.manual'
import { fromCode, setCodepage } from './disassembler'

it('should work', async () => {
    // setCodepage(CP0Manual)

    let client = new TonClient({
        endpoint: 'https://scalable-api.tonwhales.com/jsonRPC'
    })
    let address = Address.parseFriendly('Ef-kkdY_B7p-77TLn2hUhM6QidWrrsl8FYWCIvBMpZKprKDH').address
    let state = await client.getContractState(address)
    if (!state.code) {
        console.error('code not found')
        return
    }

    // at this point we need to realize if the code is linked list or hashmap

    let codeCell = Cell.fromBoc(state.code)[0]
    
    console.log(await fromCode(codeCell))
})