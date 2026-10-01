/**
 * Repair for double-encoded UTF-8 ("mojibake") in ZEFIX responses.
 *
 * Since 2026-03-16 the ZEFIX PublicREST API serves the SOGC notice text
 * (`sogcPublication.message`, and the same text in `CompanyFull.sogcPub[]`)
 * double-encoded on most publication days: the UTF-8 bytes were once decoded
 * as Windows-1252 and re-encoded as UTF-8, so `ü` (bytes `C3 BC`) arrives as
 * the two characters `Ã¼`. The wire bytes are valid UTF-8 and the response is
 * plain `application/json`, so no decoder can catch it. Whole publication days
 * are affected or not (an upstream import-batch property); structured fields
 * (`name`, `legalSeat`, `legalSeatId`, address, purpose) are not affected.
 * Nothing is lost upstream — no U+FFFD, the NBSP of `à` (`C3 A0`) survives — so
 * the repair is exact.
 *
 * The misdecode is Windows-1252, not pure Latin-1: for bytes 0xA0–0xFF the two
 * agree (`ü`, `é`, `à`), but bytes 0x80–0x9F — the second byte of `ß`, `Ä`,
 * `Ö`, `Ü` and of `—`/`’` — become CP1252 "smart" characters outside U+0080–
 * U+00FF (`Ü` → `Ãœ`, `—` → `â€”`). A Latin-1-only repair misses those.
 *
 * The repair is SELECTIVE: only maximal runs of CP1252-decodable characters
 * that strict-decode as UTF-8 are reinterpreted, so clean text, genuinely
 * single-encoded characters and mixed strings (`Røjkjær` with only `æ`
 * double-encoded) pass through. It is idempotent.
 *
 * Pure and dependency-free (`TextDecoder` + `Uint8Array` only) — safe in
 * Node.js, Workers and browsers.
 *
 * @module text
 */

const STRICT_UTF8 = new TextDecoder('utf-8', {fatal: true});

/**
 * Windows-1252 0x80–0x9F "smart" characters → their byte value. The 5
 * undefined CP1252 bytes (0x81, 0x8D, 0x8F, 0x90, 0x9D) pass through as
 * U+0081… and are covered by the U+0080–U+00FF range in `runByte`.
 */
const CP1252_SPECIAL_TO_BYTE = new Map<number, number>([
	[0x20_ac, 0x80],
	[0x20_1a, 0x82],
	[0x01_92, 0x83],
	[0x20_1e, 0x84],
	[0x20_26, 0x85],
	[0x20_20, 0x86],
	[0x20_21, 0x87],
	[0x02_c6, 0x88],
	[0x20_30, 0x89],
	[0x01_60, 0x8a],
	[0x20_39, 0x8b],
	[0x01_52, 0x8c],
	[0x01_7d, 0x8e],
	[0x20_18, 0x91],
	[0x20_19, 0x92],
	[0x20_1c, 0x93],
	[0x20_1d, 0x94],
	[0x20_22, 0x95],
	[0x20_13, 0x96],
	[0x20_14, 0x97],
	[0x02_dc, 0x98],
	[0x21_22, 0x99],
	[0x01_61, 0x9a],
	[0x20_3a, 0x9b],
	[0x01_53, 0x9c],
	[0x01_7e, 0x9e],
	[0x01_78, 0x9f],
]);

/** The CP1252 byte a character stands for, or `undefined` if it cannot be one. */
function runByte(code: number): number | undefined {
	if (code >= 0x80 && code <= 0xff) {
		return code;
	}

	return CP1252_SPECIAL_TO_BYTE.get(code);
}

function hasCandidateByte(text: string): boolean {
	for (let i = 0; i < text.length; i++) {
		if (runByte(text.codePointAt(i)!) !== undefined) {
			return true;
		}
	}

	return false;
}

/**
 * Repair double-encoded UTF-8 in `text` (`ZÃ¼rich` → `Zürich`,
 * `gemÃ¤ÃŸ` → `gemäß`). Returns the input unchanged when there is nothing to
 * repair, so it is cheap to call on every string.
 */
export function fixDoubleEncodedUtf8(text: string): string {
	if (!hasCandidateByte(text)) {
		return text;
	}

	let out = '';
	let i = 0;
	const n = text.length;

	while (i < n) {
		const startByte = runByte(text.codePointAt(i)!);
		if (startByte === undefined) {
			out += text[i];
			i++;
			continue;
		}

		// Gather the maximal run of CP1252-decodable characters, reinterpret the
		// code points as raw bytes and strict-decode them as UTF-8.
		const bytes: number[] = [startByte];
		let j = i + 1;
		while (j < n) {
			const b = runByte(text.codePointAt(j)!);
			if (b === undefined) {
				break;
			}

			bytes.push(b);
			j++;
		}

		// Keep the run as-is unless it decodes cleanly (e.g. a lone valid `ø`).
		let repaired: string | undefined;
		try {
			repaired = STRICT_UTF8.decode(new Uint8Array(bytes));
		} catch {
			repaired = undefined;
		}

		out += repaired ?? text.slice(i, j);
		i = j;
	}

	return out;
}

/** True iff `text` contains a repairable double-encoding. */
export function looksDoubleEncoded(text: string): boolean {
	return fixDoubleEncodedUtf8(text) !== text;
}

/**
 * Return `value` with `fixDoubleEncodedUtf8` applied to every string inside it
 * (objects and arrays are walked; other values pass through). Mutates in place
 * and returns the same reference — response bodies are freshly parsed JSON.
 */
export function repairStringsDeep<T>(value: T): T {
	if (typeof value === 'string') {
		return fixDoubleEncodedUtf8(value) as T;
	}

	if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i++) {
			value[i] = repairStringsDeep(value[i]) as unknown;
		}

		return value;
	}

	if (typeof value === 'object' && value !== null) {
		const record = value as Record<string, unknown>;
		for (const key of Object.keys(record)) {
			record[key] = repairStringsDeep(record[key]);
		}
	}

	return value;
}
