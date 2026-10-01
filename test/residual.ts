/**
 * The double-encoding shapes the upstream defect produces (`Ã¼`, `Ãœ`, `â€”`,
 * `Â«`) — an oracle independent of `fixDoubleEncodedUtf8`, so "no residual"
 * is not defined in terms of the repair under test. Assembled from code points
 * because the linter's autofix rewrites `\u` escapes into literal characters
 * (one of them a no-break space it then rejects).
 */
const char = (code: number) => String.fromCodePoint(code);
const range = (from: number, to: number) => `${char(from)}-${char(to)}`;

const aTilde = char(0xc3); // Ã
const aCircumflex = char(0xc2); // Â
const cp1252Continuation = [
	0x1_52, 0x1_53, 0x1_60, 0x1_61, 0x1_78, 0x1_7d, 0x1_7e,
]
	.map((code) => char(code))
	.join('');

export const RESIDUAL = new RegExp(
	[
		`${aTilde}[${range(0x80, 0xbf)}${cp1252Continuation}${range(0x20_13, 0x20_3a)}]`,
		`${char(0xe2)}${char(0x20_ac)}`, // U+00E2 U+20AC: lead of a mangled — ’ “
		`${aCircumflex}[${range(0xa0, 0xbf)}]`,
	].join('|'),
);
