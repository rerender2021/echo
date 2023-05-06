import axios from "axios";
import { split } from "sentence-splitter";
import { AsrConfig } from "../config";

class SessionManager {
	private prevTextLength: number = Number.MAX_SAFE_INTEGER;
	isNewSession(asrText: string) {
		const result = asrText.length < this.prevTextLength;
		return result;
	}

	update(asrText: string) {
		this.prevTextLength = asrText.length;
	}
}

const sessionManager = new SessionManager();
const maxTextLength = 100;
const longTextLength = 60;
let tokenIndex = 0;

async function getTextToPunct(asrText: string) {
	if (asrText.length >= maxTextLength) {
		const port = AsrConfig.asrPort;
		const punctResponse = await axios.post(`http://localhost:${port}/punct`, { text: asrText }, { timeout: 1000 });
		const withPunct = punctResponse?.data?.text || "";
		return withPunct;
	} else {
		return asrText;
	}
}

function getSubarray(array: any[], from: number, to: number) {
	return array.slice(from, to + 1);
}

function getSentences(withPunct: string) {
	const raw = split(withPunct)
		?.map((each) => each?.raw?.trim())
		.filter((each) => Boolean(each));
	const sentences = [];
	raw.forEach((each) => {
		if (each.length >= longTextLength) {
			sentences.push(...each.split(",").map((each) => each?.trim()));
		} else {
			sentences.push(each);
		}
	});
	return sentences;
}

async function punctText(text: string) {
	const withPunct = await getTextToPunct(text);
	const sentences = getSentences(withPunct);

	// prettier-ignore
	const toIgnore = sentences.length === 1 ? [] : (
                        sentences.length >= 3 ? 
                        getSubarray(sentences, 0, sentences.length - 2) : 
                        [sentences[0]]
                    );

	let offset = 0;
	toIgnore.forEach((each) => {
		offset += each.split(" ").length;
	});

	const allToken = text.split(" ");
	const theRest = getSubarray(allToken, offset, allToken.length - 1);
	const lastUnstable = theRest.join(" ");
	return { lastUnstable, offset, sentences };
}

export async function postasr(asrText: string) {
	try {
		if (asrText) {
			const isNewSession = sessionManager.isNewSession(asrText);
			sessionManager.update(asrText);
			if (isNewSession) {
				tokenIndex = 0;
			}

			let result = asrText;

			if (asrText.length >= maxTextLength) {
				if (tokenIndex === 0) {
					const { lastUnstable, offset } = await punctText(asrText);
					tokenIndex = offset;
					result = lastUnstable;
				} else {
					const allToken = asrText.split(" ");
					const theRest = getSubarray(allToken, tokenIndex, allToken.length - 1);
					const currentUnstable = theRest.join(" ");
					result = currentUnstable;

					// still long text, punct it again
					if (currentUnstable.length >= maxTextLength) {
						const { lastUnstable, offset } = await punctText(currentUnstable);
						tokenIndex += offset;
						result = lastUnstable;
					}
				}
			}
			return result;
		}
	} catch (error) {
		console.log(`postasr failed: ${error?.message}`);
	}
}
