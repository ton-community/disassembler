import { beginCell, Cell, Dictionary, DictionaryValue, Slice } from 'ton-core';
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

    while (slice.remainingBits > 0) {
        let opCodePart = slice.loadBit();
        opCode += opCodePart ? '1' : '0'

        // edit maxOccurencies only for debugging purposes
        let matches = codepage.find(opCode, 2);
        if (matches.length > 1) {
            continue;
        }
        if (matches.length == 1 && opCode.length !== matches[0].length) {
            continue;
        }
        if (matches.length == 0) {
            let fullCell = beginCell();
            for (let bit of Array.from(opCode).map(a => a == '0' ? false : true)) {
                fullCell.storeBit(bit);
            }
            fullCell.storeSlice(slice);
            append(fullCell.asCell());
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

        if (slice.remainingBits === 0 && slice.remainingRefs > 0) {
            slice = slice.loadRef().beginParse()
        }
    }
    return result;
}

function createSliceValue(): DictionaryValue<Slice> {
    return {
        serialize: (src, builder) => {
            builder.storeSlice(src);
        },
        parse: (src) => {
            return src;
        }
    };
}

export function decompileMethodsMap(slice: Slice, keyLen: number, indent?: number) {
    let methodsMap = slice.loadDictDirect(Dictionary.Keys.Int(keyLen), createSliceValue());
    let methodsMapDecompiled = new Map<number, string>();
    for (let [key, cs] of methodsMap) {
        try {
            methodsMapDecompiled.set(key, decompile(cs, (indent || 0) + 4));
        } catch (e) {
            _isDebug() && console.error(e);
            methodsMapDecompiled.set(key, cs.asCell().toString(' '.repeat((indent || 0) + 4)));
        }
    }
    let result = '';
    const append = (txt: string) => {
        if (indent) {
            for (let i = 0; i < indent; i++) result += ' ';
        }
        result += txt + '\n';
    };
    append('(:methods');
    indent = (indent || 0) + 2;
    for (let [methodId, code] of methodsMapDecompiled) {
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
    let header = slice.loadUint(16)
    if (header !== 0xff00) {
        throw new Error('unsupported codepage');
    }

    let result = 'SETCP0\n'
    result += decompile(slice);
    return result;
}

export function fromBoc(boc: Buffer) {
    let cell = Cell.fromBoc(boc)[0];

    return fromCode(cell);
}