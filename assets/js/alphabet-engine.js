export const LIVE_MAP = new Map()
export const BULK_MAP = new Map()

const DEFAULT_UPPER_CASE_FUNCTION = (text) => text.toUpperCase();
const DEFAULT_TITLE_CASE_FUNCTION = (text) => text.slice(0,1).toUpperCase() + text.slice(1);
let maxLookbehind = null;

export function compileRules(
	rawRules, mode,
	upperCaseFunction = DEFAULT_UPPER_CASE_FUNCTION,
	titleCaseFunction = DEFAULT_TITLE_CASE_FUNCTION
) {
	LIVE_MAP.clear();
	BULK_MAP.clear();
	maxLookbehind = 0

	for (const [latin, foreign] of Object.entries(rawRules[mode]).sort((a, b) => a[0].length - b[0].length)) {
		BULK_MAP.set(latin, foreign);
		if (upperCaseFunction != null) BULK_MAP.set(upperCaseFunction(latin), upperCaseFunction(foreign));

		maxLookbehind = Math.max(maxLookbehind, latin.length-1);

		if (latin.length === 1) {
			LIVE_MAP.set(latin, foreign);
			if (upperCaseFunction != null) LIVE_MAP.set(upperCaseFunction(latin), upperCaseFunction(foreign));
		} else {
			const hybridKey = convertBulk(latin.slice(0, -1)) + latin.slice(-1);
			LIVE_MAP.set(hybridKey, foreign);
			if (upperCaseFunction != null) LIVE_MAP.set(upperCaseFunction(hybridKey), upperCaseFunction(foreign));
			if (titleCaseFunction != null) LIVE_MAP.set(titleCaseFunction(hybridKey), titleCaseFunction(foreign));
		}
	}

	console.log(LIVE_MAP);
}

export function processKeystroke(lookbehindWindow, incomingChar) {
	const validLookbehind = Math.min(maxLookbehind, lookbehindWindow.length);

	for (let lookbehind = validLookbehind; lookbehind >= 1; --lookbehind) {
		const candidate = lookbehindWindow.slice(-lookbehind) + incomingChar;
		if (LIVE_MAP.has(candidate)) {
			return {text: LIVE_MAP.get(candidate), replaceBehind: lookbehind};
		}
	}

	if (LIVE_MAP.has(incomingChar)) {
		return {text: LIVE_MAP.get(incomingChar), replaceBehind: 0};
	}

	return null;
}

export function convertBulk(text) {
	const SORTED_ENTRY_ARRAY = Array.from(BULK_MAP.entries()).sort((a, b) => b[0].length - a[0].length);
	let i = 0, output = "";

	while (i < text.length) {
		let matched = false;
		for (const [key, value] of SORTED_ENTRY_ARRAY) {
			if (text.slice(i, i + key.length) === key) {
				output += value;
				i += key.length;
				matched = true;
				break;
			}
		}
		if (!matched) {
			output += text[i]; i++;
		}
	}
	return output;
}