/* tslint:disable */
/* eslint-disable */

export function miwear_connect(name: string, addr: string, authkey: string, sar_version: number, connect_type: string): Promise<any>;

export function miwear_disconnect(addr: string): Promise<void>;

export function miwear_get_connected_devices(): Promise<any>;

export function miwear_get_data(addr: string, data_type: string): Promise<any>;

export function miwear_get_file_type(file: Uint8Array, name: string): Promise<number>;

export function miwear_install(addr: string, res_type: number, data: Uint8Array, package_name?: string | null, progress_cb?: Function | null): Promise<void>;

export function register_event_sink(callback: Function): void;

export function thirdpartyapp_get_list(addr: string): Promise<any>;

export function thirdpartyapp_launch(addr: string, package_name: string, page: string): Promise<void>;

export function thirdpartyapp_send_message(addr: string, package_name: string, data: string): Promise<void>;

export function thirdpartyapp_uninstall(addr: string, package_name: string): Promise<void>;

export function watchface_get_list(addr: string): Promise<any>;

export function watchface_set_current(addr: string, watchface_id: string): Promise<void>;

export function watchface_uninstall(addr: string, watchface_id: string): Promise<void>;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly watchface_get_list: (a: number, b: number) => any;
  readonly watchface_set_current: (a: number, b: number, c: number, d: number) => any;
  readonly watchface_uninstall: (a: number, b: number, c: number, d: number) => any;
  readonly miwear_connect: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => any;
  readonly miwear_disconnect: (a: number, b: number) => any;
  readonly miwear_get_connected_devices: () => any;
  readonly miwear_get_data: (a: number, b: number, c: number, d: number) => any;
  readonly miwear_get_file_type: (a: any, b: number, c: number) => any;
  readonly miwear_install: (a: number, b: number, c: number, d: any, e: number, f: number, g: number) => any;
  readonly register_event_sink: (a: any) => void;
  readonly thirdpartyapp_get_list: (a: number, b: number) => any;
  readonly thirdpartyapp_launch: (a: number, b: number, c: number, d: number, e: number, f: number) => any;
  readonly thirdpartyapp_send_message: (a: number, b: number, c: number, d: number, e: number, f: number) => any;
  readonly thirdpartyapp_uninstall: (a: number, b: number, c: number, d: number) => any;
  readonly wasm_bindgen__convert__closures_____invoke__hc8702849172f9979: (a: number, b: number) => void;
  readonly wasm_bindgen__closure__destroy__h16115f788a13e6af: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__hbdedf0f4e8addf4b: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__closure__destroy__hb9cb89dd45fd81b1: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h473b62d12f7db584: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
