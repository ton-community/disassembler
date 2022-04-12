import { BN } from 'bn.js';
import { Address, TonClient, Cell, Slice, BitString } from 'ton'
import { CP0Auto } from './codepages/cp0.generated';

export function decompile(slice: Slice, indent?: number) {
    let result = '';
    const append = (txt: string) => {
        if (indent) {
            for (let i = 0; i < indent; i++) result += ' ';
        }
        result += txt + '\n'
    };
    let opCode = ''
    while (((slice as any).bits as any).length > (slice as any).bits.currentOffset) {
        let opCodePart = slice.readBit()
        opCode += opCodePart ? '1' : '0'

        let matches = CP0Auto.find(opCode)
        if (matches.length > 1) {
            continue;
        }
        if (matches.length == 1 && opCode.length !== matches[0].length) {
            continue;
        }
        if (matches.length == 0) {
            let bitString = BitString.alloc(1023)
            bitString.writeBitArray(Array.from(opCode).map(a => a == '0' ? false : true));
            bitString.writeBitString(slice.readRemaining());
            append(`{${bitString.toFiftHex()}}`)
            continue;
        }

        let op = CP0Auto.getOp(opCode)
        opCode = ''
        if (!op) {
            append('NULL')
            continue
        }
        if (typeof op === 'string') {
            append(op)
        } else if (typeof op === 'function') {
            append(op(slice, indent || 0))
        }
    }
    return result;
}

export async function loadSource() {
    let client = new TonClient({
        endpoint: 'https://scalable-api.tonwhales.com/jsonRPC'
    })

    let state = await client.getContractState(Address.parseFriendly('Ef-kkdY_B7p-77TLn2hUhM6QidWrrsl8FYWCIvBMpZKprKDH').address)
    if (!state.code) {
        console.error('code not found')
        return
    }

    // at this point we need to realize if the code is linked list or hashmap

    let codeCell = Cell.fromBoc(state.code)[0]
    // let data = parseDict(codeCell.beginParse(), 4, (slice) => {
    //     return slice
    // })

    let slice = codeCell.beginParse()
    let header = slice.readUintNumber(16)
    if (header !== 0xff00) {
        throw new Error('unsupported codepage');
    }

    let result = 'SETCP0\n'
    result += decompile(slice);

    console.log(result);

    let methodsMap = slice.readDict(19, (slice) => {
        let decompiled = decompile(slice);
        console.log((slice as any).refs.length);
        return decompiled;
    });
    for (let [key, code] of methodsMap) {
        let cell = new Cell();
        cell.bits.writeUint(new BN(key), 19);
        console.log(`${cell.beginParse().readIntNumber(19)}: \n${code}`);
    }
}