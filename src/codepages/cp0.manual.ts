import { Slice } from 'ton';
import { decompile } from '../disassembler';
import { Codepage } from '../structs/codepage';

const CP0Manual = new Codepage()

CP0Manual.insertHex('0', 4, (slice) => {
    let n = slice.readUintNumber(4)
    if (n == 0) {
        return `NOP`
    }
    return `s0 s${n} XCHG`
})
CP0Manual.insertHex('1', 4, (slice) => {
    let n = slice.readUintNumber(4)
    return `s1 s${n} XCHG`
})
CP0Manual.insertHex('2', 4, (slice) => {
    let n = slice.readUintNumber(4)
    return `s${n} PUSH`
})
CP0Manual.insertHex('3', 4, (slice) => {
    let value = slice.readUintNumber(4)
    return `s${value} POP`
})
CP0Manual.insertHex('4', 4, (slice) => {
    let i = slice.readUintNumber(4)
    let j = slice.readUintNumber(4)
    let k = slice.readUintNumber(4)
    return `s${i} s${j} s${k} XCHG3`
})
CP0Manual.insertHex('50', 8, (slice) => {
    let i = slice.readUintNumber(4)
    let j = slice.readUintNumber(4)
    return `s${i} s${j} XCHG2`
})
CP0Manual.insertHex('51', 8, (slice) => {
    let i = slice.readUintNumber(4)
    let j = slice.readUintNumber(4)
    return `s${i} s${j} XCPU`
})
CP0Manual.insertHex('52', 8, (slice) => {
    let i = slice.readUintNumber(4)
    let j = slice.readUintNumber(4)
    return `s${i} s${j-1} PUXC`
})
CP0Manual.insertHex('53', 8, (slice) => {
    let args = slice.readUintNumber(8)
    let first = args >> 4 & 0xf
    let second = args & 0xf
    return `s${first} s${second} PUSH2`
})
CP0Manual.insertHex('541', 12, (slice) => {
    let i = slice.readUintNumber(4)
    let j = slice.readUintNumber(4)
    let k = slice.readUintNumber(4)
    return `s${i} s${j} s${k} XC2PU`
})
CP0Manual.insertHex('59', 8, 'ROTREV')
CP0Manual.insertHex('7', 4, (slice) => {
    let x = slice.readIntNumber(4)
    return `${x} PUSHINT`
})
CP0Manual.insertHex('80', 8, (slice) => {
    let x = slice.readIntNumber(8)
    return `${x} PUSHINT`
})
CP0Manual.insertHex('81', 8, (slice) => {
    let x = slice.readIntNumber(16)
    return `${x} PUSHINT`
})
CP0Manual.insertHex('82', 8, (slice) => {
    let len = slice.readUintNumber(5)
    let n = 8 * len + 19
    let x = slice.readIntNumber(n)
    return `${x} PUSHINT`
})
CP0Manual.insertHex('83', 8, (slice) => {
    let x = slice.readUintNumber(8) + 1
    return `${x} PUSHPOW2`
})
CP0Manual.insertHex('84', 8, (slice) => {
    let args = slice.skip(8);
    return 'PUSHPOW2DEC';
})
CP0Manual.insertHex('8D', 8, (slice) => {
    let r = slice.readUintNumber(3)
    let len = slice.readUintNumber(7)
    let dataLen = 8 * len + 6
    let x = slice.readUint(dataLen)
    return `${r} ${len} ${x.toString('hex')} PUSHSLICE`
})
CP0Manual.insertHex('8E', 7, (slice, indent) => {
    let args = slice.readUintNumber(9);
    let refs = (args >> 7) & 3;
    let dataBits = (args & 127) * 8;
    return `<{\n${decompile(slice.readRef(), indent + 2)}${new Array(indent).fill(' ').join('')}}> PUSHCONT`
})
CP0Manual.insertHex('9', 4, (slice, indent) => {
    let len = slice.readUintNumber(4)
    return `<{\n${decompile(slice, indent + 2)}${new Array(indent).fill(' ').join('')}}> PUSHCONT`
})
CP0Manual.insertHex('A1', 8, 'SUB')
CP0Manual.insertHex('A4', 8, 'INC')
CP0Manual.insertHex('A9', 8, (slice) => {
    let m = slice.readBit()
    let s = slice.readUintNumber(2)
    let c = slice.readBit()
    let d = slice.readUintNumber(2)
    let f = slice.readUintNumber(2)
    let opName = ''
    if (m) {
        opName += 'MUL'
    }
    if (s == 0) {
        opName += 'DIV'
    } else {
        if (s == 1) {
            opName = 'RSHIFT'
        } else {
            opName = 'LSHIFT'
        }
        if (!c) {
            opName += ' s0'
        } else {
            let shift = slice.readUintNumber(8) + 1
            opName += ` ${shift}`
        }
    }
    if (d === 1) {
        opName += ' QOUT'
    } else if (d === 2) {
        opName += ' REM'
    } else if (d === 3) {
        opName += ' BOTH'
    }
    if (f === 1) {
        opName += ' R'
    } else if (f == 2) {
        opName += ' C'
    }
    return opName
})
CP0Manual.insertHex('AA', 8, (slice) => {
    let cc = slice.readUintNumber(8)
    return `${cc} LSHIFT` 
})
CP0Manual.insertHex('AB', 8, (slice) => {
    let cc = slice.readUintNumber(8)
    return `${cc+1} RSHIFT`
})
CP0Manual.insertHex('AE', 8, 'POW2')
CP0Manual.insertHex('B0', 8, 'AND')
CP0Manual.insertHex('B1', 8, 'OR')
CP0Manual.insertHex('B600', 16, 'FITSX')
CP0Manual.insertHex('B601', 16, 'UFITSX')
CP0Manual.insertHex('B8', 8, 'SGN')
CP0Manual.insertHex('B9', 8, 'LESS')
CP0Manual.insertHex('BA', 8, 'EQUAL')
CP0Manual.insertHex('BB', 8, 'LEQ')
CP0Manual.insertHex('BC', 8, 'GREATER')
CP0Manual.insertHex('BD', 8, 'NEQ')
CP0Manual.insertHex('BE', 8, 'GEQ')
CP0Manual.insertHex('BF', 8, 'CMP')
CP0Manual.insertHex('C0', 8, (slice) => {
    let args = slice.skip(8)
    return `(todo) EQINT`
})
CP0Manual.insertHex('C8', 8, 'NEWC')
CP0Manual.insertHex('C9', 8, 'ENDC')
CP0Manual.insertHex('CB', 8, (slice) => {
    let c = slice.readUintNumber(8)
    return `${c} STU`
})
CP0Manual.insertHex('CC', 8, 'STREF')
CP0Manual.insertHex('CF16', 16, 'STSLICER')
CP0Manual.insertHex('D0', 8, 'CTOS')
CP0Manual.insertHex('D1', 8, 'ENDS')
CP0Manual.insertHex('D2', 8, (slice) => {
    let c = slice.readUintNumber(8)
    return `${c+1} LDI`
})
CP0Manual.insertHex('D3', 8, (slice) => {
    let c = slice.readUintNumber(8)
    return `${c+1} LDU`
})
CP0Manual.insertHex('D4', 8, 'LDREF')
CP0Manual.insertHex('D721', 16, 'SDSKIPFIRST')
CP0Manual.insertHex('D74C', 16, 'PLDREF')

