// ALMOST FULLY VIBED

export function attachTransliterator(textarea, engine) {
	let cachedValue = textarea.value;

	textarea.addEventListener("beforeinput", (e) => {
		// Handle bulk clipboard pastes
		if (e.inputType === "insertFromPaste" || e.inputType === "insertFromDrop") {
			e.preventDefault();
			const rawText = e.dataTransfer ? e.dataTransfer.getData("text") : (e.data || '');
			if (rawText) {
				const parsed = engine.convertBulk(rawText);
				textarea.setRangeText(parsed, textarea.selectionStart, textarea.selectionEnd, "end");
				cachedValue = textarea.value;
			}
			return;
		}

		// Handle physical live keystrokes
		if (e.inputType === "insertText" && e.data) {
			const incoming = e.data;
			const caretPos = textarea.selectionEnd;

			if (incoming.length === 1) {
				const lookbehind = textarea.value.slice(Math.max(0, caretPos - 4), caretPos);
				const action = engine.processKeystroke(lookbehind, incoming);

				if (action) {
					e.preventDefault();
					const startReplace = caretPos - action.replaceBehind;
					textarea.setRangeText(action.text, startReplace, caretPos, "end");
					cachedValue = textarea.value;
				}
			} else {
				e.preventDefault();
				const parsed = engine.convertBulk(incoming);
				textarea.setRangeText(parsed, textarea.selectionStart, caretPos, "end");
				cachedValue = textarea.value;
			}
		}
	});

	// Mobile IME auto-commit safety net
	textarea.addEventListener("input", () => {
		const current = textarea.value;
		if (current === cachedValue) return;

		let start = 0;
		while (start < current.length && start < cachedValue.length && current[start] === cachedValue[start]) {
			start++;
		}

		let endCurrent = current.length;
		let endCached = cachedValue.length;
		while (endCurrent > start && endCached > start && current[endCurrent - 1] === cachedValue[endCached - 1]) {
			endCurrent--;
			endCached--;
		}

		const dirtySlice = current.slice(start, endCurrent);
		if (dirtySlice) {
			const parsed = engine.convertBulk(dirtySlice);
			if (parsed !== dirtySlice) {
				textarea.setRangeText(parsed, start, endCurrent, "end");
			}
		}

		cachedValue = textarea.value;
	});
}