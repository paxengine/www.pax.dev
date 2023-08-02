let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedFloat64Memory0 = null;

function getFloat64Memory0() {
    if (cachedFloat64Memory0 === null || cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64Memory0;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length) >>> 0;
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len) >>> 0;

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3) >>> 0;
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

            } else {
                state.a = a;
            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_20(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__haa513970f3f93805(arg0, arg1, addHeapObject(arg2));
}

let stack_pointer = 128;

function addBorrowedObject(obj) {
    if (stack_pointer == 1) throw new Error('out of js stack');
    heap[--stack_pointer] = obj;
    return stack_pointer;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}

let cachedUint8ClampedMemory0 = null;

function getUint8ClampedMemory0() {
    if (cachedUint8ClampedMemory0 === null || cachedUint8ClampedMemory0.byteLength === 0) {
        cachedUint8ClampedMemory0 = new Uint8ClampedArray(wasm.memory.buffer);
    }
    return cachedUint8ClampedMemory0;
}

function getClampedArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ClampedMemory0().subarray(ptr / 1, ptr / 1 + len);
}
/**
*/
export class PaxChassisWeb {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(PaxChassisWeb.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_paxchassisweb_free(ptr);
    }
    /**
    * @returns {PaxChassisWeb}
    */
    static new() {
        const ret = wasm.paxchassisweb_new();
        return PaxChassisWeb.__wrap(ret);
    }
    /**
    * @param {string} native_interrupt
    * @param {any} additional_payload
    */
    interrupt(native_interrupt, additional_payload) {
        try {
            const ptr0 = passStringToWasm0(native_interrupt, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.paxchassisweb_interrupt(this.__wbg_ptr, ptr0, len0, addBorrowedObject(additional_payload));
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }
    /**
    * @returns {string}
    */
    tick() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.paxchassisweb_tick(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1);
        }
    }
}

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbg_log_f838f25d13618d3d(arg0, arg1) {
    console.log(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_number_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'number' ? obj : undefined;
    getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
    getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
};

export function __wbg_new_abda76e883ba8a5f() {
    const ret = new Error();
    return addHeapObject(ret);
};

export function __wbg_stack_658279fe44541cf6(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_error_f851667af71bcfc6(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1);
    }
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbg_createElement_5281e2aae74efc9d() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).createElement(getStringFromWasm0(arg1, arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_getElementsByClassName_18584cc532e8be6d(arg0, arg1, arg2) {
    const ret = getObject(arg0).getElementsByClassName(getStringFromWasm0(arg1, arg2));
    return addHeapObject(ret);
};

export function __wbg_instanceof_Window_f2bf9e8e91f1be0d(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Window;
    } catch {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_document_a11e2f345af07033(arg0) {
    const ret = getObject(arg0).document;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_innerWidth_5c3a8e1cc043fe23() { return handleError(function (arg0) {
    const ret = getObject(arg0).innerWidth;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_innerHeight_a56709a60e00b4d3() { return handleError(function (arg0) {
    const ret = getObject(arg0).innerHeight;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_devicePixelRatio_6a3c6863df6c69eb(arg0) {
    const ret = getObject(arg0).devicePixelRatio;
    return ret;
};

export function __wbg_addColorStop_8f9de440abe82950() { return handleError(function (arg0, arg1, arg2, arg3) {
    getObject(arg0).addColorStop(arg1, getStringFromWasm0(arg2, arg3));
}, arguments) };

export function __wbg_addEventListener_7759570e045ab41e() { return handleError(function (arg0, arg1, arg2, arg3) {
    getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
}, arguments) };

export function __wbg_length_f5b1ceb7591dd7a1(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_item_e1f4d2a1e1fdfb92(arg0, arg1) {
    const ret = getObject(arg0).item(arg1 >>> 0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_newwithu8clampedarray_c5701e028811ea19() { return handleError(function (arg0, arg1, arg2) {
    const ret = new ImageData(getClampedArrayU8FromWasm0(arg0, arg1), arg2 >>> 0);
    return addHeapObject(ret);
}, arguments) };

export function __wbg_setAttribute_e8e8474a029723cb() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_offsetWidth_d50e75dda437c6c8(arg0) {
    const ret = getObject(arg0).offsetWidth;
    return ret;
};

export function __wbg_offsetHeight_da38b61516adda47(arg0) {
    const ret = getObject(arg0).offsetHeight;
    return ret;
};

export function __wbg_instanceof_CanvasRenderingContext2d_b4050f3a451ac712(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof CanvasRenderingContext2D;
    } catch {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_setstrokeStyle_f2ef911474c901d5(arg0, arg1) {
    getObject(arg0).strokeStyle = getObject(arg1);
};

export function __wbg_setfillStyle_25271f3223864caf(arg0, arg1) {
    getObject(arg0).fillStyle = getObject(arg1);
};

export function __wbg_setlineWidth_1b222019f60209e7(arg0, arg1) {
    getObject(arg0).lineWidth = arg1;
};

export function __wbg_setlineCap_a8fddb08855cbdca(arg0, arg1, arg2) {
    getObject(arg0).lineCap = getStringFromWasm0(arg1, arg2);
};

export function __wbg_setlineJoin_eeaa2e5c7bde518d(arg0, arg1, arg2) {
    getObject(arg0).lineJoin = getStringFromWasm0(arg1, arg2);
};

export function __wbg_setmiterLimit_c5bb7092bbcc7a03(arg0, arg1) {
    getObject(arg0).miterLimit = arg1;
};

export function __wbg_setlineDashOffset_860be387d6b99e4a(arg0, arg1) {
    getObject(arg0).lineDashOffset = arg1;
};

export function __wbg_drawImage_41f8e8a7fc2b0de3() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).drawImage(getObject(arg1), arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
}, arguments) };

export function __wbg_beginPath_f08975b37e1c88bc(arg0) {
    getObject(arg0).beginPath();
};

export function __wbg_clip_4b479c02edfa3024(arg0, arg1) {
    getObject(arg0).clip(takeObject(arg1));
};

export function __wbg_fill_b0b2f88885f7e855(arg0, arg1) {
    getObject(arg0).fill(takeObject(arg1));
};

export function __wbg_stroke_ceb7b6c46a949efe(arg0) {
    getObject(arg0).stroke();
};

export function __wbg_createLinearGradient_921fdc0daa6862aa(arg0, arg1, arg2, arg3, arg4) {
    const ret = getObject(arg0).createLinearGradient(arg1, arg2, arg3, arg4);
    return addHeapObject(ret);
};

export function __wbg_createRadialGradient_3fcad5cac79b5f3d() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    const ret = getObject(arg0).createRadialGradient(arg1, arg2, arg3, arg4, arg5, arg6);
    return addHeapObject(ret);
}, arguments) };

export function __wbg_putImageData_0009acf77045dec6() { return handleError(function (arg0, arg1, arg2, arg3) {
    getObject(arg0).putImageData(getObject(arg1), arg2, arg3);
}, arguments) };

export function __wbg_setLineDash_bba1164998037530() { return handleError(function (arg0, arg1) {
    getObject(arg0).setLineDash(getObject(arg1));
}, arguments) };

export function __wbg_bezierCurveTo_ffb2533559ab1034(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    getObject(arg0).bezierCurveTo(arg1, arg2, arg3, arg4, arg5, arg6);
};

export function __wbg_closePath_7f0e8a353af0fd8f(arg0) {
    getObject(arg0).closePath();
};

export function __wbg_lineTo_5f48e7d4d8bef592(arg0, arg1, arg2) {
    getObject(arg0).lineTo(arg1, arg2);
};

export function __wbg_moveTo_77bb94706ea0eb69(arg0, arg1, arg2) {
    getObject(arg0).moveTo(arg1, arg2);
};

export function __wbg_quadraticCurveTo_d334fb2391d75b87(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).quadraticCurveTo(arg1, arg2, arg3, arg4);
};

export function __wbg_restore_36ee64528a0c158a(arg0) {
    getObject(arg0).restore();
};

export function __wbg_save_3b29f1c55c6c632a(arg0) {
    getObject(arg0).save();
};

export function __wbg_scale_1298186ae1d5c4df() { return handleError(function (arg0, arg1, arg2) {
    getObject(arg0).scale(arg1, arg2);
}, arguments) };

export function __wbg_instanceof_HtmlCanvasElement_6e58598b4e8b1586(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof HTMLCanvasElement;
    } catch {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_setwidth_885d5dd3c7f48f41(arg0, arg1) {
    getObject(arg0).width = arg1 >>> 0;
};

export function __wbg_setheight_0d2b445bb6a5a3f2(arg0, arg1) {
    getObject(arg0).height = arg1 >>> 0;
};

export function __wbg_getContext_62ccb1aa0e6c8b86() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).getContext(getStringFromWasm0(arg1, arg2));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_newnoargs_c9e6043b8ad84109(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_call_557a2f2deacc4912() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_self_742dd6eab3e9211e() { return handleError(function () {
    const ret = self.self;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_window_c409e731db53a0e2() { return handleError(function () {
    const ret = window.window;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_globalThis_b70c095388441f2d() { return handleError(function () {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_global_1c72617491ed7194() { return handleError(function () {
    const ret = global.global;
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_is_undefined(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbg_buffer_55ba7a6b1b92e2ac(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_new_09938a7d020f049b(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_set_3698e3ca519b3c3c(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

export function __wbg_length_0aab7ffd65ad19ed(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_newwithlength_04ccba51ab52357a(arg0) {
    const ret = new Float64Array(arg0 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_set_07da13cc24b69217() { return handleError(function (arg0, arg1, arg2) {
    const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
}, arguments) };

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper553(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 422, __wbg_adapter_20);
    return addHeapObject(ret);
};

