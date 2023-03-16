import axios from "axios";
import { split } from "sentence-splitter";
import { emptySentence } from "../shadow";
import { IAsrText, ISentence } from "./base";

export const sentenceToIgnore = new Set(["I.", "But.", "it.", "you", "My", "So I.", "But.", "For.", "The."]);

let uniqueId = 0;
function getNextId() {
	return ++uniqueId;
}

export class TranslationSpeech {
	private asrTextList: Array<IAsrText> = [];
	private sentenceList: Array<ISentence> = [];
	private lastUnstableList: Array<ISentence> = [];
	private sentenceIndexSet: Set<number> = new Set();
	private lastUnstableSentence: ISentence = emptySentence;
	private pSentence: number = 0;
	private longTextLength: number = 70;
	private session: TranslationSession;

	id = 0;

	constructor(session: TranslationSession) {
		this.session = session;
		this.id = getNextId();
	}

	getCurrentText() {
		return this.asrTextList[this.asrTextList.length - 1] || { text: "", time: 0 };
	}

	useSentence() {
		const current = this.sentenceList[this.pSentence];
		if (current) {
			++this.pSentence;
			return current;
		} else {
			return this.lastUnstableSentence;
		}
	}

	shouldBreakLongText(text: string) {
		return text.includes(",") && text.length >= this.longTextLength;
	}

	breakLongText(longText: string) {
		const out: Array<string> = [];
		let buffer = [];

		const shortTextList = longText.split(",");
		let length = 0;
		for (let i = 0; i < shortTextList.length; ++i) {
			const shortText = shortTextList[i].trim();
			buffer.push(shortText);
			length += shortText.length;
			if (buffer.length === 3) {
				const text = buffer.join(", ");
				if (text.length >= this.longTextLength) {
					out.push(...buffer);
				} else {
					out.push(text);
				}
				buffer = [];
				length = 0;
			}
		}

		if (buffer.length !== 0) {
			out.push(buffer.join(", "));
		}

		return out;
	}

	setLastUnstableSentence(text: string, time: number) {
		if (text) {
			const sentence: ISentence = {
				text,
				time,
				sessionId: this.session.id,
				speechId: this.id,
			};
			this.lastUnstableList.push(sentence);
			this.lastUnstableSentence = sentence;
		}
	}

	async addSentence(punctText: string, time: number) {
		const raw = split(punctText);
		const sentences: Array<string> = [];
		raw.forEach((each) => {
			const text = each?.raw?.trim() || "";
			if (this.shouldBreakLongText(text)) {
				const out = this.breakLongText(text);
				sentences.push(...out);
			} else if (text) {
				sentences.push(text);
			}
		});

		if (sentences.length >= 2) {
			sentences.forEach((text, index) => {
				const notLast = index !== sentences.length - 1;
				const notAdded = !this.sentenceIndexSet.has(index);
				if (notLast && notAdded) {
					this.sentenceIndexSet.add(index);
					if (text) {
						this.sentenceList.push({ text, time, speechId: this.id, sessionId: this.session.id });
					}
				}
			});
			this.setLastUnstableSentence(sentences[sentences.length - 1], time);
		} else {
			this.setLastUnstableSentence(sentences[0], time);
		}
	}

	async addPunctText(toPunct: string, time: number) {
		const response = await axios.post("http://localhost:8200/punct", { text: toPunct }, { timeout: 0 });
		const withPunct = response?.data?.text || "";
		if (withPunct) {
			const text = withPunct.replace(",.", "");
			await this.addSentence(text, time);
		}
	}

	// https://stackoverflow.com/a/4328722
	getTextWithoutPunct(text: string) {
		return text.replace(/[.,!;:?]/g, "");
	}

	getTextToPunct(oldAsrText: string, newAsrText: string) {
		const oldTokens = oldAsrText.split(" ");
		const newTokens = newAsrText.split(" ");
		const diffTokens = [];
		for (let i = 0; i < newTokens.length; ++i) {
			const newToken = newTokens[i];
			if (newToken !== oldTokens[i] && Boolean(newToken)) {
				const token = newToken.trim();
				diffTokens.push(token);
			}
		}

		const newText = diffTokens.join(" ");
		const lastUnstable = this.getTextWithoutPunct(this.lastUnstableSentence.text).toLowerCase();
		const toPunct = `${lastUnstable} ${newText}`.trim();

		return toPunct;
	}

	async addAsrText(text: string, time: number) {
		const current = this.getCurrentText();
		if (current.text !== text) {
			this.asrTextList.push({ text, time });
			const toPunct = this.getTextToPunct(current.text, text);
			await this.addPunctText(toPunct, time);
		}
	}

	isEmpty() {
		return this.asrTextList.length === 0;
	}
}

export class TranslationSession {
	private asrTextList: Array<IAsrText> = [];
	private speechList: Array<TranslationSpeech> = [];
	private lastTextLength: number = 0;
	id = 0;

	constructor() {
		this.id = getNextId();
	}

	isEmpty() {
		return this.speechList.length === 0;
	}

	getCurrentText() {
		return this.asrTextList[this.asrTextList.length - 1] || { text: "", time: 0 };
	}

	getCurrentSpeech() {
		return this.speechList[this.speechList.length - 1] || null;
	}

	async addAsrText(text: string, time: number) {
		const current = this.getCurrentText();
		if (current.text !== text) {
			if (this.lastTextLength === 0 || text.length < this.lastTextLength) {
				const speech = new TranslationSpeech(this);
				this.speechList.push(speech);
				this.asrTextList.push({ text, time });
				await speech.addAsrText(text, time);
			} else {
				const speech = this.getCurrentSpeech();
				this.asrTextList.push({ text, time });
				await speech?.addAsrText(text, time);
			}

			this.lastTextLength = text.length;
		}
	}

	async flushSpeech() {
		const speech = this.getCurrentSpeech();
		if (speech?.isEmpty()) {
			const lastAsrText = this.getCurrentText();
			await speech?.addAsrText(lastAsrText.text, lastAsrText.time);
		}
	}

	getCurrentSentence() {
		const speech = this.getCurrentSpeech();
		if (speech) {
			const sentence = speech.useSentence();
			if (sentenceToIgnore.has(sentence.text)) {
				return emptySentence;
			}
			return sentence;
		}

		return emptySentence;
	}
}
