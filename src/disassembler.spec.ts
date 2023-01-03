import { Address, Cell } from 'ton-core'
import { fromBoc, fromCode } from './disassembler'
import { compileFift, compileFunc } from 'ton-compiler'
import { TonClient } from 'ton'
import * as fs from 'fs';

async function fetchCodeOrSnapshot(addr: string): Promise<Buffer> {
    const snapshotPath = __dirname + '/__snapshots__/' + addr + '.boc';
    if (fs.existsSync(snapshotPath)) {
        return fs.readFileSync(snapshotPath);
    }

    let client = new TonClient({
        endpoint: 'https://scalable-api.tonwhales.com/jsonRPC'
    })

    let address = Address.parseFriendly(addr).address
    let state = await client.getContractState(address)
    if (!state.code) {
        throw new Error('Code not found');
    }
    fs.writeFileSync(snapshotPath, state.code);

    return state.code;
}


describe('disassembler', () => {
    beforeAll(() => {
        process.env.DEBUG = process.env.DEBUG + ',tvm-disassembler'
    });

    it('should disassemble config', async () => {
        let boc = await fetchCodeOrSnapshot('Ef9VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVbxn');
    
        expect(fromBoc(boc)).toMatchSnapshot();
    })
    
    it('should disassemble nft', async () => {
        let boc = await fetchCodeOrSnapshot('EQBmG4YwsdGsUHG46rL-_GtGxsUrdmn-8Tau1DKkzQMNsGaW');
    
        expect(fromBoc(boc)).toMatchSnapshot();
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
    
        expect(fromCode(codeCell)).toMatchSnapshot(); 
    })
    
    it('should disassemble elector', async () => {
        // Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF
        let boc = await fetchCodeOrSnapshot('Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF');
    
        expect(fromBoc(boc)).toMatchSnapshot();
    })
    
    
    it('should disassemble contract', async () => {
        let boc = await fetchCodeOrSnapshot('EQBRrTk63wHpvreMs7_cDKWh6zrYmQcSBOjKz1i6GcbRTLZX');
    
        expect(fromBoc(boc)).toMatchSnapshot();
    })

    it('should disassemble #5', async () => {
        let boc = await fetchCodeOrSnapshot('EQDSbgHX03B9_0cNBAMdlmhVbvhRNYhZNhTRH4wfNBmisKB5');

        expect(fromBoc(boc)).toMatchSnapshot();
    })
})