/**
 * Repair for double-encoded UTF-8 ("mojibake") in ZEFIX SOGC notice text.
 *
 * Since 2026-03-16 the ZEFIX PublicREST API serves the SOGC notice text
 * (`sogcPublication.message`, and the same text in `CompanyFull.sogcPub[]`)
 * double-encoded on most publication days: the UTF-8 bytes were once decoded
 * as Windows-1252 and re-encoded as UTF-8, so `ü` (bytes `C3 BC`) arrives as
 * the two characters `Ã¼`. The wire bytes are valid UTF-8 and the response is
 * plain `application/json`, so no decoder can catch it. Whole publication days
 * are affected or not; structured fields (`name`, `legalSeat`, address,
 * purpose) are not. Nothing is lost upstream, so the repair is exact.
 *
 * The misdecode is Windows-1252, not Latin-1: a continuation byte in 0x80–0x9F
 * becomes a CP1252 "smart" character (`Ü` → `Ãœ`, `ß` → `ÃŸ`, `—` → `â€”`).
 *
 * The repair works per UTF-8 SEQUENCE (a lead char + its continuation chars,
 * read back through Windows-1252 and strict-decoded), because an innocent pair
 * of correct characters can also form valid UTF-8 (`É»` = C9 BB = `ɻ`,
 * `ß“` = DF 93 = `ߓ`). Upstream garbles a notice WHOLE, so the decision is
 * made per string:
 *
 *  - whole: every non-ASCII character belongs to a valid sequence, and there is
 *    strong evidence (a sequence led by `Â`/`Ã`, or punctuation/currency like
 *    `â€”`) or at least two sequences → every sequence is repaired, including
 *    `âˆ’` (−), `Ð¼` (Cyrillic), `Ì` + `ˆ` (combining marks) and emoji.
 *  - mixed: correct non-ASCII text sits outside the sequences → only the
 *    strong sequences and Latin Extended letters (`Å¡` → `š`, `Ä‡` → `ć`) are
 *    repaired. A letter led by `Ä`/`Æ`/`Ç`/`È`/`É` followed by a double quote
 *    or guillemet (`È»`, `Ä“`, `É»`) is correct text far more often than a
 *    garbled `ē`/`Ȼ`, so `«PERCHÈ» Ã¼` → `«PERCHÈ» ü`. (Mixed strings come
 *    from the source registry itself, which sometimes stores `KriÅ¡to`.)
 *  - otherwise nothing changes: `«CAFÉ»`, `„Fuß“`, `«SPÄ»` are left alone.
 *
 * The repair loops until its output stops changing (text garbled more than
 * once comes back clean), so `fixDoubleEncodedUtf8` is idempotent. Bytes
 * Windows-1252 leaves undefined (0x81 0x8D 0x8F 0x90 0x9D — in `Á Í Ï Ð Ý`)
 * are repaired when upstream keeps them as C1 controls, as ZEFIX does; text
 * where they became `?` or U+FFFD is lost and left as-is.
 *
 * Pure (`TextDecoder` + `Uint8Array`) — safe in Node.js, Workers and browsers.
 *
 * @module text
 */

const STRICT_UTF8 = new TextDecoder('utf-8', {fatal: true});

/** Windows-1252 0x80–0x9F "smart" characters → their byte value. */
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

/** The byte a misdecoded character stands for (U+0080–U+00FF map to themselves). */
function toByte(char: string): number {
	const code = char.codePointAt(0)!;
	return code <= 0xff ? code : CP1252_SPECIAL_TO_BYTE.get(code)!;
}

/** A continuation byte 0x80–0xBF as it appears after a CP1252 misdecode. */
const CONTINUATION = `[\\u0080-\\u00BF${[...CP1252_SPECIAL_TO_BYTE.keys()]
	.map((code) => `\\u${code.toString(16).padStart(4, '0')}`)
	.join('')}]`;

const SEQUENCE = new RegExp(
	`[\\u00C2-\\u00DF]${CONTINUATION}|[\\u00E0-\\u00EF]${CONTINUATION}{2}|[\\u00F0-\\u00F4]${CONTINUATION}{3}`,
	'g',
);
const CANDIDATE_LEAD = /[Â-ô]/;

/** UTF-16 code units outside ASCII (comparable with a sequence match's `.length`). */
function countNonAscii(text: string): number {
	let count = 0;
	for (let i = 0; i < text.length; i++) {
		if (text.codePointAt(i)! > 0x7f) {
			count++;
		}
	}

	return count;
}

type Fix = {
	index: number;
	length: number;
	value: string;
	/** Proves the string is double-encoded (whole-string mode). */
	strong: boolean;
	/** Safe to repair even in a mixed string. */
	safe: boolean;
};

/** Closing/opening double quotes and guillemets: what follows `Ä`/`É` in correct text. */
const QUOTE_AFTER_CAPITAL = new Set([0xab, 0xbb, 0x20_1c, 0x20_1d, 0x20_1e]);