CP0Manual.insertHex('D70B', 16, (slice) => {
    let c = slice.readUintNumber(8)
    return `${c+1} PLDU`
})
CP0Manual.insertHex('D718', 16, 'LDSLICEX')
CP0Manual.insertHex('D74A', 16, 'SREFS')
CP0Manual.insertHex('DB3C', 16, 'CALLREF')
CP0Manual.insertHex('DD', 8, 'IFNOTRET')
CP0Manual.insertHex('E0', 8, 'IFJMP')
CP0Manual.insertHex('E2', 8, 'IFELSE')
CP0Manual.insertHex('E304', 16, 'CONDSEL')
CP0Manual.insertHex('E8', 8, 'WHILE')
CP0Manual.insertHex('ED44', 16, 'PUSHROOT')
CP0Manual.insertHex('ED54', 16, 'c4 POP')

CP0Manual.insertHex('F2C8', 13, (slice) => {
    slice.skip(11)
    return `THROWARG`
})
CP0Manual.insertHex('F24', 10, (slice) => {
    let eCode = slice.readUint(6)
    return `${eCode} THROWIF`
})
CP0Manual.insertHex('F28', 10, (slice) => {
    let eCode = slice.readUint(6)
    return `${eCode} THROWIFNOT`
})
CP0Manual.insertHex('F2FF', 16, 'TRY')
CP0Manual.insertHex('F800', 16, 'ACCEPT')
CP0Manual.insertHex('F810', 16, 'RANDU256')
CP0Manual.insertHex('F823', 16, 'NOW')
CP0Manual.insertHex('F815', 16, 'ADDRAND')
CP0Manual.insertHex('F901', 16, 'HASHSU')
CP0Manual.insertHex('F910', 16, 'CHKSIGNU')
CP0Manual.insertHex('FB00', 16, 'SENDRAWMSG')
CP0Manual.insertHex('FA00', 16, 'LDGRAMS')
CP0Manual.insertHex('FF00', 16, 'SETCP0')

CP0Manual.insertBin('111101001010', (slice) => {
    let something = slice.readBit()
    let something2 = slice.readBit()
    let n = slice.readUintNumber(10)
    return `${n} DICTPUSHCONST`
})
CP0Manual.insertHex('F4BC', 14, (slice) => {
    let args = slice.skip(2)
    return 'DICTIGETJMPZ'
})

export { CP0Manual }