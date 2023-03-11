import React, { useCallback, useEffect, useMemo } from "react";
import { AveRenderer, Grid, Window, getAppContext, IIconResource, IWindowComponentProps, Button, CheckBox, ICheckBoxComponentProps } from "ave-react";
import { App, ThemePredefined_Dark, CheckValue } from "ave-ui";
import { VoskAsrEngine } from "./asr";
import { HelsinkiNlpEngine } from "./nlp";
import { containerLayout, controlLayout } from "./layout";
import { iconResource } from "./resource";
import { onMeasure, onTranslate, shadowRelated } from "./shadow";
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
		let shouldRecognize = false;

		const checkValue = sender.GetValue();
		if (checkValue === CheckValue.Unchecked) {
			shouldRecognize = false;
		} else if (checkValue === CheckValue.Checked) {
			shouldRecognize = true;
		}

		shadowRelated.shouldRecognize = shouldRecognize;
	}, []);

	const onSetPunct = useCallback<ICheckBoxComponentProps["onCheck"]>((sender) => {
		let shouldResotrePunct = false;

		const checkValue = sender.GetValue();
		if (checkValue === CheckValue.Unchecked) {
			shouldResotrePunct = false;
		} else if (checkValue === CheckValue.Checked) {
			shouldResotrePunct = true;
		}

		shadowRelated.shouldResotrePunct = shouldResotrePunct;
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
						<Button text="设置字幕区" iconInfo={{ name: "measure", size: 16 }} onClick={onMeasure}></Button>
					</Grid>
					<Grid style={{ area: controlLayout.areas.recognize }}>
						<CheckBox text="语音识别" value={CheckValue.Unchecked} onCheck={onSetRecognize}></CheckBox>
					</Grid>
					<Grid style={{ area: controlLayout.areas.punct }}>
						<CheckBox text="标点恢复" value={CheckValue.Unchecked} onCheck={onSetPunct}></CheckBox>
					</Grid>
					<Grid style={{ area: controlLayout.areas.topmost }}>
						<CheckBox text="字幕置顶" value={CheckValue.Checked} onCheck={onSetTopMost}></CheckBox>
					</Grid>
				</Grid>
			</Grid>
		</Window>
	);
}

AveRenderer.render(<Echo />);
