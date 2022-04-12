import { Slice } from 'ton';
import { Trie } from './trie';

type Op = ((slice: Slice, ident: number) => string) | string

export class Codepage {
    private readonly _trie = new Trie<Op>();

    insertHex(hex: string, len: number, op: Op) {
        let prefix = Array.from(parseInt(hex, 16).toString(2)).slice(0, len).join('');
        if (prefix.length < len) {
            prefix = new Array(len - prefix.length).fill('0').join('') + prefix;
        }
        if (prefix.startsWith('11011111')) {
            console.log(hex, len, op);
        }
        this._trie.insert(prefix, op);
    }

    insertBin(bin: string, op: Op) {
        this._trie.insert(bin, op);
    } 

    getOp(bitPrefix: string) {
        return this._trie.getValue(bitPrefix)
    }

    find(prefix: string) {
        return this._trie.find(prefix);
    }
}