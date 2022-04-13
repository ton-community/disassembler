import { Cell, Slice } from 'ton';
import { decompile, decompileMethodsMap } from '../disassembler';
import { Codepage } from '../structs/codepage';

function fetchSubslice(slice: Slice, bits: number, refs?: number) {
    let subcell = new Cell();
    for (let i = 0; i < bits; i++) {
        subcell.bits.writeBit(slice.readBit());
    }
    for (let i = 0; i < (refs || 0); i++) {
        subcell.refs.push(slice.readCell())
    }
    return subcell.beginParse();
}


const CP0Auto = new Codepage()

CP0Auto.insertHex('0', 4, (slice) => {
    let n = slice.readUintNumber(4);
    if (n == 0) {
        return `NOP`;
    }
    return `s0 s${n} XCHG`;
})
CP0Auto.insertHex('1', 4, (slice) => {
    let n = slice.readUintNumber(4);
    return `s1 s${n} XCHG`;
})
CP0Auto.insertHex('2', 4, (slice) => {
    let n = slice.readUintNumber(4);
    return `s${n} PUSH`;
})
CP0Auto.insertHex('3', 4, (slice) => {
    let value = slice.readUintNumber(4);
    return `s${value} POP`;
})
CP0Auto.insertHex('4', 4, (slice) => {
    let i = slice.readUintNumber(4);
    let j = slice.readUintNumber(4);
    let k = slice.readUintNumber(4);
    return `s${i} s${j} s${k} XCHG3`;
})
CP0Auto.insertHex('50', 8, (slice) => {
    let i = slice.readUintNumber(4);
    let j = slice.readUintNumber(4);
    return `s${i} s${j} XCHG2`;
})
CP0Auto.insertHex('51', 8, (slice) => {
    let i = slice.readUintNumber(4);
    let j = slice.readUintNumber(4);
    return `s${i} s${j} XCPU`;
})
CP0Auto.insertHex('52', 8, (slice) => {
    let i = slice.readUintNumber(4);
    let j = slice.readUintNumber(4);
    return `s${i} s${j-1} PUXC`;
})
CP0Auto.insertHex('53', 8, (slice) => {
    let args = slice.readUintNumber(8);
    let first = args >> 4 & 0xf;
    let second = args & 0xf;
    return `s${first} s${second} PUSH2`;
})
CP0Auto.insertHex('540', 12, (slice) => {
    let args = slice.readUintNumber(12);
    let first = args >> 8 & 0xf;
    let second = args >> 4 & 0xf;
    let third = args & 0xf;
    return `s${first} s${second} s${third} XCHG3`;
});
CP0Auto.insertHex('541', 12, (slice) => {
    let args = slice.readUintNumber(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return `${i} ${j} ${k} XC2PU`;
});
CP0Auto.insertHex('542', 12, (slice) => {
    let args = slice.readUintNumber(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return `${i} ${j} ${k-1} XCPUXC`;
});
CP0Auto.insertHex('543', 12, (slice) => {
    let args = slice.readUintNumber(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return `${i} ${j} ${k} XCPU2`;
});
CP0Auto.insertHex('544', 12, (slice) => {
    let args = slice.readUintNumber(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return `${i} ${j-1} ${k-1} PUXC2`;
});
CP0Auto.insertHex('545', 12, (slice) => {
    let args = slice.readUintNumber(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return `${i} ${j-1} ${k-1} PUXCPU`;
});
CP0Auto.insertHex('546', 12, (slice) => {
    let args = slice.readUintNumber(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return `${i} ${j-1} ${k-2} PU2XC`;
});
CP0Auto.insertHex('547', 12, (slice) => {
    let args = slice.readUintNumber(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return `${i} ${j} ${k} PUSH3`;
});
// 5537792 (DUMMY)
CP0Auto.insertHex('55', 8, (slice) => {
    let args = slice.readUintNumber(8);
    let i = args >> 4 & 0xf;
    let j = args & 0xf; 
    return `${i+1} ${j+1} BLKSWAP`;
});
CP0Auto.insertHex('56', 8, (slice) => {
    let args = slice.readUintNumber(8);
    return `s${args} PUSH`;
});
CP0Auto.insertHex('57', 8, (slice) => {
    let args = slice.readUintNumber(8);
    return `s${args} POP`;
});
CP0Auto.insertHex('58', 8, 'ROT');
CP0Auto.insertHex('59', 8, 'ROTREV');
CP0Auto.insertHex('5a', 8, '2SWAP');
CP0Auto.insertHex('5b', 8, '2DROP');
CP0Auto.insertHex('5c', 8, '2DUP');
CP0Auto.insertHex('5d', 8, '2OVER');
CP0Auto.insertHex('5e', 8, (slice) => {
    let args = slice.readUintNumber(8);
    let i = args >> 4 & 0xf;
    let j = args & 0xf; 
    return `${i+2} ${j} REVERSE`;
});
CP0Auto.insertHex('5f', 8, (slice) => {
    let i = slice.readUintNumber(4);
    let j = slice.readUintNumber(4);
    if (i === 0) {
        return `${j} BLKDROP`;
    }
    return `${i} ${j} BLKPUSH`;
});
CP0Auto.insertHex('600000', 8, 'PICK');
CP0Auto.insertHex('610000', 8, 'ROLL');
CP0Auto.insertHex('620000', 8, 'ROLLREV');
CP0Auto.insertHex('630000', 8, 'BLKSWX');
CP0Auto.insertHex('640000', 8, 'REVX');
CP0Auto.insertHex('650000', 8, 'DROPX');
CP0Auto.insertHex('660000', 8, 'TUCK');
CP0Auto.insertHex('670000', 8, 'XCHGX');
CP0Auto.insertHex('680000', 8, 'DEPTH');
CP0Auto.insertHex('690000', 8, 'CHKDEPTH');
CP0Auto.insertHex('6a0000', 8, 'ONLYTOPX');
CP0Auto.insertHex('6b0000', 8, 'ONLYX');
// 7077888 (DUMMY)
CP0Auto.insertHex('6c', 8, (slice) => {
    let i = slice.readUintNumber(4);
    let j = slice.readUintNumber(4);
    return `${i} ${j} BLKDROP2`;
});
CP0Auto.insertHex('6d', 8, 'PUSHNULL');
CP0Auto.insertHex('6e', 8, 'ISNULL');
CP0Auto.insertHex('6f0', 12, (slice) => {
    let n = slice.readUintNumber(4);
    if (n === 0) {
        return `NIL`;
    }
    if (n === 1) {
        return `SINGLE`;
    }
    if (n === 2) {
        return `PAIR`;
    }
    if (n === 3) {
        return `TRIPLE`;
    }
    return `${n} TUPLE`;
});
CP0Auto.insertHex('6f1', 12, (slice) => {
    let k = slice.readUintNumber(4);
    return `${k} INDEX`;
});
CP0Auto.insertHex('6f2', 12, (slice) => {
    let k = slice.readUintNumber(4);
    return `${k} UNTUPLE`;
});
CP0Auto.insertHex('6f3', 12, (slice) => {
    let k = slice.readUintNumber(4);
    if (k === 0) {
        return `CHKTUPLE`;
    }
    return `${k} UNPACKFIRST`;
});
CP0Auto.insertHex('6f4', 12, (slice) => {
    let k = slice.readUintNumber(4);
    return `${k} EXPLODE`;
});
CP0Auto.insertHex('6f5', 12, (slice) => {
    let k = slice.readUintNumber(4);
    return `${k} SETINDEX`;
});
CP0Auto.insertHex('6f6', 12, (slice) => {
    let k = slice.readUintNumber(4);
    return `${k} INDEXQ`;
});
CP0Auto.insertHex('6f7', 12, (slice) => {
    let k = slice.readUintNumber(4);
    return `${k} SETINDEXQ`;
});
CP0Auto.insertHex('6f80', 16, 'TUPLEVAR');
CP0Auto.insertHex('6f81', 16, 'INDEXVAR');
CP0Auto.insertHex('6f82', 16, 'UNTUPLEVAR');
CP0Auto.insertHex('6f83', 16, 'UNPACKFIRSTVAR');
CP0Auto.insertHex('6f84', 16, 'EXPLODEVAR');
CP0Auto.insertHex('6f85', 16, 'SETINDEXVAR');
CP0Auto.insertHex('6f86', 16, 'INDEXVARQ');
CP0Auto.insertHex('6f87', 16, 'SETINDEXVARQ');
CP0Auto.insertHex('6f88', 16, 'TLEN');
CP0Auto.insertHex('6f89', 16, 'QTLEN');
CP0Auto.insertHex('6f8a', 16, 'ISTUPLE');
CP0Auto.insertHex('6f8b', 16, 'LAST');
CP0Auto.insertHex('6f8c', 16, 'TPUSH');
CP0Auto.insertHex('6f8d', 16, 'TPOP');
// 7310848 (DUMMY)
CP0Auto.insertHex('6fa0', 16, 'NULLSWAPIF');
CP0Auto.insertHex('6fa1', 16, 'NULLSWAPIFNOT');
CP0Auto.insertHex('6fa2', 16, 'NULLROTRIF');
CP0Auto.insertHex('6fa3', 16, 'NULLROTRIFNOT');
CP0Auto.insertHex('6fa4', 16, 'NULLSWAPIF2');
CP0Auto.insertHex('6fa5', 16, 'NULLSWAPIFNOT2');
CP0Auto.insertHex('6fa6', 16, 'NULLROTRIF2');
CP0Auto.insertHex('6fa7', 16, 'NULLROTRIFNOT2');
// 7317504 (DUMMY)
CP0Auto.insertHex('6fb', 12, (slice) => {
    let i = slice.readUintNumber(2);
    let j = slice.readUintNumber(2);
    return `${i} ${j} INDEX2`;
});
// CP0Auto.insertHex('6fc', 10, (slice) => {
//     let i = slice.readUintNumber(2);
//     let j = slice.readUintNumber(2);
//     let k = slice.readUintNumber(2);
//     return `${i} ${j} ${k} INDEX3`;
// });
CP0Auto.insertHex('7', 4, (slice) => {
    let args = slice.readIntNumber(4);
    return `${args} PUSHINT`;
});
CP0Auto.insertHex('80', 8, (slice) => {
    let x = slice.readIntNumber(8)
    return `${x} PUSHINT`;
})
CP0Auto.insertHex('81', 8, (slice) => {
    let x = slice.readIntNumber(16)
    return `${x} PUSHINT`;
})
CP0Auto.insertHex('82', 8, (slice) => {
    let len = slice.readUintNumber(5)
    let n = 8 * len + 19
    let x = slice.readIntNumber(n)
    return `${x} PUSHINT`;
})
CP0Auto.insertHex('83', 8, (slice) => {
    let x = slice.readUintNumber(8) + 1
    return `${x} PUSHPOW2`;
})
CP0Auto.insertHex('84', 8, (slice) => {
    let x = slice.readUintNumber(8) + 1;
    return `${x} PUSHPOW2DEC`;
})
CP0Auto.insertHex('850000', 8, (slice) => {
    let x = slice.readUintNumber(8) + 1;
    return `${x} PUSHNEGPOW2`;
});
// 8781824 (DUMMY)
CP0Auto.insertHex('88', 8, 'PUSHREF');
CP0Auto.insertHex('89', 8, 'PUSHREFSLICE');
CP0Auto.insertHex('8a', 8, 'PUSHREFCONT');
CP0Auto.insertHex('8b', 8, (slice) => {
    let x = slice.readUintNumber(4);
    let len = 8 * x + 4;
    let subslice = fetchSubslice(slice, len);
    return 'PUSHSLICE';
});
CP0Auto.insertHex('8c0000', 8, (slice) => {
    let r = slice.readUintNumber(2) + 1;
    let xx = slice.readUintNumber(5);
    let subslice = fetchSubslice(slice, 8 * xx + 1, r);
    return 'PUSHSLICE';
});
CP0Auto.insertHex('8d', 8, (slice) => {
    let r = slice.readUintNumber(3);
    let xx = slice.readUintNumber(7);
    let subslice = fetchSubslice(slice, 8 * xx + 6, r);
    return 'PUSHSLICE';
});
// 9281536 (DUMMY)
CP0Auto.insertHex('8E', 7, (slice, indent) => {
    let args = slice.readUintNumber(9);
    let refs = (args >> 7) & 3;
    let dataBytes = (args & 127) * 8;

    let subslice = fetchSubslice(slice, dataBytes, refs);
    // <{\n${decompile(slice.readRef(), indent + 2)}${new Array(indent).fill(' ').join('')}}> PUSHCONT`
    return `<{\n${decompile(subslice, indent + 2)}${new Array(indent).fill(' ').join('')}}> PUSHCONT`
})
CP0Auto.insertHex('9', 4, (slice, indent) => {
    let len = slice.readUintNumber(4) * 8;
    let subslice = fetchSubslice(slice, len);
    return `<{\n${decompile(subslice, indent + 2)}${new Array(indent).fill(' ').join('')}}> PUSHCONT`
})

CP0Auto.insertHex('a00000', 8, 'ADD');
CP0Auto.insertHex('a10000', 8, 'SUB');
CP0Auto.insertHex('a20000', 8, 'SUBR');
CP0Auto.insertHex('a30000', 8, 'NEGATE');
CP0Auto.insertHex('a40000', 8, 'INC');
CP0Auto.insertHex('a50000', 8, 'DEC');
CP0Auto.insertHex('a60000', 8, (slice) => {
    let x = slice.readIntNumber(8);
    return `${x} ADDCONST`;
});
CP0Auto.insertHex('a70000', 8, (slice) => {
    let x = slice.readIntNumber(8);
    return `${x} MULCONST`;
});
CP0Auto.insertHex('a80000', 8, 'MUL');
CP0Auto.insertHex('A9', 8, (slice) => {
    let m = slice.readBit();
    let s = slice.readUintNumber(2);
    let c = slice.readBit();
    let d = slice.readUintNumber(2);
    let f = slice.readUintNumber(2);
    let opName = '';
    if (m) {
        opName += 'MUL';
    }
    if (s == 0) {
        opName += 'DIV';
    } else {
        if (s == 1) {
            opName = 'RSHIFT';
        } else {
            opName = 'LSHIFT';
        }
        if (!c) {
            opName += ' s0';
        } else {
            let shift = slice.readUintNumber(8) + 1;
            opName += ` ${shift}`;
        }
    }
    if (d === 1) {
        opName += ' QOUT';
    } else if (d === 2) {
        opName += ' REM';
    } else if (d === 3) {
        opName += ' BOTH';
    }
    if (f === 1) {
        opName += ' R';
    } else if (f == 2) {
        opName += ' C';
    }
    return opName;
});
// 11079680 (DUMMY)
// 11132928 (DUMMY)
CP0Auto.insertHex('aa0000', 8, (slice) => {
    let cc = slice.readUintNumber(8);
    return `${cc+1} LSHIFT`;
});
CP0Auto.insertHex('ab0000', 8, (slice) => {
    let cc = slice.readUintNumber(8);
    return `${cc+1} RSHIFT`;
});
CP0Auto.insertHex('ac0000', 8, 'LSHIFT');
CP0Auto.insertHex('ad0000', 8, 'RSHIFT');
CP0Auto.insertHex('ae0000', 8, 'POW2');
// 11468800 (DUMMY)
CP0Auto.insertHex('b00000', 8, 'AND');
CP0Auto.insertHex('b10000', 8, 'OR');
CP0Auto.insertHex('b20000', 8, 'XOR');
CP0Auto.insertHex('b30000', 8, 'NOT');
CP0Auto.insertHex('b40000', 8, (slice) => {
    let cc = slice.readUintNumber(8);
    return `${cc+1} FITS`;
});
CP0Auto.insertHex('b50000', 8, (slice) => {
    let cc = slice.readUintNumber(8);
    return `${cc+1} UFITS`;
});
CP0Auto.insertHex('b60000', 16, 'FITSX');
CP0Auto.insertHex('b60100', 16, 'UFITSX');
CP0Auto.insertHex('b60200', 16, 'BITSIZE');
CP0Auto.insertHex('b60300', 16, 'UBITSIZE');
// 11928576 (DUMMY)
CP0Auto.insertHex('b60800', 16, 'MIN');
CP0Auto.insertHex('b60900', 16, 'MAX');
CP0Auto.insertHex('b60a00', 16, 'MINMAX');
CP0Auto.insertHex('b60b00', 16, 'ABS');
// 11930624 (DUMMY)
CP0Auto.insertHex('b7a000', 16, 'QADD');
CP0Auto.insertHex('b7a100', 16, 'QSUB');
CP0Auto.insertHex('b7a200', 16, 'QSUBR');
CP0Auto.insertHex('b7a300', 16, 'QNEGATE');
CP0Auto.insertHex('b7a400', 16, 'QINC');
CP0Auto.insertHex('b7a500', 16, 'QDEC');
CP0Auto.insertHex('b7a600', 16, (slice) => {
    let x = slice.readIntNumber(8);
    return `${x} QADDCONST`;
});
CP0Auto.insertHex('b7a700', 16, (slice) => {
    let x = slice.readIntNumber(8);
    return `${x} QMULCONST`;
});
CP0Auto.insertHex('b7a800', 16, 'QMUL');
CP0Auto.insertHex('b7a900', 16, (slice) => {
    let m = slice.readBit();
    let s = slice.readUintNumber(2);
    let c = slice.readBit();
    let d = slice.readUintNumber(2);
    let f = slice.readUintNumber(2);
    let opName = 'Q';
    if (m) {
        opName += 'MUL';
    }
    if (s == 0) {
        opName += 'DIV';
    } else {
        if (s == 1) {
            opName = 'RSHIFT';
        } else {
            opName = 'LSHIFT';
        }
        if (!c) {
            opName += ' s0';
        } else {
            let shift = slice.readUintNumber(8) + 1;
            opName += ` ${shift}`;
        }
    }
    if (d === 1) {
        opName += ' QOUT';
    } else if (d === 2) {
        opName += ' REM';
    } else if (d === 3) {
        opName += ' BOTH';
    }
    if (f === 1) {
        opName += ' R';
    } else if (f == 2) {
        opName += ' C';
    }
    return opName;
});
// 12036560 (DUMMY)
CP0Auto.insertHex('b7aa00', 16, (slice) => {
    let cc = slice.readUintNumber(8);
    return `${cc+1} QLSHIFT`;
});
CP0Auto.insertHex('b7ab00', 16, (slice) => {
    let cc = slice.readUintNumber(8);
    return `${cc+1} QLSHIFT`;
});
CP0Auto.insertHex('b7ac00', 16, 'QLSHIFT');
CP0Auto.insertHex('b7ad00', 16, 'QRSHIFT');
CP0Auto.insertHex('b7ae00', 16, 'QPOW2');
// 12037888 (DUMMY)
CP0Auto.insertHex('b7b000', 16, 'QAND');
CP0Auto.insertHex('b7b100', 16, 'QOR');
CP0Auto.insertHex('b7b200', 16, 'QXOR');
CP0Auto.insertHex('b7b300', 16, 'QNOT');
CP0Auto.insertHex('b7b400', 16, (slice) => {
    let cc = slice.readUintNumber(8);
    return `${cc+1} QFITS`;
});
CP0Auto.insertHex('b7b500', 16, (slice) => {
    let cc = slice.readUintNumber(8);
    return `${cc+1} QUFITS`;
});
CP0Auto.insertHex('b7b600', 24, 'QFITSX');
CP0Auto.insertHex('b7b601', 24, 'QUFITSX');
CP0Auto.insertHex('b7b602', 24, 'QBITSIZE');
CP0Auto.insertHex('b7b603', 24, 'QUBITSIZE');
// 12039684 (DUMMY)
CP0Auto.insertHex('b7b608', 24, 'QMIN');
CP0Auto.insertHex('b7b609', 24, 'QMAX');
CP0Auto.insertHex('b7b60a', 24, 'QMINMAX');
CP0Auto.insertHex('b7b60b', 24, 'QABS');
// 12039692 (DUMMY)
CP0Auto.insertHex('b7b800', 16, 'QSGN');
CP0Auto.insertHex('b7b900', 16, 'QLESS');
CP0Auto.insertHex('b7ba00', 16, 'QEQUAL');
CP0Auto.insertHex('b7bb00', 16, 'QLEQ');
CP0Auto.insertHex('b7bc00', 16, 'QGREATER');
CP0Auto.insertHex('b7bd00', 16, 'QNEQ');
CP0Auto.insertHex('b7be00', 16, 'QGEQ');
CP0Auto.insertHex('b7bf00', 16, 'QCMP');
CP0Auto.insertHex('b7c000', 16, (slice) => {
    let x = slice.readIntNumber(8);
    return `${x} QEQINT`;
});
CP0Auto.insertHex('b7c100', 16, (slice) => {
    let x = slice.readIntNumber(8);
    return `${x} QLESSINT`;
});
CP0Auto.insertHex('b7c200', 16, (slice) => {
    let x = slice.readIntNumber(8);
    return `${x} QGTINT`;
});
CP0Auto.insertHex('b7c300', 16, (slice) => {
    let x = slice.readIntNumber(8);
    return `${x} QNEQINT`;
});
// 12043264 (DUMMY)
CP0Auto.insertHex('b80000', 8, 'SGN');
CP0Auto.insertHex('b90000', 8, 'LESS');
CP0Auto.insertHex('ba0000', 8, 'EQUAL');
CP0Auto.insertHex('bb0000', 8, 'LEQ');
CP0Auto.insertHex('bc0000', 8, 'GREATER');
CP0Auto.insertHex('bd0000', 8, 'NEQ');
CP0Auto.insertHex('be0000', 8, 'GEQ');
CP0Auto.insertHex('bf0000', 8, 'CMP');
CP0Auto.insertHex('c00000', 8, (slice) => {
    let x = slice.readIntNumber(8);
    return `${x} EQINT`;
});
CP0Auto.insertHex('c10000', 8, (slice) => {
    let x = slice.readIntNumber(8);
    return `${x} LESSINT`;
});
CP0Auto.insertHex('c20000', 8, (slice) => {
    let x = slice.readIntNumber(8);
    return `${x} GTINT`;
});
CP0Auto.insertHex('c30000', 8, (slice) => {
    let x = slice.readIntNumber(8);
    return `${x} NEQINT`;
});
CP0Auto.insertHex('c40000', 8, 'ISNAN');
CP0Auto.insertHex('c50000', 8, 'CHKNAN');
// 12976128 (DUMMY)
CP0Auto.insertHex('c70000', 16, 'SEMPTY');
CP0Auto.insertHex('c70100', 16, 'SDEMPTY');
CP0Auto.insertHex('c70200', 16, 'SREMPTY');
CP0Auto.insertHex('c70300', 16, 'SDFIRST');
CP0Auto.insertHex('c70400', 16, 'SDLEXCMP');
CP0Auto.insertHex('c70500', 16, 'SDEQ');
// 13043200 (DUMMY)
CP0Auto.insertHex('c70800', 16, 'SDPFX');
CP0Auto.insertHex('c70900', 16, 'SDPFXREV');
CP0Auto.insertHex('c70a00', 16, 'SDPPFX');
CP0Auto.insertHex('c70b00', 16, 'SDPPFXREV');
CP0Auto.insertHex('c70c00', 16, 'SDSFX');
CP0Auto.insertHex('c70d00', 16, 'SDSFXREV');
CP0Auto.insertHex('c70e00', 16, 'SDPSFX');
CP0Auto.insertHex('c70f00', 16, 'SDPSFXREV');
CP0Auto.insertHex('c71000', 16, 'SDCNTLEAD0');
CP0Auto.insertHex('c71100', 16, 'SDCNTLEAD1');
CP0Auto.insertHex('c71200', 16, 'SDCNTTRAIL0');
CP0Auto.insertHex('c71300', 16, 'SDCNTTRAIL1');
// 13046784 (DUMMY)
CP0Auto.insertHex('c80000', 8, 'NEWC');
CP0Auto.insertHex('c90000', 8, 'ENDC');
CP0Auto.insertHex('ca0000', 8, (slice) => {
    let cc = slice.readUintNumber(8) + 1;
    return `${cc+1} STI`;
});
CP0Auto.insertHex('cb0000', 8, (slice) => {
    let cc = slice.readUintNumber(8) + 1;
    return `${cc+1} STU`;
});
CP0Auto.insertHex('cc0000', 8, 'STREF');
CP0Auto.insertHex('cd0000', 8, 'ENDCST');
CP0Auto.insertHex('ce0000', 8, 'STSLICE');
CP0Auto.insertHex('cf0000', 13, (slice) => {
    let args = slice.readUintNumber(3);
    let sgnd = !(args & 1);
    let s = "ST";
    s += sgnd ? 'I' : 'U';
    s += 'X';
    if (args & 2) {
        s += 'R';
    }
    if (args & 4) {
        s += 'Q';
    }
    return s;
});
CP0Auto.insertHex('cf0800', 13, (slice) => {
    let args = slice.readUintNumber(11);
    let bits = (args & 0xff) + 1;
    let sgnd = !(args & 0x100);
    let s = "ST";
    s += (sgnd ? 'I' : 'U');
    if (args & 0x200) {
        s += 'R';
    }
    if (args & 0x400) {
        s += 'Q';
    }
    return `${bits} ${s}`;
});
CP0Auto.insertHex('cf1000', 16, 'STREF');
CP0Auto.insertHex('cf1100', 16, 'STBREF');
CP0Auto.insertHex('cf1200', 16, 'STSLICE');
CP0Auto.insertHex('cf1300', 16, 'STB');
CP0Auto.insertHex('cf1400', 16, 'STREFR');
CP0Auto.insertHex('cf1500', 16, 'STBREFR');
CP0Auto.insertHex('cf1600', 16, 'STSLICER');
CP0Auto.insertHex('cf1700', 16, 'STBR');
CP0Auto.insertHex('cf1800', 16, 'STREFQ');
CP0Auto.insertHex('cf1900', 16, 'STBREFQ');
CP0Auto.insertHex('cf1a00', 16, 'STSLICEQ');
CP0Auto.insertHex('cf1b00', 16, 'STBQ');
CP0Auto.insertHex('cf1c00', 16, 'STREFRQ');
CP0Auto.insertHex('cf1d00', 16, 'STBREFRQ');
CP0Auto.insertHex('cf1e00', 16, 'STSLICERQ');
CP0Auto.insertHex('cf1f00', 16, 'STBRQ');
CP0Auto.insertHex('cf2000', 15, (slice) => {
    let flag = slice.readUintNumber(1);
    if (flag === 0) {
        return 'STREFCONST';
    } else {
        return 'STREF2CONST';
    }
});
// 13574656 (DUMMY)
CP0Auto.insertHex('cf2300', 16, 'ENDXC');
// 13575168 (DUMMY)
CP0Auto.insertHex('cf2800', 14, (slice) => {
    let args = slice.readUintNumber(2);
    let sgnd = !(args & 1);
    return `ST${(sgnd ? 'I' : 'U')}LE${((args & 2) ? '8' : '4')}`;
});
// 13577216 (DUMMY)
CP0Auto.insertHex('cf3000', 16, 'BDEPTH');
CP0Auto.insertHex('cf3100', 16, 'BBITS');
CP0Auto.insertHex('cf3200', 16, 'BREFS');
CP0Auto.insertHex('cf3300', 16, 'BBITREFS');
// 13579264 (DUMMY)
CP0Auto.insertHex('cf3500', 16, 'BREMBITS');
CP0Auto.insertHex('cf3600', 16, 'BREMREFS');
CP0Auto.insertHex('cf3700', 16, 'BREMBITREFS');
CP0Auto.insertHex('cf3800', 16, (slice) => {
    let cc = slice.readUintNumber(8);
    return `${cc+1} BCHKBITS`;
});
CP0Auto.insertHex('cf3900', 16, 'BCHKBITS');
CP0Auto.insertHex('cf3a00', 16, 'BCHKREFS');
CP0Auto.insertHex('cf3b00', 16, 'BCHKBITREFS');
CP0Auto.insertHex('cf3c00', 16, (slice) => {
    let cc = slice.readUintNumber(8);
    return `${cc+1} BCHKBITSQ`;
});
CP0Auto.insertHex('cf3d00', 16, 'BCHKBITSQ');
CP0Auto.insertHex('cf3e00', 16, 'BCHKREFSQ');
CP0Auto.insertHex('cf3f00', 16, 'BCHKBITREFSQ');
CP0Auto.insertHex('cf4000', 16, 'STZEROES');
CP0Auto.insertHex('cf4100', 16, 'STONES');
CP0Auto.insertHex('cf4200', 16, 'STSAME');
// 13583104 (DUMMY)
CP0Auto.insertHex('cf8000', 9, (slice) => {
    let refs = slice.readUintNumber(2);
    let dataBits = slice.readUintNumber(3) * 8 + 1;
    let subslice = fetchSubslice(slice, dataBits, refs);
    return `STSLICECONST`;
});
CP0Auto.insertHex('d00000', 8, 'CTOS');
CP0Auto.insertHex('d10000', 8, 'ENDS');
CP0Auto.insertHex('d20000', 8, (slice) => {
    let cc = slice.readUintNumber(8);
    return `${cc+1} LDI`;
});
CP0Auto.insertHex('d30000', 8, (slice) => {
    let cc = slice.readUintNumber(8);
    return `${cc+1} LDU`;
});
CP0Auto.insertHex('d40000', 8, 'LDREF');
CP0Auto.insertHex('d50000', 8, 'LDREFRTOS');
CP0Auto.insertHex('d60000', 8, (slice) => {
    let cc = slice.readUintNumber(8);
    return `${cc+1} LDSLICE`;
});
CP0Auto.insertHex('d70', 12, (slice) => {
    let longerVersion = slice.readBit();
    let quiet = slice.readBit();
    let preload = slice.readBit();
    let sign = slice.readBit();

    return `${longerVersion ? ((slice.readUintNumber(8) + 1) + ' ') : ''}${preload ? 'PLD' : 'LD'}${sign ? 'U' : 'I'}${quiet ? 'Q' : ''}`;
});
CP0Auto.insertHex('d71000', 13, (slice) => {
    let args = slice.readUintNumber(3); // TODO
    return '(FIXED 709)';
});
CP0Auto.insertHex('d71800', 14, (slice) => {
    let quiet = slice.readBit();
    let preload = slice.readBit();
    return `${preload ? 'PLD' : 'LD'}SLICEX${quiet ? 'Q' : ''}`;
});
CP0Auto.insertHex('d71c00', 14, (slice) => {
    let quiet = slice.readBit();
    let preload = slice.readBit();
    let cc = slice.readUintNumber(8);
    return `${cc+1} ${preload ? 'PLD' : 'LD'}SLICEX${quiet ? 'Q' : ''}`;
});
CP0Auto.insertHex('d72000', 16, 'SDCUTFIRST');
CP0Auto.insertHex('d72100', 16, 'SDSKIPFIRST');
CP0Auto.insertHex('d72200', 16, 'SDCUTLAST');
CP0Auto.insertHex('d72300', 16, 'SDSKIPLAST');
CP0Auto.insertHex('d72400', 16, 'SDSUBSTR');
// 14099712 (DUMMY)
CP0Auto.insertHex('d72600', 16, 'SDBEGINSX');
CP0Auto.insertHex('d72700', 16, 'SDBEGINSXQ');
CP0Auto.insertHex('d72800', 13, (slice) => {
    let args = slice.readUintNumber(8);
    return 'SDBEGINS';
});
CP0Auto.insertHex('d73000', 16, 'SCUTFIRST');
CP0Auto.insertHex('d73100', 16, 'SSKIPFIRST');
CP0Auto.insertHex('d73200', 16, 'SCUTLAST');
CP0Auto.insertHex('d73300', 16, 'SSKIPLAST');
CP0Auto.insertHex('d73400', 16, 'SUBSLICE');
// 14103808 (DUMMY)
CP0Auto.insertHex('d73600', 16, 'SPLIT');
CP0Auto.insertHex('d73700', 16, 'SPLITQ');
// 14104576 (DUMMY)
CP0Auto.insertHex('d73900', 16, 'XCTOS');
CP0Auto.insertHex('d73a00', 16, 'XLOAD');
CP0Auto.insertHex('d73b00', 16, 'XLOADQ');
// 14105600 (DUMMY)
CP0Auto.insertHex('d74100', 16, 'SCHKBITS');
CP0Auto.insertHex('d74200', 16, 'SCHKREFS');
CP0Auto.insertHex('d74300', 16, 'SCHKBITREFS');
// 14107648 (DUMMY)
CP0Auto.insertHex('d74500', 16, 'SCHKBITSQ');
CP0Auto.insertHex('d74600', 16, 'SCHKREFSQ');
CP0Auto.insertHex('d74700', 16, 'SCHKBITREFSQ');
CP0Auto.insertHex('d74800', 16, 'PLDREFVAR');
CP0Auto.insertHex('d74900', 16, 'SBITS');
CP0Auto.insertHex('d74a00', 16, 'SREFS');
CP0Auto.insertHex('d74b00', 16, 'SBITREFS');
CP0Auto.insertHex('d74c00', 14, (slice) => {
    let n = slice.readUintNumber(2);
    return `${n} PLDREFIDX`;
});
CP0Auto.insertHex('d75000', 12, (slice) => {
    let quiet = slice.readBit();
    let preload = slice.readBit();
    let bit64 = slice.readBit();
    let unsigned = slice.readBit();
    return `${preload ? 'PLD' : 'LD'}${unsigned ? 'U' : 'I'}LE${bit64 ? '8' : '4'}${quiet ? 'Q' : ''}`;
});
CP0Auto.insertHex('d76000', 16, 'LDZEROES');
CP0Auto.insertHex('d76100', 16, 'LDONES');
CP0Auto.insertHex('d76200', 16, 'LDSAME');
// 14115584 (DUMMY)
CP0Auto.insertHex('d76400', 16, 'SDEPTH');
CP0Auto.insertHex('d76500', 16, 'CDEPTH');
// 14116352 (DUMMY)
CP0Auto.insertHex('d80000', 8, 'EXECUTE');
CP0Auto.insertHex('d90000', 8, 'JMPX');
CP0Auto.insertHex('da0000', 8, (slice) => {
    let p = slice.readUintNumber(4);
    let r = slice.readUintNumber(4);
    return `${p} ${r} CALLXARGS`;
});
CP0Auto.insertHex('db0000', 12, (slice) => {
    let p = slice.readUintNumber(4);
    return `${p} CALLXARGS`;
});
CP0Auto.insertHex('db1000', 12, (slice) => {
    let p = slice.readUintNumber(4);
    return `${p} JMPXARGS`;
});
CP0Auto.insertHex('db2000', 12, (slice) => {
    let r = slice.readUintNumber(4);
    return `${r} RETARGS`;
});
CP0Auto.insertHex('db3000', 16, 'RET');
CP0Auto.insertHex('db3100', 16, 'RETALT');
CP0Auto.insertHex('db3200', 16, 'RETBOOL');
// 14365440 (DUMMY)
CP0Auto.insertHex('db3400', 16, 'CALLCC');
CP0Auto.insertHex('db3500', 16, 'JMPXDATA');
CP0Auto.insertHex('db3600', 16, (slice) => {
    let p = slice.readUintNumber(4);
    let r = slice.readUintNumber(4);
    return `${p} ${r} CALLCCARGS`;
});
// 14366464 (DUMMY)
CP0Auto.insertHex('db3800', 16, 'CALLXVARARGS');
CP0Auto.insertHex('db3900', 16, 'RETVARARGS');
CP0Auto.insertHex('db3a00', 16, 'JMPXVARARGS');
CP0Auto.insertHex('db3b00', 16, 'CALLCCVARARGS');
CP0Auto.insertHex('db3c00', 16, (slice) => {
    slice.readRef();
    return 'CALLREF';
});
CP0Auto.insertHex('db3d00', 16, (slice) => {
    slice.readRef();
    return 'JMPREF';
});
CP0Auto.insertHex('db3e00', 16, (slice) => {
    slice.readRef();
    return 'JMPREFDATA';
});
CP0Auto.insertHex('db3f00', 16, 'RETDATA');
// 14368768 (DUMMY)
CP0Auto.insertHex('dc0000', 8, 'IFRET');
CP0Auto.insertHex('dd0000', 8, 'IFNOTRET');
CP0Auto.insertHex('de', 8, 'IF');
CP0Auto.insertHex('df', 8, 'IFNOT');
CP0Auto.insertHex('e00000', 8, 'IFJMP');
CP0Auto.insertHex('e10000', 8, 'IFNOTJMP');
CP0Auto.insertHex('e20000', 8, 'IFELSE');
CP0Auto.insertHex('e30000', 16, (slice) => {
    slice.readRef();
    return 'IFREF';
});
CP0Auto.insertHex('e30100', 16, (slice) => {
    slice.readRef();
    return 'IFNOTREF';
});
CP0Auto.insertHex('e30200', 16, (slice) => {
    slice.readRef();
    return 'IFJMPREF';
});
CP0Auto.insertHex('e30300', 16, (slice) => {
    slice.readRef();
    return 'IFNOTJMPREF';
});
CP0Auto.insertHex('e30400', 16, 'CONDSEL');
CP0Auto.insertHex('e30500', 16, 'CONDSELCHK');
// 14878208 (DUMMY)
CP0Auto.insertHex('e30800', 16, 'IFRETALT');
CP0Auto.insertHex('e30900', 16, 'IFNOTRETALT');
// 14879232 (DUMMY)
CP0Auto.insertHex('e30d00', 16, (slice) => {
    slice.readRef();
    return 'IFREFELSE';
});
CP0Auto.insertHex('e30e00', 16, (slice) => {
    slice.readRef();
    return 'IFELSEREF';
});
CP0Auto.insertHex('e30f00', 16, (slice) => {
    slice.readRef();
    slice.readRef();
    return 'IFREFELSEREF';
});
// 14880768 (DUMMY)
CP0Auto.insertHex('e31400', 16, 'REPEATBRK');
CP0Auto.insertHex('e31500', 16, 'REPEATENDBRK');
CP0Auto.insertHex('e31600', 16, 'UNTILBRK');
CP0Auto.insertHex('e31700', 16, 'UNTILENDBRK');
CP0Auto.insertHex('e31800', 16, 'WHILEBRK');
CP0Auto.insertHex('e31900', 16, 'WHILEENDBRK');
CP0Auto.insertHex('e31a00', 16, 'AGAINBRK');
CP0Auto.insertHex('e31b00', 16, 'AGAINENDBRK');
// 14883840 (DUMMY)
CP0Auto.insertHex('e38000', 10, (slice) => {
    let args = slice.readUintNumber(6);
    return '(FIXED 879)';
});
CP0Auto.insertHex('e3c000', 10, (slice) => {
    let args = slice.readUintNumber(6);
    return '(EXT)';
});
CP0Auto.insertHex('e40000', 8, 'REPEAT');
CP0Auto.insertHex('e50000', 8, 'REPEATEND');
CP0Auto.insertHex('e60000', 8, 'UNTIL');
CP0Auto.insertHex('e70000', 8, 'UNTILEND');
CP0Auto.insertHex('e80000', 8, 'WHILE');
CP0Auto.insertHex('e90000', 8, 'WHILEEND');
CP0Auto.insertHex('ea0000', 8, 'AGAIN');
CP0Auto.insertHex('eb0000', 8, 'AGAINEND');
CP0Auto.insertHex('ec0000', 8, (slice) => {
    let args = slice.readUintNumber(8);
    return '(FIXED 895)';
});
CP0Auto.insertHex('ed0000', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 899)';
});
CP0Auto.insertHex('ed1000', 16, 'RETURNVARARGS');
CP0Auto.insertHex('ed1100', 16, 'SETCONTVARARGS');
CP0Auto.insertHex('ed1200', 16, 'SETNUMVARARGS');
// 15536896 (DUMMY)
CP0Auto.insertHex('ed1e00', 16, 'BLESS');
CP0Auto.insertHex('ed1f00', 16, 'BLESSVARARGS');
// 15540224 (DUMMY)
CP0Auto.insertHex('ed4', 12, (slice) => {
    let n = slice.readUintNumber(4);
    return `c${n} PUSH`;
});
CP0Auto.insertHex('ed5', 12, (slice) => {
    let x = slice.readUintNumber(4);
    return `c${x} POP`;
});
// 15554560 (DUMMY)
CP0Auto.insertHex('ed6000', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 919)';
});
CP0Auto.insertHex('ed6400', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 923)';
});
// 15558144 (DUMMY)
CP0Auto.insertHex('ed6700', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 928)';
});
// 15558656 (DUMMY)
CP0Auto.insertHex('ed7000', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 933)';
});
CP0Auto.insertHex('ed7400', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 937)';
});
// 15562240 (DUMMY)
CP0Auto.insertHex('ed7700', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 942)';
});
// 15562752 (DUMMY)
CP0Auto.insertHex('ed8000', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 947)';
});
CP0Auto.insertHex('ed8400', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 951)';
});
// 15566336 (DUMMY)
CP0Auto.insertHex('ed8700', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 956)';
});
// 15566848 (DUMMY)
CP0Auto.insertHex('ed9000', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 961)';
});
CP0Auto.insertHex('ed9400', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 965)';
});
// 15570432 (DUMMY)
CP0Auto.insertHex('ed9700', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 970)';
});
// 15570944 (DUMMY)
CP0Auto.insertHex('eda000', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 975)';
});
CP0Auto.insertHex('eda400', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 979)';
});
// 15574528 (DUMMY)
CP0Auto.insertHex('eda700', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 984)';
});
// 15575040 (DUMMY)
CP0Auto.insertHex('edb000', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 989)';
});
CP0Auto.insertHex('edb400', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 993)';
});
// 15578624 (DUMMY)
CP0Auto.insertHex('edb700', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 998)';
});
// 15579136 (DUMMY)
CP0Auto.insertHex('edc000', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 1003)';
});
CP0Auto.insertHex('edc400', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 1007)';
});
// 15582720 (DUMMY)
CP0Auto.insertHex('edc700', 12, (slice) => {
    let args = slice.readUintNumber(4);
    return '(FIXED 1012)';
});
// 15583232 (DUMMY)
CP0Auto.insertHex('ede000', 16, 'PUSHCTRX');
CP0Auto.insertHex('ede100', 16, 'POPCTRX');
CP0Auto.insertHex('ede200', 16, 'SETCONTCTRX');
// 15590144 (DUMMY)
CP0Auto.insertHex('edf000', 16, 'BOOLAND');
CP0Auto.insertHex('edf100', 16, 'BOOLOR');
CP0Auto.insertHex('edf200', 16, 'COMPOSBOTH');
CP0Auto.insertHex('edf300', 16, 'ATEXIT');
CP0Auto.insertHex('edf400', 16, 'ATEXITALT');
CP0Auto.insertHex('edf500', 16, 'SETEXITALT');
CP0Auto.insertHex('edf600', 16, 'THENRET');
CP0Auto.insertHex('edf700', 16, 'THENRETALT');
CP0Auto.insertHex('edf800', 16, 'INVERT');
CP0Auto.insertHex('edf900', 16, 'BOOLEVAL');
CP0Auto.insertHex('edfa00', 16, 'SAMEALT');
CP0Auto.insertHex('edfb00', 16, 'SAMEALTSAVE');
// 15596544 (DUMMY)
CP0Auto.insertHex('ee0000', 8, (slice) => {
    let args = slice.readUintNumber(8);
    return '(FIXED 1034)';
});
// 15663104 (DUMMY)
CP0Auto.insertHex('f00000', 8, (slice) => {
    let args = slice.readUintNumber(8);
    return '(FIXED 1039)';
});
CP0Auto.insertHex('f10000', 10, (slice) => {
    let args = slice.readUintNumber(14);
    return '(FIXED 1043)';
});
CP0Auto.insertHex('f14000', 10, (slice) => {
    let args = slice.readUintNumber(14);
    return '(FIXED 1047)';
});
CP0Auto.insertHex('f18000', 10, (slice) => {
    let args = slice.readUintNumber(14);
    return '(FIXED 1051)';
});
// 15843328 (DUMMY)
CP0Auto.insertHex('f20000', 10, (slice) => {
    let args = slice.readUintNumber(6);
    return '(FIXED 1056)';
});
CP0Auto.insertHex('F24', 10, (slice) => {
    let eCode = slice.readUint(6)
    return `${eCode} THROWIF`
})
CP0Auto.insertHex('F28', 10, (slice) => {
    let eCode = slice.readUint(6)
    return `${eCode} THROWIFNOT`
})
CP0Auto.insertHex('f2c000', 13, (slice) => {
    let args = slice.readUintNumber(11);
    return '(FIXED 1068)';
});
CP0Auto.insertHex('f2c800', 13, (slice) => {
    let x = slice.readUintNumber(11);
    return `${x} THROWARG`;
});
CP0Auto.insertHex('f2d000', 13, (slice) => {
    let args = slice.readUintNumber(11);
    return '(FIXED 1076)';
});
CP0Auto.insertHex('f2d800', 13, (slice) => {
    let args = slice.readUintNumber(11);
    return '(FIXED 1080)';
});
CP0Auto.insertHex('f2e000', 13, (slice) => {
    let args = slice.readUintNumber(11);
    return '(FIXED 1084)';
});
CP0Auto.insertHex('f2e800', 13, (slice) => {
    let args = slice.readUintNumber(11);
    return '(FIXED 1088)';
});
CP0Auto.insertHex('f2f000', 13, (slice) => {
    let args = slice.readUintNumber(3);
    return '(FIXED 1092)';
});
// 15922688 (DUMMY)
CP0Auto.insertHex('f2ff00', 16, 'TRY');
CP0Auto.insertHex('f30000', 8, (slice) => {
    let args = slice.readUintNumber(8);
    return '(FIXED 1098)';
});
CP0Auto.insertHex('f40000', 16, 'STDICT');
CP0Auto.insertHex('f40100', 16, 'SKIPDICT');
CP0Auto.insertHex('f40200', 16, 'LDDICTS');
CP0Auto.insertHex('f40300', 16, 'PLDDICTS');
CP0Auto.insertHex('f40400', 16, 'LDDICT');
CP0Auto.insertHex('f40500', 16, 'PLDDICT');
CP0Auto.insertHex('f40600', 16, 'LDDICTQ');
CP0Auto.insertHex('f40700', 16, 'PLDDICTQ');
// 15992832 (DUMMY)
CP0Auto.insertHex('f40a00', 13, (slice) => {
    let args = slice.readUintNumber(3);
    return '(FIXED 1111)';
});
// 15994880 (DUMMY)
CP0Auto.insertHex('f41200', 13, (slice) => {
    let args = slice.readUintNumber(3);
    return '(FIXED 1116)';
});
// 15996928 (DUMMY)
CP0Auto.insertHex('f41a00', 13, (slice) => {
    let args = slice.readUintNumber(3);
    return '(FIXED 1121)';
});
// 15998976 (DUMMY)
CP0Auto.insertHex('f42200', 13, (slice) => {
    let args = slice.readUintNumber(3);
    return '(FIXED 1126)';
});
// 16001024 (DUMMY)
CP0Auto.insertHex('f42a00', 13, (slice) => {
    let args = slice.readUintNumber(3);
    return '(FIXED 1131)';
});
// 16003072 (DUMMY)
CP0Auto.insertHex('f43200', 13, (slice) => {
    let args = slice.readUintNumber(3);
    return '(FIXED 1136)';
});
// 16005120 (DUMMY)
CP0Auto.insertHex('f43a00', 13, (slice) => {
    let args = slice.readUintNumber(3);
    return '(FIXED 1141)';
});
// 16007168 (DUMMY)
CP0Auto.insertHex('f44100', 14, (slice) => {
    let args = slice.readUintNumber(2);
    return '(FIXED 1146)';
});
// 16008192 (DUMMY)
CP0Auto.insertHex('f44500', 14, (slice) => {
    let args = slice.readUintNumber(2);
    return '(FIXED 1151)';
});
// 16009216 (DUMMY)
CP0Auto.insertHex('f44900', 14, (slice) => {
    let args = slice.readUintNumber(2);
    return '(FIXED 1156)';
});
// 16010240 (DUMMY)
CP0Auto.insertHex('f44d00', 14, (slice) => {
    let args = slice.readUintNumber(2);
    return '(FIXED 1161)';
});
// 16011264 (DUMMY)
CP0Auto.insertHex('f45100', 14, (slice) => {
    let args = slice.readUintNumber(2);
    return '(FIXED 1166)';
});
// 16012288 (DUMMY)
CP0Auto.insertHex('f45500', 14, (slice) => {
    let args = slice.readUintNumber(2);
    return '(FIXED 1171)';
});
// 16013312 (DUMMY)
CP0Auto.insertHex('f45900', 14, (slice) => {
    let args = slice.readUintNumber(2);
    return '(FIXED 1176)';
});
// 16014336 (DUMMY)
CP0Auto.insertHex('f46200', 13, (slice) => {
    let args = slice.readUintNumber(3);
    return '(FIXED 1181)';
});
// 16017408 (DUMMY)
CP0Auto.insertHex('f46900', 14, (slice) => {
    let args = slice.readUintNumber(2);
    return '(FIXED 1186)';
});
// 16018432 (DUMMY)
CP0Auto.insertHex('f46d00', 14, (slice) => {
    let args = slice.readUintNumber(2);
    return '(FIXED 1191)';
});
CP0Auto.insertHex('f47', 12, (slice) => {
    let args = slice.readUintNumber(4);
    if (args === 0) {
        return 'PFXDICTSET';
    } else if (args === 1) {
        return 'PFXDICTREPLACE';
    } else if (args === 2) {
        return 'PFXDICTADD';
    } else if (args === 3) {
        return 'PFXDICTDEL';
    } else {
    }
    let res = "DICT";
    if (args & 8) {
        res += ((args & 4) ? 'U' : 'I');
    }
    return `DICT${(args & 4) ? 'U' : 'I'}GET${(args & 2) ? 'PREV' : 'NEXT'}${(args & 1) ? 'EQ' : ''}`; 
});
// 16023552 (DUMMY)
CP0Auto.insertHex('f48200', 11, (slice) => {
    let args = slice.readUintNumber(5);
    return '(FIXED 1214)';
});
// 16025600 (DUMMY)
CP0Auto.insertHex('f48a00', 11, (slice) => {
    let args = slice.readUintNumber(5);
    return '(FIXED 1219)';
});
// 16027648 (DUMMY)
CP0Auto.insertHex('f49200', 11, (slice) => {
    let args = slice.readUintNumber(5);
    return '(FIXED 1224)';
});
// 16029696 (DUMMY)
CP0Auto.insertHex('f49a00', 11, (slice) => {
    let args = slice.readUintNumber(5);
    return '(FIXED 1229)';
});
CP0Auto.insertHex('f4a000', 13, (slice, indent) => {
    let push = slice.readBit();
    if (push) { // f4a4
        let subslice = fetchSubslice(slice, 0, 1);
        let keyLen = slice.readUintNumber(10);
        let decompiled: string
        try {
            decompiled = decompileMethodsMap(subslice.clone(), keyLen, indent)
        } catch {
            decompiled = subslice.toCell().bits.toFiftHex();
        }
        return `${decompiled} ${keyLen} DICTPUSHCONST`;
    }
    let exec = slice.readBit();
    let usign = slice.readBit();
    return `DICT${usign ? 'U' : 'I'}GET${exec ? 'EXEC' : 'JMP'}`;
});
CP0Auto.insertHex('f4a800', 16, 'PFXDICTGETQ');
CP0Auto.insertHex('f4a900', 16, 'PFXDICTGET');
CP0Auto.insertHex('f4aa00', 16, 'PFXDICTGETJMP');
CP0Auto.insertHex('f4ab00', 16, 'PFXDICTGETEXEC');
// CP0Auto.insertHex('f4ac00', 13, (slice) => {
//     let args = slice.readUintNumber(11);
//     return '(EXT)';
// });
// 16035840 (DUMMY)
CP0Auto.insertHex('f4b100', 13, (slice) => {
    let args = slice.readUintNumber(3);
    return '(FIXED 1259)';
});
// 16036864 (DUMMY)
CP0Auto.insertHex('f4b500', 13, (slice) => {
    let args = slice.readUintNumber(3);
    return '(FIXED 1264)';
});
// 16037888 (DUMMY)
CP0Auto.insertHex('f4bc00', 14, (slice) => {
    let exec = slice.readBit();
    let unsigned = slice.readBit();
    return `DICT${unsigned ? 'U' : 'I'}GET${exec ? 'EXEC' : 'JMP'}Z`;
});
// 16039936 (DUMMY)
CP0Auto.insertHex('f80000', 16, 'ACCEPT');
CP0Auto.insertHex('f80100', 16, 'SETGASLIMIT');
// 16253440 (DUMMY)
CP0Auto.insertHex('f80f00', 16, 'COMMIT');
CP0Auto.insertHex('f81000', 16, 'RANDU256');
CP0Auto.insertHex('f81100', 16, 'RAND');
// 16257536 (DUMMY)
CP0Auto.insertHex('f81400', 16, 'SETRAND');
CP0Auto.insertHex('f81500', 16, 'ADDRAND');
// 16258560 (DUMMY)
// CP0Auto.insertHex('f82000', 12, (slice) => {
//     let args = slice.readUintNumber(4);
//     return '(FIXED 1285)';
// });
CP0Auto.insertHex('f82300', 16, 'NOW');
CP0Auto.insertHex('f82400', 16, 'BLOCKLT');
CP0Auto.insertHex('f82500', 16, 'LTIME');
CP0Auto.insertHex('f82600', 16, 'RANDSEED');
CP0Auto.insertHex('f82700', 16, 'BALANCE');
CP0Auto.insertHex('f82800', 16, 'MYADDR');
CP0Auto.insertHex('f82900', 16, 'CONFIGROOT');
// CP0Auto.insertHex('f82a00', 12, (slice) => {
//     let args = slice.readUintNumber(4);
//     return '(FIXED 1296)';
// });
CP0Auto.insertHex('f83000', 16, 'CONFIGDICT');
// 16265472 (DUMMY)
CP0Auto.insertHex('f83200', 16, 'CONFIGPARAM');
CP0Auto.insertHex('f83300', 16, 'CONFIGOPTPARAM');
// 16266240 (DUMMY)
CP0Auto.insertHex('f84000', 16, 'GETGLOBVAR');
// CP0Auto.insertHex('f84100', 11, (slice) => {
//     let args = slice.readUintNumber(5);
//     return '(FIXED 1306)';
// });
CP0Auto.insertHex('f86000', 16, 'SETGLOBVAR');
// CP0Auto.insertHex('f86100', 11, (slice) => {
//     let args = slice.readUintNumber(5);
//     return '(FIXED 1311)';
// });
// 16285696 (DUMMY)
CP0Auto.insertHex('f90000', 16, 'HASHCU');
CP0Auto.insertHex('f90100', 16, 'HASHSU');
CP0Auto.insertHex('f90200', 16, 'SHA256U');
// 16319232 (DUMMY)
CP0Auto.insertHex('f91000', 16, 'CHKSIGNU');
CP0Auto.insertHex('f91100', 16, 'CHKSIGNS');
// 16323072 (DUMMY)
CP0Auto.insertHex('f94000', 16, 'CDATASIZEQ');
CP0Auto.insertHex('f94100', 16, 'CDATASIZE');
CP0Auto.insertHex('f94200', 16, 'SDATASIZEQ');
CP0Auto.insertHex('f94300', 16, 'SDATASIZE');
// 16335872 (DUMMY)
CP0Auto.insertHex('fa0000', 16, 'LDGRAMS');
CP0Auto.insertHex('fa0100', 16, 'LDVARINT16');
CP0Auto.insertHex('fa0200', 16, 'STGRAMS');
CP0Auto.insertHex('fa0300', 16, 'STVARINT16');
CP0Auto.insertHex('fa0400', 16, 'LDVARUINT32');
CP0Auto.insertHex('fa0500', 16, 'LDVARINT32');
CP0Auto.insertHex('fa0600', 16, 'STVARUINT32');
CP0Auto.insertHex('fa0700', 16, 'STVARINT32');
// 16386048 (DUMMY)
CP0Auto.insertHex('fa4000', 16, 'LDMSGADDR');
CP0Auto.insertHex('fa4100', 16, 'LDMSGADDRQ');
CP0Auto.insertHex('fa4200', 16, 'PARSEMSGADDR');
CP0Auto.insertHex('fa4300', 16, 'PARSEMSGADDRQ');
CP0Auto.insertHex('fa4400', 16, 'REWRITESTDADDR');
CP0Auto.insertHex('fa4500', 16, 'REWRITESTDADDRQ');
CP0Auto.insertHex('fa4600', 16, 'REWRITEVARADDR');
CP0Auto.insertHex('fa4700', 16, 'REWRITEVARADDRQ');
// 16402432 (DUMMY)
CP0Auto.insertHex('fb0000', 16, 'SENDRAWMSG');
// 16449792 (DUMMY)
CP0Auto.insertHex('fb0200', 16, 'RAWRESERVE');
CP0Auto.insertHex('fb0300', 16, 'RAWRESERVEX');
CP0Auto.insertHex('fb0400', 16, 'SETCODE');
// 16450816 (DUMMY)
CP0Auto.insertHex('fb0600', 16, 'SETLIBCODE');
CP0Auto.insertHex('fb0700', 16, 'CHANGELIB');
// 16451584 (DUMMY)
CP0Auto.insertHex('fe0000', 8, (slice) => {
    let args = slice.readUintNumber(8);
    return '(FIXED 1355)';
});
// CP0Auto.insertHex('fef000', 12, (slice) => {
//     let args = slice.readUintNumber(4);
//     return '(EXT)';
// });
CP0Auto.insertHex('ff0000', 8, (slice) => {
    let args = slice.readUintNumber(8);
    return '(FIXED 1363)';
});
// CP0Auto.insertHex('fff000', 16, 'SETCPX');
// CP0Auto.insertHex('fff100', 8, (slice) => {
//     let args = slice.readUintNumber(8);
//     return '(FIXED 1368)';
// });

export { CP0Auto }