/** A Latin Extended letter, unless it is `Ä`/`Æ`/`Ç`/`È`/`É` before a quote. */
function isLatinLetter(lead: number, second: number, decoded: number): boolean {
	if (decoded < 0x1_00 || decoded > 0x2_4f) {
		return false;
	}

	return lead === 0xc5 || !QUOTE_AFTER_CAPITAL.has(second);
}

/** Strong evidence: only a double-encoding plausibly produces this sequence. */
function isStrong(lead: number, decoded: number): boolean {
	return (
		(lead <= 0xc3 && decoded >= 0xa0) || // Â/Ã + continuation → Latin-1
		(decoded >= 0x20_00 && decoded <= 0x20_6f) || // General Punctuation
		(decoded >= 0x20_a0 && decoded <= 0x20_cf) || // Currency Symbols
		(decoded >= 0x21_00 && decoded <= 0x21_4f) // Letterlike Symbols
	);
}

function findFixes(text: string): Fix[] {
	const fixes: Fix[] = [];
	for (const match of text.matchAll(SEQUENCE)) {
		const chars = [...match[0]];
		const bytes = Uint8Array.from(chars, (char) => toByte(char));
		let value: string;
		try {
			value = STRICT_UTF8.decode(bytes);
		} catch {
			continue;
		}

		// A C1 control (U+0080–U+009F) is never strong evidence: it is only ever
		// an intermediate layer of text garbled more than once (`Â\u0081` → `Ł`).
		const decoded = value.codePointAt(0)!;
		const strong = isStrong(bytes[0], decoded);
		fixes.push({
			index: match.index,
			length: match[0].length,
			value,
			strong,
			safe:
				strong || isLatinLetter(bytes[0], chars[1].codePointAt(0)!, decoded),
		});
	}

	return fixes;
}

function repairOnce(text: string): string {
	if (!CANDIDATE_LEAD.test(text)) {
		return text;
	}

	const fixes = findFixes(text);
	if (fixes.length === 0) {
		return text;
	}

	const covered = fixes.reduce((sum, fix) => sum + fix.length, 0);
	const nonAscii = countNonAscii(text);
	const strong = fixes.filter((fix) => fix.strong).length;
	const whole = covered === nonAscii && (strong > 0 || fixes.length >= 2);
	const accepted = whole ? fixes : fixes.filter((fix) => fix.safe);
	if (accepted.length === 0) {
		return text;
	}

	let out = '';
	let cursor = 0;
	for (const fix of accepted) {
		out += text.slice(cursor, fix.index) + fix.value;
		cursor = fix.index + fix.length;
	}

	return out + text.slice(cursor);
}

/**
 * Repair double-encoded UTF-8 in `text` (`ZÃ¼rich` → `Zürich`,
 * `gemÃ¤ÃŸ` → `gemäß`). Returns the input unchanged when there is nothing to
 * repair, so it is cheap to call on every string. Idempotent.
 */
export function fixDoubleEncodedUtf8(text: string): string {
	let current = text;
	// Each pass peels one layer; three covers any realistic re-encoding chain.
	for (let pass = 0; pass < 3; pass++) {
		const next = repairOnce(current);
		if (next === current) {
			return current;
		}

		current = next;
	}

	return current;
}

/** True iff `fixDoubleEncodedUtf8` would change `text`. */
export function looksDoubleEncoded(text: string): boolean {
	return fixDoubleEncodedUtf8(text) !== text;
}

type SogcPublicationLike = {message?: unknown};
type ResponseItem = {
	sogcPublication?: SogcPublicationLike;
	sogcPub?: unknown;
};

function repairPublication<T>(publication: T): T {
	const message = (publication as SogcPublicationLike | undefined)?.message;
	if (typeof message !== 'string') {
		return publication;
	}

	const fixed = fixDoubleEncodedUtf8(message);
	return fixed === message ? publication : {...publication, message: fixed};
}

function repairItem<T>(item: T): T {
	if (typeof item !== 'object' || item === null) {
		return item;
	}

	const {sogcPublication, sogcPub} = item as ResponseItem;
	let out = item;
	if (sogcPublication) {
		const repaired = repairPublication(sogcPublication);
		if (repaired !== sogcPublication) {
			out = {...out, sogcPublication: repaired};
		}
	}

	if (Array.isArray(sogcPub)) {
		const repaired = sogcPub.map((publication) =>
			repairPublication(publication),
		);
		if (repaired.some((publication, i) => publication !== sogcPub[i])) {
			out = {...out, sogcPub: repaired};
		}
	}

	return out;
}

/**
 * Repair the SOGC notice text in a ZEFIX response or stored record — the only
 * field the upstream defect touches: `sogcPublication.message` (SOGC endpoints,
 * `SogcPublicationAndCompanyShort`) and `sogcPub[].message` (company endpoints,
 * `CompanyFull`). Accepts one record or an array of them. Never mutates its
 * input: changed records are copied, untouched ones returned as-is.
 */
export function repairSogcMessages<T>(data: T): T {
	if (Array.isArray(data)) {
		const repaired = data.map((item: unknown) => repairItem(item));
		return (
			repaired.some((item, i) => item !== data[i]) ? repaired : data
		) as T;
	}

	return repairItem(data);
}
