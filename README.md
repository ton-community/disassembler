# TON VM Disassembler
Provides Fift-like code from smart contract source
## Usage
```
let client = new TonClient({
    endpoint: 'https://scalable-api.tonwhales.com/jsonRPC'
});
let address = Address.parseFriendly('Ef-kkdY_B7p-77TLn2hUhM6QidWrrsl8FYWCIvBMpZKprKDH').address;
let state = await client.getContractState(address);

let codeCell = Cell.fromBoc(state.code)[0];
    
let source = await fromCode(codeCell);
```