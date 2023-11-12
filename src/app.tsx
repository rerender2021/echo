import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, AveRenderer, Grid, Window, getAppContext, IIconResource, IWindowComponentProps, Button, CheckBox, ICheckBoxComponentProps, ScrollBar, Label, IScrollBarComponentProps, Hyperlink } from "ave-react";
import { App, ThemePredefined_Dark, CheckValue } from "ave-ui";
import { VoskAsrEngine } from "./asr";
import { HelsinkiNlpEngine } from "./nlp";
import { containerLayout, controlLayout } from "./layout";
import { iconResource } from "./resource";
import { onMeasure, onTranslate, safe, shadowRelated } from "./shadow";
import { AsrConfig, getWebUiConfig, NlpConfig } from "./config";
import axios from "axios";
import { emitFlushEvent, isInitError, startEchoWebUI } from "./server";
import { assetsPath, runtimeAssetsPath } from "./common";

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
	BreakLongText = "长句分解",
	SetTopMost = "字幕置顶",
	SubtitleEn = "英文字幕",
	SubtitleZh = "中文字幕",
}

export function Echo() {
	const asrEngine = useMemo(
		() =>
			new VoskAsrEngine({
				...AsrConfig,
			}),
		[]
	);
	const nlpEngine = useMemo(
		() =>
			new HelsinkiNlpEngine({
				...NlpConfig,
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
			emitFlushEvent();
			shadowRelated.onUpdateTranslationResult({ en: "", zh: "" });
		} else if (checkValue === CheckValue.Checked) {
			shouldRecognize = true;
		}

		shadowRelated.shouldRecognize = shouldRecognize;
	}, []);

	const onSetBreakLongText = useCallback<ICheckBoxComponentProps["onCheck"]>((sender) => {
		let value = false;

		const checkValue = sender.GetValue();
		if (checkValue === CheckValue.Unchecked) {
			value = false;
		} else if (checkValue === CheckValue.Checked) {
			value = true;
		}

		shadowRelated.shouldBreakLongText = value;
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

	const [fontSize, setFontSize] = useState(16);
	const onSetFontSize = useCallback<IScrollBarComponentProps["onScrolling"]>((sender) => {
		const fontSize = sender.GetValue();
		shadowRelated.onUpdateFontSize(fontSize);
		setFontSize(fontSize);
	}, []);

	const [title, setTitle] = useState("Echo");
	const [asrReady, setAsrReady] = useState(false);
	const [isError, setIsError] = useState(false);

	useEffect(() => {
		initTheme();
		asrEngine
			.init()
			.then(
				safe(() => {
					setAsrReady(true);
					setIsError(isInitError());
				})
			)
			.catch((error) => {
				console.error(error?.message);
				setIsError(true);
			});
		nlpEngine
			.init()
			.then(
				safe(async () => {
					const port = NlpConfig.nlpPort;
					const response = await axios.get(`http://localhost:${port}/gpu`);
					if (response.data.gpu === "True") {
						console.log("great! use gpu");
						setTitle("Echo (GPU)");
					} else {
						console.log("gpu is not available");
					}
					setIsError(isInitError());
				})
			)
			.catch((error) => {
				console.error(error?.message);
				setIsError(true);
			});
		onTranslate(asrEngine, nlpEngine);
	}, []);

	const webUiLink = `http://localhost:${getWebUiConfig().port}`;

	const defaultHomeIconPath = assetsPath("snow.png");
	const defaultHomeRotateIconPath = assetsPath("snow-rotate.png");
	const customHomeIconPath = runtimeAssetsPath("./web-ui.png");
	const customHomeRotateIconPath = runtimeAssetsPath("./web-ui-hover.png");
	console.log("icon path", {
		customHomeIconPath,
		customHomeRotateIconPath
	});
	const [imgSrc, setImgSrc] = useState(customHomeIconPath ?? defaultHomeIconPath);
	const onEnterImage = () => {
		setImgSrc(customHomeRotateIconPath ?? defaultHomeRotateIconPath);
	};
	const onLeaveImage = () => {
		setImgSrc(customHomeIconPath ?? defaultHomeIconPath);
	};
	const gotoWebUi = () => {
		//  https://stackoverflow.com/a/49013356
		const url = webUiLink;
		const start = "start";
		require("child_process").exec(start + " " + url);
	};

	return (
		<Window title={title} size={{ width: 260, height: 350 }} onInit={onInit} onClose={onClose}>
			<Grid style={{ layout: containerLayout }}>
				<Grid style={{ area: containerLayout.areas.control, layout: controlLayout }}>
					<Grid style={{ area: controlLayout.areas.measure }}>
						<Button text={ButtonText.Measure} iconInfo={{ name: "measure", size: 16 }} onClick={onMeasure}></Button>
					</Grid>
					{asrReady && !isError ? (
						<>
							<Grid style={{ area: controlLayout.areas.recognize }}>
								<CheckBox text={ButtonText.Recognize} value={CheckValue.Unchecked} onCheck={onSetRecognize}></CheckBox>
							</Grid>
							<Grid style={{ area: controlLayout.areas.breakLongText }}>
								<CheckBox text={ButtonText.BreakLongText} value={CheckValue.Unchecked} onCheck={onSetBreakLongText}></CheckBox>
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
								<ScrollBar min={10} max={50} value={16} /** default value */ onScrolling={onSetFontSize}></ScrollBar>
							</Grid>
							<Grid style={{ area: controlLayout.areas.fontSizeValue }}>
								<Label text={`${fontSize}`}></Label>
							</Grid>
							<Grid style={{ area: controlLayout.areas.snow }}>
								<Image src={imgSrc} onPointerPress={gotoWebUi} onPointerEnter={onEnterImage} onPointerLeave={onLeaveImage} />
							</Grid>
						</>
					) : isError ? (
						<Grid style={{ area: controlLayout.areas.recognize }}>
							<Hyperlink text={`初始化失败, 查看问题: <${webUiLink}/>`} onClick={gotoWebUi} />
						</Grid>
					) : (
						<Grid style={{ area: controlLayout.areas.recognize }}>
							<Label text="初始化中..."></Label>
						</Grid>
					)}
				</Grid>
			</Grid>
		</Window>
	);
}

AveRenderer.render(<Echo />);

startEchoWebUI();
