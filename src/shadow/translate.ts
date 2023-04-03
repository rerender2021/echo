import { sleep, shadowRelated } from "./common";
import { IAsrEngine } from "../asr/base";
import { INlpEngine } from "../nlp/base";

export const onTranslate = async function (asrEngine: IAsrEngine, nlpEngine: INlpEngine) {
	_onRecognize(asrEngine);
	_onTranslate(nlpEngine);
	_onUpdateSubtitle();
};

let prevLength = Number.MAX_SAFE_INTEGER;
let lastUpdateTime = Date.now();
const subtitleDelay = 250;

const _onUpdateSubtitle = async function () {
	try {
		if (!shadowRelated.shouldRecognize) {
			shadowRelated.subtitleQueue = [];
			return;
		}
		const current = shadowRelated.subtitleQueue.shift();
		if (current) {
			const now = Date.now();
			if (current.en.length < prevLength) {
				// length change, a new subtitle found!
				const dt = now - lastUpdateTime;
				if (dt <= subtitleDelay) {
					await sleep(Math.abs(subtitleDelay - dt));
				}
			}
			shadowRelated.onUpdateTranslationResult(current);
			prevLength = current.en.length || 0;
			lastUpdateTime = Date.now();
		}
	} catch (error) {
		console.error("recognize failed", error);
	} finally {
		setTimeout(() => {
			_onUpdateSubtitle();
		}, 0);
	}
};

const _onRecognize = async function (asrEngine: IAsrEngine) {
	try {
		if (!shadowRelated.shouldRecognize) {
			return;
		}
		const asrStart = Date.now();
		const sentence = await asrEngine.recognize();
		const asrEnd = Date.now();

		if (sentence.text && sentence.text !== shadowRelated.prevSentence.text) {
			console.log(`asr end in ${asrEnd - asrStart}ms`);
			shadowRelated.prevSentence = sentence;
			shadowRelated.shouldTranslate = true;
		}
	} catch (error) {
		console.error("recognize failed", error);
	} finally {
		setTimeout(() => {
			_onRecognize(asrEngine);
		}, 100);
	}
};
const _onTranslate = async function (nlpEngine: INlpEngine) {
	try {
		if (!shadowRelated.shouldRecognize) {
			return;
		}

		if (!shadowRelated.subtitleConfig.zh) {
			const { text, ...rest } = shadowRelated.prevSentence;
			shadowRelated.subtitleQueue.push({ zh: "", en: text, ...rest });
			return;
		}

		if (shadowRelated.shouldTranslate) {
			shadowRelated.shouldTranslate = false;
			console.log("will translate");
			const translateStart = Date.now();
			const { text: enText, ...rest } = shadowRelated.prevSentence;
			const input = enText;
			const { text } = await nlpEngine.translate(input);
			shadowRelated.prevTranslation = text;
			const translateEnd = Date.now();
			console.log(`translate end in ${translateEnd - translateStart}ms`, { enText: input, text });
			shadowRelated.subtitleQueue.push({ zh: shadowRelated.prevTranslation, en: input, ...rest });
		}
	} catch (error) {
		console.error("translate failed", error);
	} finally {
		setTimeout(() => {
			_onTranslate(nlpEngine);
		}, 500);
	}
};
