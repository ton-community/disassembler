import { beginCell, Cell, Slice } from 'ton-core';
import { decompile, decompileMethodsMap } from '../disassembler';
import { Codepage } from '../structs/codepage';
import { _isDebug } from '../utils/isDebug';

function fetchSubslice(slice: Slice, bits: number, refs?: number) {
    let subcell = beginCell();
    for (let i = 0; i < bits; i++) {
        subcell.storeBit(slice.loadBit());
    }
    for (let i = 0; i < (refs || 0); i++) {
        subcell.storeRef(slice.loadRef())
    }
    return subcell.asSlice();
}


const CP0Auto = new Codepage()

CP0Auto.insertHex('0', 4, (slice) => {
    let n = slice.loadUint(4);
    if (n == 0) {
        return `NOP`;
    }
    return `s0 s${n} XCHG`;
})
CP0Auto.insertHex('1', 4, (slice) => {
    let n = slice.loadUint(4);
    if (n === 0) {
        let i = slice.loadUint(4);
        let j = slice.loadUint(4);
        return `s${i} s${j} XCHG`;
    }
    if (n === 1) {
        let i = slice.loadUint(8);
        return `s0 s${i} XCHG`;
    }
    return `s1 s${n} XCHG`;
})
CP0Auto.insertHex('2', 4, (slice) => {
    let n = slice.loadUint(4);
    return `s${n} PUSH`;
})
CP0Auto.insertHex('3', 4, (slice) => {
    let value = slice.loadUint(4);
    return `s${value} POP`;
})
CP0Auto.insertHex('4', 4, (slice) => {
    let i = slice.loadUint(4);
    let j = slice.loadUint(4);
    let k = slice.loadUint(4);
    return `s${i} s${j} s${k} XCHG3`;
})
CP0Auto.insertHex('50', 8, (slice) => {
    let i = slice.loadUint(4);
    let j = slice.loadUint(4);
    return `s${i} s${j} XCHG2`;
})
CP0Auto.insertHex('51', 8, (slice) => {
    let i = slice.loadUint(4);
    let j = slice.loadUint(4);
    return `s${i} s${j} XCPU`;
})
CP0Auto.insertHex('52', 8, (slice) => {
    let i = slice.loadUint(4);
    let j = slice.loadUint(4);
    return `s${i} s${j-1} PUXC`;
})
CP0Auto.insertHex('53', 8, (slice) => {
    let args = slice.loadUint(8);
    let first = args >> 4 & 0xf;
    let second = args & 0xf;
    return `s${first} s${second} PUSH2`;
})
CP0Auto.insertHex('540', 12, (slice) => {
    let args = slice.loadUint(12);
    let first = args >> 8 & 0xf;
    let second = args >> 4 & 0xf;
    let third = args & 0xf;
    return `s${first} s${second} s${third} XCHG3`;
});
CP0Auto.insertHex('541', 12, (slice) => {
    let args = slice.loadUint(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return `${i} ${j} ${k} XC2PU`;
});
CP0Auto.insertHex('542', 12, (slice) => {
    let args = slice.loadUint(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return `${i} ${j} ${k-1} XCPUXC`;
});
CP0Auto.insertHex('543', 12, (slice) => {
    let args = slice.loadUint(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return `${i} ${j} ${k} XCPU2`;
});
CP0Auto.insertHex('544', 12, (slice) => {
    let args = slice.loadUint(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return `${i} ${j-1} ${k-1} PUXC2`;
});
CP0Auto.insertHex('545', 12, (slice) => {
    let args = slice.loadUint(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return `${i} ${j-1} ${k-1} PUXCPU`;
});
CP0Auto.insertHex('546', 12, (slice) => {
    let args = slice.loadUint(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return `${i} ${j-1} ${k-2} PU2XC`;
});
CP0Auto.insertHex('547', 12, (slice) => {
    let args = slice.loadUint(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return `${i} ${j} ${k} PUSH3`;
});
// 5537792 (DUMMY)
CP0Auto.insertHex('55', 8, (slice) => {
    let args = slice.loadUint(8);
    let i = args >> 4 & 0xf;
    let j = args & 0xf; 
    return `${i+1} ${j+1} BLKSWAP`;
});
CP0Auto.insertHex('56', 8, (slice) => {
    let args = slice.loadUint(8);
    return `s${args} PUSH`;
});
CP0Auto.insertHex('57', 8, (slice) => {
    let args = slice.loadUint(8);
    return `s${args} POP`;
});
CP0Auto.insertHex('58', 8, 'ROT');
CP0Auto.insertHex('59', 8, 'ROTREV');
CP0Auto.insertHex('5a', 8, '2SWAP');
CP0Auto.insertHex('5b', 8, '2DROP');
CP0Auto.insertHex('5c', 8, '2DUP');
CP0Auto.insertHex('5d', 8, '2OVER');
CP0Auto.insertHex('5e', 8, (slice) => {
    let args = slice.loadUint(8);
    let i = args >> 4 & 0xf;
    let j = args & 0xf; 
    return `${i+2} ${j} REVERSE`;
});
CP0Auto.insertHex('5f', 8, (slice) => {
    let i = slice.loadUint(4);
    let j = slice.loadUint(4);
    if (i === 0) {
        return `${j} BLKDROP`;
    }
    return `${i} ${j} BLKPUSH`;
});
CP0Auto.insertHex('60', 8, 'PICK');
CP0Auto.insertHex('61', 8, 'ROLL');
CP0Auto.insertHex('62', 8, 'ROLLREV');
CP0Auto.insertHex('63', 8, 'BLKSWX');
CP0Auto.insertHex('64', 8, 'REVX');
CP0Auto.insertHex('65', 8, 'DROPX');
CP0Auto.insertHex('66', 8, 'TUCK');
CP0Auto.insertHex('67', 8, 'XCHGX');
CP0Auto.insertHex('68', 8, 'DEPTH');
CP0Auto.insertHex('69', 8, 'CHKDEPTH');
CP0Auto.insertHex('6a', 8, 'ONLYTOPX');
CP0Auto.insertHex('6b', 8, 'ONLYX');
// 7077888 (DUMMY)
CP0Auto.insertHex('6c', 8, (slice) => {
    let i = slice.loadUint(4);
    let j = slice.loadUint(4);
    return `${i} ${j} BLKDROP2`;
});
CP0Auto.insertHex('6d', 8, 'PUSHNULL');
CP0Auto.insertHex('6e', 8, 'ISNULL');
CP0Auto.insertHex('6f0', 12, (slice) => {
    let n = slice.loadUint(4);
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
    let k = slice.loadUint(4);
    return `${k} INDEX`;
});
CP0Auto.insertHex('6f2', 12, (slice) => {
    let k = slice.loadUint(4);
    return `${k} UNTUPLE`;
});
CP0Auto.insertHex('6f3', 12, (slice) => {
    let k = slice.loadUint(4);
    if (k === 0) {
        return `CHKTUPLE`;
    }
    return `${k} UNPACKFIRST`;
});
CP0Auto.insertHex('6f4', 12, (slice) => {
    let k = slice.loadUint(4);
    return `${k} EXPLODE`;
});
CP0Auto.insertHex('6f5', 12, (slice) => {
    let k = slice.loadUint(4);
    return `${k} SETINDEX`;
});
CP0Auto.insertHex('6f6', 12, (slice) => {
    let k = slice.loadUint(4);
    return `${k} INDEXQ`;
});
CP0Auto.insertHex('6f7', 12, (slice) => {
    let k = slice.loadUint(4);
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
    let i = slice.loadUint(2);
    let j = slice.loadUint(2);
    return `${i} ${j} INDEX2`;
});
// CP0Auto.insertHex('6fc', 10, (slice) => {
//     let i = slice.loadUint(2);
//     let j = slice.loadUint(2);
//     let k = slice.loadUint(2);
//     return `${i} ${j} ${k} INDEX3`;
// });
CP0Auto.insertHex('7', 4, (slice) => {
    let args = slice.loadInt(4);
    return `${args} PUSHINT`;
});
CP0Auto.insertHex('80', 8, (slice) => {
    let x = slice.loadInt(8)
    return `${x} PUSHINT`;
})
CP0Auto.insertHex('81', 8, (slice) => {
    let x = slice.loadInt(16)
    return `${x} PUSHINT`;
})
CP0Auto.insertHex('82', 8, (slice) => {
    let len = slice.loadUint(5)
    let n = 8 * len + 19
    let x = slice.loadIntBig(n)
    return `${x.toString(10)} PUSHINT`;
})
CP0Auto.insertHex('83', 8, (slice) => {
    let x = slice.loadUint(8) + 1;
    return `${x} PUSHPOW2`;
})
CP0Auto.insertHex('84', 8, (slice) => {
    let x = slice.loadUint(8) + 1;
    return `${x} PUSHPOW2DEC`;
})
CP0Auto.insertHex('850000', 8, (slice) => {
    let x = slice.loadUint(8) + 1;
    return `${x} PUSHNEGPOW2`;
});
// 8781824 (DUMMY)
CP0Auto.insertHex('88', 8, 'PUSHREF');
CP0Auto.insertHex('89', 8, 'PUSHREFSLICE');
CP0Auto.insertHex('8a', 8, 'PUSHREFCONT');
CP0Auto.insertHex('8b', 8, (slice) => {
    let x = slice.loadUint(4);
    let len = 8 * x + 4;
    let subslice = fetchSubslice(slice, len);
    return 'PUSHSLICE';
});
CP0Auto.insertHex('8c0000', 8, (slice) => {
    let r = slice.loadUint(2) + 1;
    let xx = slice.loadUint(5);
    let subslice = fetchSubslice(slice, 8 * xx + 1, r);
    return 'PUSHSLICE';
});
CP0Auto.insertHex('8d', 8, (slice) => {
    let r = slice.loadUint(3);
    let xx = slice.loadUint(7);
    let subslice = fetchSubslice(slice, 8 * xx + 6, r);
    return 'PUSHSLICE';
});
// 9281536 (DUMMY)
CP0Auto.insertHex('8E', 7, (slice, indent) => {
    let args = slice.loadUint(9);
    let refs = (args >> 7) & 3;
    let dataBytes = (args & 127) * 8;

    let subslice = fetchSubslice(slice, dataBytes, refs);
    // <{\n${decompile(slice.loadRef().beginParse(), indent + 2)}${new Array(indent).fill(' ').join('')}}> PUSHCONT`
    return `<{\n${decompile(subslice, indent + 2)}${new Array(indent).fill(' ').join('')}}> PUSHCONT`
})
CP0Auto.insertHex('9', 4, (slice, indent) => {
    let len = slice.loadUint(4) * 8;
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
    let x = slice.loadInt(8);
    return `${x} ADDCONST`;
});
CP0Auto.insertHex('a70000', 8, (slice) => {
    let x = slice.loadInt(8);
    return `${x} MULCONST`;
});
CP0Auto.insertHex('a80000', 8, 'MUL');
CP0Auto.insertHex('A9', 8, (slice) => {
    let m = slice.loadBit();
    let s = slice.loadUint(2);
    let c = slice.loadBit();
    let d = slice.loadUint(2);
    let f = slice.loadUint(2);
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
            let shift = slice.loadUint(8) + 1;
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
CP0Auto.insertHex('aa', 8, (slice) => {
    let cc = slice.loadUint(8);
    return `${cc+1} LSHIFT`;
});
CP0Auto.insertHex('ab', 8, (slice) => {
    let cc = slice.loadUint(8);
    return `${cc+1} RSHIFT`;
});
CP0Auto.insertHex('ac', 8, 'LSHIFT');
CP0Auto.insertHex('ad', 8, 'RSHIFT');
CP0Auto.insertHex('ae', 8, 'POW2');
// 11468800 (DUMMY)
CP0Auto.insertHex('b0', 8, 'AND');
CP0Auto.insertHex('b1', 8, 'OR');
CP0Auto.insertHex('b2', 8, 'XOR');
CP0Auto.insertHex('b3', 8, 'NOT');
CP0Auto.insertHex('b4', 8, (slice) => {
    let cc = slice.loadUint(8);
    return `${cc+1} FITS`;
});
CP0Auto.insertHex('b5', 8, (slice) => {
    let cc = slice.loadUint(8);
    return `${cc+1} UFITS`;
});
CP0Auto.insertHex('b600', 16, 'FITSX');
CP0Auto.insertHex('b601', 16, 'UFITSX');
CP0Auto.insertHex('b602', 16, 'BITSIZE');
CP0Auto.insertHex('b603', 16, 'UBITSIZE');
// 11928576 (DUMMY)
CP0Auto.insertHex('b608', 16, 'MIN');
CP0Auto.insertHex('b609', 16, 'MAX');
CP0Auto.insertHex('b60a', 16, 'MINMAX');
CP0Auto.insertHex('b60b', 16, 'ABS');
// 11930624 (DUMMY)
CP0Auto.insertHex('b7a0', 16, 'QADD');
CP0Auto.insertHex('b7a1', 16, 'QSUB');
CP0Auto.insertHex('b7a2', 16, 'QSUBR');
CP0Auto.insertHex('b7a3', 16, 'QNEGATE');
CP0Auto.insertHex('b7a4', 16, 'QINC');
CP0Auto.insertHex('b7a5', 16, 'QDEC');
CP0Auto.insertHex('b7a6', 16, (slice) => {
    let x = slice.loadInt(8);
    return `${x} QADDCONST`;
});
CP0Auto.insertHex('b7a7', 16, (slice) => {
    let x = slice.loadInt(8);
    return `${x} QMULCONST`;
});
CP0Auto.insertHex('b7a8', 16, 'QMUL');
CP0Auto.insertHex('b7a9', 16, (slice) => {
    let m = slice.loadBit();
    let s = slice.loadUint(2);
    let c = slice.loadBit();
    let d = slice.loadUint(2);
    let f = slice.loadUint(2);
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
            let shift = slice.loadUint(8) + 1;
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
CP0Auto.insertHex('b7aa', 16, (slice) => {
    let cc = slice.loadUint(8);
    return `${cc+1} QLSHIFT`;
});
CP0Auto.insertHex('b7ab', 16, (slice) => {
    let cc = slice.loadUint(8);
    return `${cc+1} QLSHIFT`;
});
CP0Auto.insertHex('b7ac', 16, 'QLSHIFT');
CP0Auto.insertHex('b7ad', 16, 'QRSHIFT');
CP0Auto.insertHex('b7ae', 16, 'QPOW2');
// 12037888 (DUMMY)
CP0Auto.insertHex('b7b0', 16, 'QAND');
CP0Auto.insertHex('b7b1', 16, 'QOR');
CP0Auto.insertHex('b7b2', 16, 'QXOR');
CP0Auto.insertHex('b7b3', 16, 'QNOT');
CP0Auto.insertHex('b7b4', 16, (slice) => {
    let cc = slice.loadUint(8);
    return `${cc+1} QFITS`;
});
CP0Auto.insertHex('b7b5', 16, (slice) => {
    let cc = slice.loadUint(8);
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
CP0Auto.insertHex('b7b8', 16, 'QSGN');
CP0Auto.insertHex('b7b9', 16, 'QLESS');
CP0Auto.insertHex('b7ba', 16, 'QEQUAL');
CP0Auto.insertHex('b7bb', 16, 'QLEQ');
CP0Auto.insertHex('b7bc', 16, 'QGREATER');
CP0Auto.insertHex('b7bd', 16, 'QNEQ');
CP0Auto.insertHex('b7be', 16, 'QGEQ');
CP0Auto.insertHex('b7bf', 16, 'QCMP');
CP0Auto.insertHex('b7c0', 16, (slice) => {
    let x = slice.loadInt(8);
    return `${x} QEQINT`;
});
CP0Auto.insertHex('b7c1', 16, (slice) => {
    let x = slice.loadInt(8);
    return `${x} QLESSINT`;
});
CP0Auto.insertHex('b7c2', 16, (slice) => {
    let x = slice.loadInt(8);
    return `${x} QGTINT`;
});
CP0Auto.insertHex('b7c3', 16, (slice) => {
    let x = slice.loadInt(8);
    return `${x} QNEQINT`;
});
// 12043264 (DUMMY)
CP0Auto.insertHex('b8', 8, 'SGN');
CP0Auto.insertHex('b9', 8, 'LESS');
CP0Auto.insertHex('ba', 8, 'EQUAL');
CP0Auto.insertHex('bb', 8, 'LEQ');
CP0Auto.insertHex('bc', 8, 'GREATER');
CP0Auto.insertHex('bd', 8, 'NEQ');
CP0Auto.insertHex('be', 8, 'GEQ');
CP0Auto.insertHex('bf', 8, 'CMP');
CP0Auto.insertHex('c0', 8, (slice) => {
    let x = slice.loadInt(8);
    return `${x} EQINT`;
});
CP0Auto.insertHex('c1', 8, (slice) => {
    let x = slice.loadInt(8);
    return `${x} LESSINT`;
});
CP0Auto.insertHex('c2', 8, (slice) => {
    let x = slice.loadInt(8);
    return `${x} GTINT`;
});
CP0Auto.insertHex('c3', 8, (slice) => {
    let x = slice.loadInt(8);
    return `${x} NEQINT`;
});
CP0Auto.insertHex('c4', 8, 'ISNAN');
CP0Auto.insertHex('c5', 8, 'CHKNAN');
// 12976128 (DUMMY)
CP0Auto.insertHex('c700', 16, 'SEMPTY');
CP0Auto.insertHex('c701', 16, 'SDEMPTY');
CP0Auto.insertHex('c702', 16, 'SREMPTY');
CP0Auto.insertHex('c703', 16, 'SDFIRST');
CP0Auto.insertHex('c704', 16, 'SDLEXCMP');
CP0Auto.insertHex('c705', 16, 'SDEQ');
// 13043200 (DUMMY)
CP0Auto.insertHex('c708', 16, 'SDPFX');
CP0Auto.insertHex('c709', 16, 'SDPFXREV');
CP0Auto.insertHex('c70a', 16, 'SDPPFX');
CP0Auto.insertHex('c70b', 16, 'SDPPFXREV');
CP0Auto.insertHex('c70c', 16, 'SDSFX');
CP0Auto.insertHex('c70d', 16, 'SDSFXREV');
CP0Auto.insertHex('c70e', 16, 'SDPSFX');
CP0Auto.insertHex('c70f', 16, 'SDPSFXREV');
CP0Auto.insertHex('c710', 16, 'SDCNTLEAD0');
CP0Auto.insertHex('c711', 16, 'SDCNTLEAD1');
CP0Auto.insertHex('c712', 16, 'SDCNTTRAIL0');
CP0Auto.insertHex('c713', 16, 'SDCNTTRAIL1');
// 13046784 (DUMMY)
CP0Auto.insertHex('c8', 8, 'NEWC');
CP0Auto.insertHex('c9', 8, 'ENDC');
CP0Auto.insertHex('ca', 8, (slice) => {
    let cc = slice.loadUint(8) + 1;
    return `${cc} STI`;
});
CP0Auto.insertHex('cb', 8, (slice) => {
    let cc = slice.loadUint(8) + 1;
    return `${cc} STU`;
});
CP0Auto.insertHex('cc', 8, 'STREF');
CP0Auto.insertHex('cd', 8, 'ENDCST');
CP0Auto.insertHex('ce', 8, 'STSLICE');
CP0Auto.insertHex('cf00', 13, (slice) => {
    let args = slice.loadUint(3);
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
CP0Auto.insertHex('cf08', 13, (slice) => {
    let args = slice.loadUint(11);
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
CP0Auto.insertHex('cf10', 16, 'STREF');
CP0Auto.insertHex('cf11', 16, 'STBREF');
CP0Auto.insertHex('cf12', 16, 'STSLICE');
CP0Auto.insertHex('cf13', 16, 'STB');
CP0Auto.insertHex('cf14', 16, 'STREFR');
CP0Auto.insertHex('cf15', 16, 'STBREFR');
CP0Auto.insertHex('cf16', 16, 'STSLICER');
CP0Auto.insertHex('cf17', 16, 'STBR');
CP0Auto.insertHex('cf18', 16, 'STREFQ');
CP0Auto.insertHex('cf19', 16, 'STBREFQ');
CP0Auto.insertHex('cf1a', 16, 'STSLICEQ');
CP0Auto.insertHex('cf1b', 16, 'STBQ');
CP0Auto.insertHex('cf1c', 16, 'STREFRQ');
CP0Auto.insertHex('cf1d', 16, 'STBREFRQ');
CP0Auto.insertHex('cf1e', 16, 'STSLICERQ');
CP0Auto.insertHex('cf1f', 16, 'STBRQ');
CP0Auto.insertHex('cf20', 15, (slice) => {
    let flag = slice.loadUint(1);
    if (flag === 0) {
        return 'STREFCONST';
    } else {
        return 'STREF2CONST';
    }
});
// 13574656 (DUMMY)
CP0Auto.insertHex('cf23', 16, 'ENDXC');
// 13575168 (DUMMY)
CP0Auto.insertHex('cf28', 14, (slice) => {
    let args = slice.loadUint(2);
    let sgnd = !(args & 1);
    return `ST${(sgnd ? 'I' : 'U')}LE${((args & 2) ? '8' : '4')}`;
});
// 13577216 (DUMMY)
CP0Auto.insertHex('cf30', 16, 'BDEPTH');
CP0Auto.insertHex('cf31', 16, 'BBITS');
CP0Auto.insertHex('cf32', 16, 'BREFS');
CP0Auto.insertHex('cf33', 16, 'BBITREFS');
// 13579264 (DUMMY)
CP0Auto.insertHex('cf35', 16, 'BREMBITS');
CP0Auto.insertHex('cf36', 16, 'BREMREFS');
CP0Auto.insertHex('cf37', 16, 'BREMBITREFS');
CP0Auto.insertHex('cf38', 16, (slice) => {
    let cc = slice.loadUint(8);
    return `${cc+1} BCHKBITS`;
});
CP0Auto.insertHex('cf39', 16, 'BCHKBITS');
CP0Auto.insertHex('cf3a', 16, 'BCHKREFS');
CP0Auto.insertHex('cf3b', 16, 'BCHKBITREFS');
CP0Auto.insertHex('cf3c', 16, (slice) => {
    let cc = slice.loadUint(8);
    return `${cc+1} BCHKBITSQ`;
});
CP0Auto.insertHex('cf3d', 16, 'BCHKBITSQ');
CP0Auto.insertHex('cf3e', 16, 'BCHKREFSQ');
CP0Auto.insertHex('cf3f', 16, 'BCHKBITREFSQ');
CP0Auto.insertHex('cf40', 16, 'STZEROES');
CP0Auto.insertHex('cf41', 16, 'STONES');
CP0Auto.insertHex('cf42', 16, 'STSAME');
// 13583104 (DUMMY)
CP0Auto.insertHex('cf8', 9, (slice) => {
    let refs = slice.loadUint(2);
    let dataBits = slice.loadUint(3) * 8 + 1;
    let subslice = fetchSubslice(slice, dataBits, refs);
    return `STSLICECONST`;
});
CP0Auto.insertHex('d0', 8, 'CTOS');
CP0Auto.insertHex('d1', 8, 'ENDS');
CP0Auto.insertHex('d2', 8, (slice) => {
    let cc = slice.loadUint(8);
    return `${cc+1} LDI`;
});
CP0Auto.insertHex('d3', 8, (slice) => {
    let cc = slice.loadUint(8);
    return `${cc+1} LDU`;
});
CP0Auto.insertHex('d4', 8, 'LDREF');
CP0Auto.insertHex('d5', 8, 'LDREFRTOS');
CP0Auto.insertHex('d6', 8, (slice) => {
    let cc = slice.loadUint(8);
    return `${cc+1} LDSLICE`;
});
CP0Auto.insertHex('d70', 12, (slice) => {
    let longerVersion = slice.loadBit();
    let quiet = slice.loadBit();
    let preload = slice.loadBit();
    let sign = slice.loadBit();

    return `${longerVersion ? ((slice.loadUint(8) + 1) + ' ') : ''}${preload ? 'PLD' : 'LD'}${sign ? 'U' : 'I'}${quiet ? 'Q' : ''}`;
});
CP0Auto.insertHex('d710', 13, (slice) => {
    let c = slice.loadUint(3) + 1;
    return `${32 * (c + 1)} PLDUZ`;
});
CP0Auto.insertHex('d718', 14, (slice) => {
    let quiet = slice.loadBit();
    let preload = slice.loadBit();
    return `${preload ? 'PLD' : 'LD'}SLICEX${quiet ? 'Q' : ''}`;
});
CP0Auto.insertHex('d71c', 14, (slice) => {
    let quiet = slice.loadBit();
    let preload = slice.loadBit();
    let cc = slice.loadUint(8);
    return `${cc+1} ${preload ? 'PLD' : 'LD'}SLICEX${quiet ? 'Q' : ''}`;
});
CP0Auto.insertHex('d720', 16, 'SDCUTFIRST');
CP0Auto.insertHex('d721', 16, 'SDSKIPFIRST');
CP0Auto.insertHex('d722', 16, 'SDCUTLAST');
CP0Auto.insertHex('d723', 16, 'SDSKIPLAST');
CP0Auto.insertHex('d724', 16, 'SDSUBSTR');
// 14099712 (DUMMY)
CP0Auto.insertHex('d726', 16, 'SDBEGINSX');
CP0Auto.insertHex('d727', 16, 'SDBEGINSXQ');
CP0Auto.insertHex('d728', 13, (slice) => {
    let args = slice.loadUint(8);
    return 'SDBEGINS';
});
CP0Auto.insertHex('d730', 16, 'SCUTFIRST');
CP0Auto.insertHex('d731', 16, 'SSKIPFIRST');
CP0Auto.insertHex('d732', 16, 'SCUTLAST');
CP0Auto.insertHex('d733', 16, 'SSKIPLAST');
CP0Auto.insertHex('d734', 16, 'SUBSLICE');
// 14103808 (DUMMY)
CP0Auto.insertHex('d736', 16, 'SPLIT');
CP0Auto.insertHex('d737', 16, 'SPLITQ');
// 14104576 (DUMMY)
CP0Auto.insertHex('d739', 16, 'XCTOS');
CP0Auto.insertHex('d73a', 16, 'XLOAD');
CP0Auto.insertHex('d73b', 16, 'XLOADQ');
// 14105600 (DUMMY)
CP0Auto.insertHex('d741', 16, 'SCHKBITS');
CP0Auto.insertHex('d742', 16, 'SCHKREFS');
CP0Auto.insertHex('d743', 16, 'SCHKBITREFS');
// 14107648 (DUMMY)
CP0Auto.insertHex('d745', 16, 'SCHKBITSQ');
CP0Auto.insertHex('d746', 16, 'SCHKREFSQ');
CP0Auto.insertHex('d747', 16, 'SCHKBITREFSQ');
CP0Auto.insertHex('d748', 16, 'PLDREFVAR');
CP0Auto.insertHex('d749', 16, 'SBITS');
CP0Auto.insertHex('d74a', 16, 'SREFS');
CP0Auto.insertHex('d74b', 16, 'SBITREFS');
CP0Auto.insertHex('d74c', 14, (slice) => {
    let n = slice.loadUint(2);
    return `${n} PLDREFIDX`;
});
CP0Auto.insertHex('d750', 12, (slice) => {
    let quiet = slice.loadBit();
    let preload = slice.loadBit();
    let bit64 = slice.loadBit();
    let unsigned = slice.loadBit();
    return `${preload ? 'PLD' : 'LD'}${unsigned ? 'U' : 'I'}LE${bit64 ? '8' : '4'}${quiet ? 'Q' : ''}`;
});
CP0Auto.insertHex('d760', 16, 'LDZEROES');
CP0Auto.insertHex('d761', 16, 'LDONES');
CP0Auto.insertHex('d762', 16, 'LDSAME');
// 14115584 (DUMMY)
CP0Auto.insertHex('d764', 16, 'SDEPTH');
CP0Auto.insertHex('d765', 16, 'CDEPTH');
// 14116352 (DUMMY)
CP0Auto.insertHex('d8', 8, 'EXECUTE');
CP0Auto.insertHex('d9', 8, 'JMPX');
CP0Auto.insertHex('da', 8, (slice) => {
    let p = slice.loadUint(4);
    let r = slice.loadUint(4);
    return `${p} ${r} CALLXARGS`;
});
CP0Auto.insertHex('db0', 12, (slice) => {
    let p = slice.loadUint(4);
    return `${p} CALLXARGS`;
});
CP0Auto.insertHex('db1', 12, (slice) => {
    let p = slice.loadUint(4);
    return `${p} JMPXARGS`;
});
CP0Auto.insertHex('db2', 12, (slice) => {
    let r = slice.loadUint(4);
    return `${r} RETARGS`;
});
CP0Auto.insertHex('db30', 16, 'RET');
CP0Auto.insertHex('db31', 16, 'RETALT');
CP0Auto.insertHex('db32', 16, 'RETBOOL');
// 14365440 (DUMMY)
CP0Auto.insertHex('db34', 16, 'CALLCC');
CP0Auto.insertHex('db35', 16, 'JMPXDATA');
CP0Auto.insertHex('db36', 16, (slice) => {
    let p = slice.loadUint(4);
    let r = slice.loadUint(4);
    return `${p} ${r} CALLCCARGS`;
});
// 14366464 (DUMMY)
CP0Auto.insertHex('db38', 16, 'CALLXVARARGS');
CP0Auto.insertHex('db39', 16, 'RETVARARGS');
CP0Auto.insertHex('db3a', 16, 'JMPXVARARGS');
CP0Auto.insertHex('db3b', 16, 'CALLCCVARARGS');
CP0Auto.insertHex('db3c', 16, (slice, indent) => {
    let subslice = slice.loadRef().beginParse();
    return `<{\n${decompile(subslice, indent + 2)}${new Array(indent).fill(' ').join('')}}> CALLREF`;
});
CP0Auto.insertHex('db3d', 16, (slice, indent) => {
    let subslice = slice.loadRef().beginParse();
    return `<{\n${decompile(subslice, indent + 2)}${new Array(indent).fill(' ').join('')}}> JMPREF`;
});
CP0Auto.insertHex('db3e', 16, (slice, indent) => {
    let subslice = slice.loadRef().beginParse();
    return `<{\n${decompile(subslice, indent + 2)}${new Array(indent).fill(' ').join('')}}> JMPREFDATA`;
});
CP0Auto.insertHex('db3f', 16, 'RETDATA');
// 14368768 (DUMMY)
CP0Auto.insertHex('dc', 8, 'IFRET');
CP0Auto.insertHex('dd', 8, 'IFNOTRET');
CP0Auto.insertHex('de', 8, 'IF');
CP0Auto.insertHex('df', 8, 'IFNOT');
CP0Auto.insertHex('e0', 8, 'IFJMP');
CP0Auto.insertHex('e1', 8, 'IFNOTJMP');
CP0Auto.insertHex('e2', 8, 'IFELSE');
CP0Auto.insertHex('e300', 16, (slice, indent) => {
    let subslice = slice.loadRef().beginParse();
    return `<{\n${decompile(subslice, indent + 2)}${new Array(indent).fill(' ').join('')}}> IFREF`;
});
CP0Auto.insertHex('e301', 16, (slice, indent) => {
    let subslice = slice.loadRef().beginParse();
    return `<{\n${decompile(subslice, indent + 2)}${new Array(indent).fill(' ').join('')}}> IFNOTREF`;
});
CP0Auto.insertHex('e302', 16, (slice, indent) => {
    let subslice = slice.loadRef().beginParse();
    return `<{\n${decompile(subslice, indent + 2)}${new Array(indent).fill(' ').join('')}}> IFJMPREF`;
});
CP0Auto.insertHex('e303', 16, (slice, indent) => {
    let subslice = slice.loadRef().beginParse();
    return `<{\n${decompile(subslice, indent + 2)}${new Array(indent).fill(' ').join('')}}> IFNOTJMPREF`;
});
CP0Auto.insertHex('e304', 16, 'CONDSEL');
CP0Auto.insertHex('e305', 16, 'CONDSELCHK');
// 14878208 (DUMMY)
CP0Auto.insertHex('e308', 16, 'IFRETALT');
CP0Auto.insertHex('e309', 16, 'IFNOTRETALT');
// 14879232 (DUMMY)
CP0Auto.insertHex('e30d', 16, (slice, indent) => {
    let subslice = slice.loadRef().beginParse();
    return `<{\n${decompile(subslice, indent + 2)}${new Array(indent).fill(' ').join('')}}> IFREFELSE`;
});
CP0Auto.insertHex('e30e', 16, (slice, indent) => {
    let subslice = slice.loadRef().beginParse();
    return `<{\n${decompile(subslice, indent + 2)}${new Array(indent).fill(' ').join('')}}> IFELSEREF`;
});
CP0Auto.insertHex('e30f', 16, (slice, indent) => {
    let subslice = slice.loadRef().beginParse();
    return `<{\n${decompile(subslice, indent + 2)}${new Array(indent).fill(' ').join('')}}> IFREFELSEREF`;
});
// 14880768 (DUMMY)
CP0Auto.insertHex('e314', 16, 'REPEATBRK');
CP0Auto.insertHex('e315', 16, 'REPEATENDBRK');
CP0Auto.insertHex('e316', 16, 'UNTILBRK');
CP0Auto.insertHex('e317', 16, 'UNTILENDBRK');
CP0Auto.insertHex('e318', 16, 'WHILEBRK');
CP0Auto.insertHex('e319', 16, 'WHILEENDBRK');
CP0Auto.insertHex('e31a', 16, 'AGAINBRK');
CP0Auto.insertHex('e31b', 16, 'AGAINENDBRK');
// 14883840 (DUMMY)
CP0Auto.insertHex('e38', 10, (slice) => {
    let args = slice.loadUint(6);
    return '(FIXED 879)';
});
CP0Auto.insertHex('e3c', 10, (slice) => {
    let args = slice.loadUint(6);
    return '(EXT)';
});
CP0Auto.insertHex('e4', 8, 'REPEAT');
CP0Auto.insertHex('e5', 8, 'REPEATEND');
CP0Auto.insertHex('e6', 8, 'UNTIL');
CP0Auto.insertHex('e7', 8, 'UNTILEND');
CP0Auto.insertHex('e8', 8, 'WHILE');
CP0Auto.insertHex('e9', 8, 'WHILEEND');
CP0Auto.insertHex('ea', 8, 'AGAIN');
CP0Auto.insertHex('eb', 8, 'AGAINEND');
CP0Auto.insertHex('ec', 8, (slice) => {
    let r = slice.loadUint(4);
    let n = slice.loadUint(4);
    return `${r}, ${n} SETCONTARGS`;
});
CP0Auto.insertHex('ed0', 12, (slice) => {
    let p = slice.loadUint(4);
    return `${p} RETURNARGS`;
});
CP0Auto.insertHex('ed10', 16, 'RETURNVARARGS');
CP0Auto.insertHex('ed11', 16, 'SETCONTVARARGS');
CP0Auto.insertHex('ed12', 16, 'SETNUMVARARGS');
// 15536896 (DUMMY)
CP0Auto.insertHex('ed1e', 16, 'BLESS');
CP0Auto.insertHex('ed1f', 16, 'BLESSVARARGS');
// 15540224 (DUMMY)
CP0Auto.insertHex('ed4', 12, (slice) => {
    let n = slice.loadUint(4);
    return `c${n} PUSH`;
});
CP0Auto.insertHex('ed5', 12, (slice) => {
    let x = slice.loadUint(4);
    return `c${x} POP`;
});
// 15554560 (DUMMY)
CP0Auto.insertHex('ed6', 12, (slice) => {
    let i = slice.loadUint(4);
    return `c${i} SETCONT`;
});
// 15558656 (DUMMY)
CP0Auto.insertHex('ed7', 12, (slice) => {
    let i = slice.loadUint(4);
    return `c${i} SETRETCTR`;
});
// 15562752 (DUMMY)
CP0Auto.insertHex('ed8', 12, (slice) => {
    let i = slice.loadUint(4);
    return `c${i} SETALTCTR`;
});
// 15566848 (DUMMY)
CP0Auto.insertHex('ed9', 12, (slice) => {
    let i = slice.loadUint(4);
    return `c${i} POPSAVE`;
});
// 15570944 (DUMMY)
CP0Auto.insertHex('eda', 12, (slice) => {
    let i = slice.loadUint(4);
    return `c${i} SAVE`;
});
CP0Auto.insertHex('edb', 12, (slice) => {
    let i = slice.loadUint(4);
    return `c${i} SAVEALT`;
});
CP0Auto.insertHex('edc', 12, (slice) => {
    let i = slice.loadUint(4);
    return `c${i} SAVEBOTH`;
});
CP0Auto.insertHex('ede0', 16, 'PUSHCTRX');
CP0Auto.insertHex('ede1', 16, 'POPCTRX');
CP0Auto.insertHex('ede2', 16, 'SETCONTCTRX');
CP0Auto.insertHex('edf0', 16, 'BOOLAND');
CP0Auto.insertHex('edf1', 16, 'BOOLOR');
CP0Auto.insertHex('edf2', 16, 'COMPOSBOTH');
CP0Auto.insertHex('edf3', 16, 'ATEXIT');
CP0Auto.insertHex('edf4', 16, 'ATEXITALT');
CP0Auto.insertHex('edf5', 16, 'SETEXITALT');
CP0Auto.insertHex('edf6', 16, 'THENRET');
CP0Auto.insertHex('edf7', 16, 'THENRETALT');
CP0Auto.insertHex('edf8', 16, 'INVERT');
CP0Auto.insertHex('edf9', 16, 'BOOLEVAL');
CP0Auto.insertHex('edfa', 16, 'SAMEALT');
CP0Auto.insertHex('edfb', 16, 'SAMEALTSAVE');
// 15596544 (DUMMY)
CP0Auto.insertHex('ee', 8, (slice) => {
    let r = slice.loadUint(4);
    let n = slice.loadUint(4);
    return `${r},${n} BLESSARGS`;
});
// 15663104 (DUMMY)
CP0Auto.insertHex('f0', 8, (slice) => {
    let n = slice.loadUint(8);
    return `${n} CALLDICT`;
});
CP0Auto.insertHex('f10', 10, (slice) => {
    let n = slice.loadUint(14);
    return `${n} CALL`;
});
// CP0Auto.insertHex('f14', 10, (slice) => {
//     let args = slice.loadUint(14);
//     return '(FIXED 1047)';
// });
// CP0Auto.insertHex('f18', 10, (slice) => {
//     let args = slice.loadUint(14);
//     return '(FIXED 1051)';
// });
// 15843328 (DUMMY)
CP0Auto.insertHex('f20', 10, (slice) => {
    let nn = slice.loadUint(6);
    return `${nn} THROW`;
});
CP0Auto.insertHex('F24', 10, (slice) => {
    let eCode = slice.loadUintBig(6)
    return `${eCode} THROWIF`
})
CP0Auto.insertHex('F28', 10, (slice) => {
    let eCode = slice.loadUintBig(6)
    return `${eCode} THROWIFNOT`
})
CP0Auto.insertHex('f2c0', 13, (slice) => {
    let args = slice.loadUint(11);
    return `${args} THROW`;
});
CP0Auto.insertHex('f2c8', 13, (slice) => {
    let x = slice.loadUint(11);
    return `${x} THROWARG`;
});
CP0Auto.insertHex('f2d0', 13, (slice) => {
    let x = slice.loadUint(11);
    return `${x} THROWIF`;
});
// CP0Auto.insertHex('f2d8', 13, (slice) => {
//     let args = slice.loadUint(11);
//     return '(FIXED 1080)';
// });
CP0Auto.insertHex('f2e0', 13, (slice) => {
    let x = slice.loadUint(11);
    return `${x} THROWIFNOT`;
});
// CP0Auto.insertHex('f2e8', 13, (slice) => {
//     let args = slice.loadUint(11);
//     return '(FIXED 1088)';
// });
CP0Auto.insertHex('f2f0', 13, (slice) => {
    let inverse = slice.loadBit();
    let cond = slice.loadBit();
    let arg = slice.loadBit();
    return `THROW${arg ? 'ARG' : ''}ANY${(cond || inverse) ? 'IF' : ''}${inverse ? 'NOT' : ''}`;
});
// 15922688 (DUMMY)
CP0Auto.insertHex('f2ff', 16, 'TRY');
CP0Auto.insertHex('f3', 8, (slice) => {
    let p = slice.loadUint(4);
    let r = slice.loadUint(4);
    return `${p},${r} TRYARGS`;
});
CP0Auto.insertHex('f400', 16, 'STDICT');
CP0Auto.insertHex('f401', 16, 'SKIPDICT');
CP0Auto.insertHex('f402', 16, 'LDDICTS');
CP0Auto.insertHex('f403', 16, 'PLDDICTS');
CP0Auto.insertHex('f404', 16, 'LDDICT');
CP0Auto.insertHex('f405', 16, 'PLDDICT');
CP0Auto.insertHex('f406', 16, 'LDDICTQ');
CP0Auto.insertHex('f407', 16, 'PLDDICTQ');
// 15992832 (DUMMY)

CP0Auto.insertHex('f40a', 16, 'DICTGET');
CP0Auto.insertHex('f40b', 16, 'DICTGETREF');
CP0Auto.insertHex('f40c', 16, 'DICTIGET');
CP0Auto.insertHex('f40d', 16, 'DICTIGETREF');
CP0Auto.insertHex('f40e', 16, 'DICTUGET');
CP0Auto.insertHex('f40f', 16, 'DICTUGETREF');

// 15994880 (DUMMY)

// TODO: refactor to conditionals
CP0Auto.insertHex('f412', 16, 'DICTSET');
CP0Auto.insertHex('f413', 16, 'DICTSETREF');
CP0Auto.insertHex('f414', 16, 'DICTISET');
CP0Auto.insertHex('f415', 16, 'DICTISETREF');
CP0Auto.insertHex('f416', 16, 'DICTUSET');
CP0Auto.insertHex('f417', 16, 'DICTUSETREF');

CP0Auto.insertHex('f41a', 16, 'DICTSETGET');
CP0Auto.insertHex('F41B', 16, 'DICTSETGETREF');
CP0Auto.insertHex('F41C', 16, 'DICTISETGET');
CP0Auto.insertHex('F41D', 16, 'DICTISETGETREF');
CP0Auto.insertHex('F41E', 16, 'DICTUSETGET');
CP0Auto.insertHex('F41F', 16, 'DICTUSETGETREF');

// 15998976 (DUMMY)
CP0Auto.insertHex('f420', 13, (slice) => {
    let sls = slice.loadBit();
    let sign = slice.loadBit();
    let ref = slice.loadBit();
    let type = '';
    if (sls && !sign) {
        type = 'I';
    } else if (sls && sign) {
        type = 'U';
    }
    return `DICT${type}REPLACE${ref ? 'REF' : ''}`;
});
// 16001024 (DUMMY)
CP0Auto.insertHex('f42a', 13, (slice) => {
    let sls = slice.loadBit();
    let sign = slice.loadBit();
    let ref = slice.loadBit();
    let type = '';
    if (sls && !sign) {
        type = 'I';
    } else if (sls && sign) {
        type = 'U';
    }
    return `DICT${type}REPLACEGET${ref ? 'REF' : ''}`;
});
// 16003072 (DUMMY)
CP0Auto.insertHex('f432', 13, (slice) => {
    let sls = slice.loadBit();
    let sign = slice.loadBit();
    let ref = slice.loadBit();
    let type = '';
    if (sls && !sign) {
        type = 'I';
    } else if (sls && sign) {
        type = 'U';
    }
    return `DICT${type}ADD${ref ? 'REF' : ''}`;
});
// 16005120 (DUMMY)
CP0Auto.insertHex('f43a', 13, (slice) => {
    let sls = slice.loadBit();
    let sign = slice.loadBit();
    let ref = slice.loadBit();
    let type = '';
    if (sls && !sign) {
        type = 'I';
    } else if (sls && sign) {
        type = 'U';
    }
    return `DICT${type}ADDGET${ref ? 'REF' : ''}`;
});
// 16007168 (DUMMY)
CP0Auto.insertHex('f441', 14, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    return `DICT${int ? (usign ? 'U' : 'I') : '' }SETB`;
});
// 16008192 (DUMMY)
CP0Auto.insertHex('f445', 14, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    return `DICT${int ? (usign ? 'U' : 'I') : '' }SETGETB`;
});
// 16009216 (DUMMY)
CP0Auto.insertHex('f449', 14, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    return `DICT${int ? (usign ? 'U' : 'I') : '' }REPLACEB`;
});
// 16010240 (DUMMY)
CP0Auto.insertHex('f44d', 14, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    return `DICT${int ? (usign ? 'U' : 'I') : '' }REPLACEGETB`;
});
// 16011264 (DUMMY)
CP0Auto.insertHex('f451', 14, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    return `DICT${int ? (usign ? 'U' : 'I') : '' }ADDB`;
});
// 16012288 (DUMMY)
CP0Auto.insertHex('f455', 14, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    return `DICT${int ? (usign ? 'U' : 'I') : '' }ADDGETB`;
});
// 16013312 (DUMMY)
CP0Auto.insertHex('f459', 16, 'DICTDEL');
CP0Auto.insertHex('f45A', 16, 'DICTIDEL');
CP0Auto.insertHex('f45B', 16, 'DICTUDEL');

// 16014336 (DUMMY)
CP0Auto.insertHex('f462', 13, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    let ref = slice.loadBit();
    let type = '';
    if (int && !usign) {
        type = 'I';
    } else if (int && usign) {
        type = 'U';
    }
    return `DICT${type}DELGET${ref ? 'REF' : ''}`;
});
// 16017408 (DUMMY)
CP0Auto.insertHex('f469', 16, 'DICTGETOPTREF');
CP0Auto.insertHex('f46A', 16, 'DICTIGETOPTREF');
CP0Auto.insertHex('f46B', 16, 'DICTUGETOPTREF');

CP0Auto.insertHex('f46d', 16, 'DICTSETGETOPTREF');
CP0Auto.insertHex('f46e', 16, 'DICTISETGETOPTREF');
CP0Auto.insertHex('f46f', 16, 'DICTUSETGETOPTREF');

CP0Auto.insertHex('f47', 12, (slice) => {
    let args = slice.loadUint(4);
    if (args === 0) {
        return 'PFXDICTSET';
    } else if (args === 1) {
        return 'PFXDICTREPLACE';
    } else if (args === 2) {
        return 'PFXDICTADD';
    } else if (args === 3) {
        return 'PFXDICTDEL';
    }
    let res = "DICT";
    if (args & 8) {
        res += ((args & 4) ? 'U' : 'I');
    }
    return `DICT${(args & 4) ? 'U' : 'I'}GET${(args & 2) ? 'PREV' : 'NEXT'}${(args & 1) ? 'EQ' : ''}`; 
});
CP0Auto.insertHex('f48', 11, (slice) => {
    let remove = slice.loadBit();
    let max = slice.loadBit();
    let int = slice.loadBit();
    let usign = slice.loadBit();
    let ref = slice.loadBit();
    let type = '';
    if (int && !usign) {
        type = 'I';
    } else if (int && usign) {
        type = 'U';
    }
    return `DICT${type}${remove ? 'REM' : ''}${max ? 'MAX' : 'MIN'}${ref ? 'REF' : ''}`;
});
CP0Auto.insertHex('f4a0', 13, (slice, indent) => {
    let push = slice.loadBit();
    if (push) { // f4a4
        let subslice = fetchSubslice(slice, 0, 1);
        let keyLen = slice.loadUint(10);
        let decompiled: string
        try {
            decompiled = decompileMethodsMap(subslice.preloadRef().beginParse(), keyLen, indent)
        } catch (e) {
            _isDebug() && console.error(e);
            decompiled = subslice.asCell().toString(' '.repeat(indent));
        }
        return `${decompiled} ${keyLen} DICTPUSHCONST`;
    }
    let exec = slice.loadBit();
    let usign = slice.loadBit();
    return `DICT${usign ? 'U' : 'I'}GET${exec ? 'EXEC' : 'JMP'}`;
});
CP0Auto.insertHex('f4a8', 16, 'PFXDICTGETQ');
CP0Auto.insertHex('f4a9', 16, 'PFXDICTGET');
CP0Auto.insertHex('f4aa', 16, 'PFXDICTGETJMP');
CP0Auto.insertHex('f4ab', 16, 'PFXDICTGETEXEC');
// CP0Auto.insertHex('f4ac00', 13, (slice) => {
//     let args = slice.loadUint(11);
//     return '(EXT)';
// });
// 16035840 (DUMMY)
CP0Auto.insertHex('f4b1', 13, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    let ref = slice.loadBit();
    let type = '';
    if (int && !usign) {
        type = 'I';
    } else if (int && usign) {
        type = 'U';
    }
    return `SUBDICT${type}GET${ref ? 'REF' : ''}`;
});
// 16036864 (DUMMY)
CP0Auto.insertHex('f4b5', 13, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    let ref = slice.loadBit();
    let type = '';
    if (int && !usign) {
        type = 'I';
    } else if (int && usign) {
        type = 'U';
    }
    return `SUBDICT${type}RPGET${ref ? 'REF' : ''}`;
});
// 16037888 (DUMMY)
CP0Auto.insertHex('f4bc', 14, (slice) => {
    let exec = slice.loadBit();
    let unsigned = slice.loadBit();
    return `DICT${unsigned ? 'U' : 'I'}GET${exec ? 'EXEC' : 'JMP'}Z`;
});
// 16039936 (DUMMY)
CP0Auto.insertHex('f800', 16, 'ACCEPT');
CP0Auto.insertHex('f801', 16, 'SETGASLIMIT');
// 16253440 (DUMMY)
CP0Auto.insertHex('f80f', 16, 'COMMIT');
CP0Auto.insertHex('f810', 16, 'RANDU256');
CP0Auto.insertHex('f811', 16, 'RAND');
// 16257536 (DUMMY)
CP0Auto.insertHex('f814', 16, 'SETRAND');
CP0Auto.insertHex('f815', 16, 'ADDRAND');
CP0Auto.insertHex('f82', 12, (slice) => {
    let i = slice.loadUint(4);
    if (i == 0x3) {
        return 'NOW';
    } else if (i == 0x4) {
        return 'BLOCKLT';
    } else if (i == 0x5) {
        return 'LTIME';
    } else if (i == 0x6) {
        return 'RANDSEED';
    } else if (i == 0x7) {
        return 'BALANCE';
    } else if (i == 0x8) {
        return 'MYADDR';
    } else if (i == 0x9) {
        return 'CONFIGROOT';
    }
    return `${i} GETPARAM`;
});
CP0Auto.insertHex('f830', 16, 'CONFIGDICT');
// 16265472 (DUMMY)
CP0Auto.insertHex('f832', 16, 'CONFIGPARAM');
CP0Auto.insertHex('f833', 16, 'CONFIGOPTPARAM');
// 16266240 (DUMMY)
// CP0Auto.insertHex('f84000', 16, 'GETGLOBVAR');
CP0Auto.insertHex('f841', 11, (slice) => {
    let args = slice.loadUint(5);
    return `${args} GETGLOBVAR`;
});
// CP0Auto.insertHex('f86000', 16, 'SETGLOBVAR');
CP0Auto.insertHex('f861', 11, (slice) => {
    let args = slice.loadUint(5);
    return `${args} SETGLOBVAR`;
});
// 16285696 (DUMMY)
CP0Auto.insertHex('f900', 16, 'HASHCU');
CP0Auto.insertHex('f901', 16, 'HASHSU');
CP0Auto.insertHex('f902', 16, 'SHA256U');
// 16319232 (DUMMY)
CP0Auto.insertHex('f910', 16, 'CHKSIGNU');
CP0Auto.insertHex('f911', 16, 'CHKSIGNS');
// 16323072 (DUMMY)
CP0Auto.insertHex('f940', 16, 'CDATASIZEQ');
CP0Auto.insertHex('f941', 16, 'CDATASIZE');
CP0Auto.insertHex('f942', 16, 'SDATASIZEQ');
CP0Auto.insertHex('f943', 16, 'SDATASIZE');
// 16335872 (DUMMY)
CP0Auto.insertHex('fa00', 16, 'LDGRAMS');
CP0Auto.insertHex('fa01', 16, 'LDVARINT16');
CP0Auto.insertHex('fa02', 16, 'STGRAMS');
CP0Auto.insertHex('fa03', 16, 'STVARINT16');
CP0Auto.insertHex('fa04', 16, 'LDVARUINT32');
CP0Auto.insertHex('fa05', 16, 'LDVARINT32');
CP0Auto.insertHex('fa06', 16, 'STVARUINT32');
CP0Auto.insertHex('fa07', 16, 'STVARINT32');
// 16386048 (DUMMY)
CP0Auto.insertHex('fa40', 16, 'LDMSGADDR');
CP0Auto.insertHex('fa41', 16, 'LDMSGADDRQ');
CP0Auto.insertHex('fa42', 16, 'PARSEMSGADDR');
CP0Auto.insertHex('fa43', 16, 'PARSEMSGADDRQ');
CP0Auto.insertHex('fa44', 16, 'REWRITESTDADDR');
CP0Auto.insertHex('fa45', 16, 'REWRITESTDADDRQ');
CP0Auto.insertHex('fa46', 16, 'REWRITEVARADDR');
CP0Auto.insertHex('fa47', 16, 'REWRITEVARADDRQ');
// 16402432 (DUMMY)
CP0Auto.insertHex('fb00', 16, 'SENDRAWMSG');
// 16449792 (DUMMY)
CP0Auto.insertHex('fb02', 16, 'RAWRESERVE');
CP0Auto.insertHex('fb03', 16, 'RAWRESERVEX');
CP0Auto.insertHex('fb04', 16, 'SETCODE');
// 16450816 (DUMMY)
CP0Auto.insertHex('fb06', 16, 'SETLIBCODE');
CP0Auto.insertHex('fb07', 16, 'CHANGELIB');
// 16451584 (DUMMY)
CP0Auto.insertHex('fe', 8, (slice) => {
    let nn = slice.loadUint(8);
    if ((nn & 0xf0) == 0xf0) {
        let n = nn & 0x0f;
        let str = slice.loadBuffer(n + 1).toString('utf-8');
        return `"${str}" DEBUGSTR`;
    }
    return `${nn} DEBUG`;
});
CP0Auto.insertHex('ff', 8, (slice) => {
    let nn = slice.loadUint(8);
    if ((nn & 0xf0) == 0xf0) {
        let z = nn & 0x0f;
        if (z == 0) {
            return `SETCPX`;
        }

        nn = z - 16;
    }
    return `${nn} SETCP`;
});

export { CP0Auto }