/**
 * Any character that can lead a UTF-8 sequence (`Â`…`ô`) followed by one that
 * can continue it (U+0080–U+00BF or a Windows-1252 "smart" character) — the
 * shape every double-encoding leaves behind (`Ã¼`, `âˆ’`, `Ð¼`, `Ì`+`ˆ`). It is
 * an oracle independent of `fixDoubleEncodedUtf8`, and deliberately broad: it
 * also flags correct text such as `É»`, so tests compare against what the
 * clean text itself scores. Assembled from code points because the linter's
 * autofix rewrites `\u` escapes into literal characters.
 */
const char = (code: number) => String.fromCodePoint(code);
const range = (from: number, to: number) => `${char(from)}-${char(to)}`;

const cp1252Continuation = [
	0x1_52, 0x1_53, 0x1_60, 0x1_61, 0x1_78, 0x1_7d, 0x1_7e, 0x1_92, 0x2_c6,
	0x2_dc, 0x21_22, 0x20_ac,
]
	.map((code) => char(code))
	.join('');

export const RESIDUAL = new RegExp(
	`[${range(0xc2, 0xf4)}][${range(0x80, 0xbf)}${cp1252Continuation}${range(0x20_13, 0x20_3a)}]`,
);
