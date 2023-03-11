import { sleep, shadowRelated } from "./common";
import { IAsrEngine } from "../asr/base";
import { INlpEngine } from "../nlp/base";

async function updateSubtitle() {
	const both = `${shadowRelated.prevAsrText}\n${shadowRelated.prevTranslation}`;
	shadowRelated.onUpdateTranslationResult(both);
	// at least display it for 100ms?
	// await sleep(100);
}

export const onTranslate = async function (asrEngine: IAsrEngine, nlpEngine: INlpEngine) {
	_onRecognize(asrEngine);
	_onTranslate(nlpEngine);
};

const _onRecognize = async function (asrEngine: IAsrEngine) {
	try {
		if (!shadowRelated.shouldRecognize) {
			return;
		}
		const asrStart = Date.now();
		const asrResult = await asrEngine.recognize();
		const asrEnd = Date.now();
		console.log(`asr end in ${asrEnd - asrStart}ms`);
		if (asrResult.text && asrResult.text !== shadowRelated.prevAsrText) {
			shadowRelated.prevAsrText = asrResult.text;
			shadowRelated.shouldTranslate = true;
			await updateSubtitle();
		}
	} catch (error) {
		console.error("recognize failed", error);
	} finally {
		await sleep(100);
		await _onRecognize(asrEngine);
	}
};
const _onTranslate = async function (nlpEngine: INlpEngine) {
	try {
		if (!shadowRelated.shouldRecognize) {
			return;
		}
		if (shadowRelated.shouldTranslate) {
			shadowRelated.shouldTranslate = false;
			console.log("will translate");
			const translateStart = Date.now();
			const { text } = await nlpEngine.translate(shadowRelated.prevAsrText);
			shadowRelated.prevTranslation = text;
			const translateEnd = Date.now();
			console.log(`translate end in ${translateEnd - translateStart}ms`);
			await updateSubtitle();
		}
	} catch (error) {
		console.error("translate failed", error);
	} finally {
		await sleep(500);
		await _onTranslate(nlpEngine);
	}
};
