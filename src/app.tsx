import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AveRenderer, Grid, Window, getAppContext, IIconResource, IWindowComponentProps, Button, CheckBox, ICheckBoxComponentProps, ScrollBar, Label, IScrollBarComponentProps } from "ave-react";
import { App, ThemePredefined_Dark, CheckValue } from "ave-ui";
import { VoskAsrEngine } from "./asr";
import { HelsinkiNlpEngine } from "./nlp";
import { containerLayout, controlLayout } from "./layout";
import { iconResource } from "./resource";
import { logger, onMeasure, onTranslate, shadowRelated } from "./shadow";
import { getAsrConfig, getNlpConfig } from "./config";

function onInit(app: App) {
	const context = getAppContext();
	context.setIconResource(iconResource as unknown as IIconResource);
}

function initTheme() {
	const context = getAppContext();
	const themeImage = context.getThemeImage();
	const themeDark = new ThemePredefined_Dark();
	themeDark.SetStyle(themeImage, 0);
}

enum ButtonText {
	Measure = "设置字幕区",
	Recognize = "语音识别",
	SetTopMost = "字幕置顶",
	SubtitleEn = "英文字幕",
	SubtitleZh = "中文字幕",
}

export function Echo() {
	const asrEngine = useMemo(
		() =>
			new VoskAsrEngine({
				...getAsrConfig(),
			}),
		[]
	);
	const nlpEngine = useMemo(
		() =>
			new HelsinkiNlpEngine({
				...getNlpConfig(),
			}),
		[]
	);
	const onClose = useCallback<IWindowComponentProps["onClose"]>(() => {
		asrEngine.destroy();
		nlpEngine.destroy();
	}, []);

	const onSetTopMost = useCallback<ICheckBoxComponentProps["onCheck"]>((sender) => {
		let shouldTopMost = true;

		const checkValue = sender.GetValue();
		if (checkValue === CheckValue.Unchecked) {
			shouldTopMost = false;
		} else if (checkValue === CheckValue.Checked) {
			shouldTopMost = true;
		}

		shadowRelated.displayWindow?.SetTopMost(shouldTopMost);
		if (!shadowRelated.displayWindow) {
			shadowRelated.defaultTopMost = shouldTopMost;
		}
	}, []);

	const onSetRecognize = useCallback<ICheckBoxComponentProps["onCheck"]>((sender) => {
		shadowRelated.subtitleQueue = [];

		let shouldRecognize = false;

		const checkValue = sender.GetValue();
		if (checkValue === CheckValue.Unchecked) {
			shouldRecognize = false;
			logger.end();
		} else if (checkValue === CheckValue.Checked) {
			shouldRecognize = true;
			logger.start();
		}

		shadowRelated.shouldRecognize = shouldRecognize;
	}, []);

	const onSetDisplaySubtitle = useCallback<ICheckBoxComponentProps["onCheck"]>((sender) => {
		const checkValue = sender.GetValue();
		const text = sender.GetText();
		const isChecked = checkValue === CheckValue.Checked;
		if (text === ButtonText.SubtitleEn) {
			shadowRelated.subtitleConfig.en = isChecked;
		} else if (text === ButtonText.SubtitleZh) {
			shadowRelated.subtitleConfig.zh = isChecked;
		}
		shadowRelated.onUpdateTranslationConfig();
	}, []);

	const [fontSize, setFontSize] = useState(24);
	const onSetFontSize = useCallback<IScrollBarComponentProps["onScrolling"]>((sender) => {
		const fontSize = sender.GetValue();
		shadowRelated.onUpdateFontSize(fontSize);
		setFontSize(fontSize);
	}, []);

	useEffect(() => {
		initTheme();
		asrEngine.init();
		nlpEngine.init();
		onTranslate(asrEngine, nlpEngine);
	}, []);

	return (
		<Window title="Echo" size={{ width: 260, height: 350 }} onInit={onInit} onClose={onClose}>
			<Grid style={{ layout: containerLayout }}>
				<Grid style={{ area: containerLayout.areas.control, layout: controlLayout }}>
					<Grid style={{ area: controlLayout.areas.measure }}>
						<Button text={ButtonText.Measure} iconInfo={{ name: "measure", size: 16 }} onClick={onMeasure}></Button>
					</Grid>
					<Grid style={{ area: controlLayout.areas.recognize }}>
						<CheckBox text={ButtonText.Recognize} value={CheckValue.Unchecked} onCheck={onSetRecognize}></CheckBox>
					</Grid>
					<Grid style={{ area: controlLayout.areas.topmost }}>
						<CheckBox text={ButtonText.SetTopMost} value={CheckValue.Checked} onCheck={onSetTopMost}></CheckBox>
					</Grid>
					<Grid style={{ area: controlLayout.areas.en }}>
						<CheckBox text={ButtonText.SubtitleEn} value={CheckValue.Checked} onCheck={onSetDisplaySubtitle}></CheckBox>
					</Grid>
					<Grid style={{ area: controlLayout.areas.zh }}>
						<CheckBox text={ButtonText.SubtitleZh} value={CheckValue.Checked} onCheck={onSetDisplaySubtitle}></CheckBox>
					</Grid>
					<Grid style={{ area: controlLayout.areas.fontSizeLabel }}>
						<Label text="字体大小"></Label>
					</Grid>
					<Grid style={{ area: controlLayout.areas.fontSize, margin: "10dpx 0 10dpx 0" }}>
						<ScrollBar min={10} max={50} value={24} /** default value */ onScrolling={onSetFontSize}></ScrollBar>
					</Grid>
					<Grid style={{ area: controlLayout.areas.fontSizeValue }}>
						<Label text={`${fontSize}`}></Label>
					</Grid>
				</Grid>
			</Grid>
		</Window>
	);
}

AveRenderer.render(<Echo />);
