import { BN } from 'bn.js';
import { Cell, Slice } from 'ton'
import { CP0Auto } from './codepages/cp0.generated';
import { KnownMethods } from './consts/knownMethods';
import { Codepage } from './structs/codepage';
import { _isDebug } from './utils/isDebug';

let codepage: Codepage = CP0Auto

export function setCodepage(cp: Codepage) {
    codepage = cp
}

export function decompile(slice: Slice, indent?: number) {
    let result = '';
    const append = (txt: string | Cell) => {
        if (txt instanceof Cell) {
            result += txt.toString(' '.repeat(indent || 0));
            return;
        }
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
            let fullCell = new Cell();
            fullCell.bits.writeBitArray(Array.from(opCode).map(a => a == '0' ? false : true));
            fullCell.writeCell(slice.toCell());
            append(fullCell);
            continue;
        }

        let op = codepage.getOp(opCode)
        opCode = ''
        if (typeof op === 'string') {
            append(op)
        } else if (typeof op === 'function') {
            let opTxt = op(slice, indent || 0);
            append(opTxt);
        }

        if (((slice as any).bits as any).length == (slice as any).bits.currentOffset && (slice as any).refs.length > 0) {
            slice = slice.readRef()
        }
    }
    return result;
}

export function decompileMethodsMap(slice: Slice, indent?: number) {
    let methodsMap = slice.readDict(19, (slice) => {
        try {
            return decompile(slice.clone(), (indent || 0) + 4);
        } catch (e) {
            _isDebug() && console.error(e);
            return slice.toCell().toString(' '.repeat((indent || 0) + 4));
        }
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
        let methodId = cell.beginParse().readIntNumber(19);
        append(`${KnownMethods[methodId] ?? methodId}: \n${code}`);
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