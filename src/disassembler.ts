import { BN } from 'bn.js';
import { Address, TonClient, Cell, Slice, BitString } from 'ton'
import { CP0Auto } from './codepages/cp0.generated';
import { Codepage } from './structs/codepage';

let codepage: Codepage = CP0Auto

export function setCodepage(cp: Codepage) {
    codepage = cp
}

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

        let matches = codepage.find(opCode)
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

        let op = codepage.getOp(opCode)
        // result += parseInt(opCode, 2).toString(16) + ' ';
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
        if (((slice as any).bits as any).length == (slice as any).bits.currentOffset && (slice as any).refs.length > 0) {
            slice = slice.readRef();
        }
    }
    return result;
}

export function decompileMethodsMap(slice: Slice, keySize: number, indent?: number) {
    let methodsMap = slice.readDict(19, (slice) => {
        return decompile(slice, (indent || 0) + 4);
    });
    let result = '';
    const append = (txt: string) => {
        if (indent) {
            for (let i = 0; i < indent; i++) result += ' ';
        }
        result += txt + '\n';
    };
    append('(:methods');
    indent = (indent || 0) + 2
    for (let [key, code] of methodsMap) {
        let cell = new Cell();
        cell.bits.writeUint(new BN(key), 19);
        append(`${cell.beginParse().readIntNumber(19)}: \n${code}`);
    }
    result = result.slice(0, -1); // remove trailing newline
    indent -= 2;
    append(')');
    result = result.slice(0, -1); // remove trailing newline
    return result;
}

export function fromCode(cell: Cell) {
    let slice = cell.beginParse()
    let header = slice.readUintNumber(16)
    if (header !== 0xff00) {
        throw new Error('unsupported codepage');
    }

    let result = 'SETCP0\n'
    result += decompile(slice);
    return result;
}