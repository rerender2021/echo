import { safe, shadowRelated } from "./common";
import { WindowFramePart, RichLabelColor, RichLabelBackColor, RichLabelTextColor, Rect, Byo2Font, AlignType, RichLabel as NativeRichLabel, IGridControl, DpiSize_2, DpiSize, CursorType, DockMode, Vec2, Vec4, Grid as NativeGrid, Window as NativeWindow, WindowFlag, WindowCreation, ImageContainerType, ImageData, ImageDimension, Byo2Image, AveImage, Picture as NativePicture, App, ThemePredefined_Dark, StretchMode, AveGetClipboard, CodeEditor as NativeEditor, ResourceSource, Byo2ImageCreation, Byo2ImageDataType, PixFormat } from "ave-ui";

export const onDisplay = safe(async function () {
	if (!shadowRelated.displayWindow) {
		console.log("display window not initialized, init it");
		const cp = new WindowCreation();
		cp.Flag |= WindowFlag.Layered;
		cp.Title = "Display";

		const width = shadowRelated.selectedArea.end.x - shadowRelated.selectedArea.start.x;
		const height = shadowRelated.selectedArea.end.y - shadowRelated.selectedArea.start.y;

		cp.Layout.Size = new Vec2(width || 300, height || 120);
		cp.Layout.Position = new Vec2(shadowRelated.selectedArea.start.x, shadowRelated.selectedArea.start.y);

		shadowRelated.displayWindow = new NativeWindow(cp);
	}

	if (!shadowRelated.displayWindow.IsWindowCreated()) {
		console.log("display window not created, create it");

		shadowRelated.displayWindow.OnCreateContent(
			safe(() => {
				console.log("display window create content callback");

				shadowRelated.displayWindow.SetBackground(false);
				shadowRelated.displayWindow.SetTopMost(shadowRelated.defaultTopMost);

				const frame = shadowRelated.displayWindow.GetFrame();
				frame.SetCaptionVisible(false);
				frame.OnNcHitTest(
					safe((sender, pos, part) => {
						if (part == WindowFramePart.Client) return WindowFramePart.Caption;
						return part;
					})
				);

				const container = new NativeGrid(shadowRelated.displayWindow);
				{
					const content = new NativeGrid(shadowRelated.displayWindow);
					const color = new Vec4(0, 0, 0, 255);
					content.SetBackColor(color);
					content.SetOpacity(0.5);
					container.ControlAdd(content).SetDock(DockMode.Fill);

					const label = new NativeRichLabel(shadowRelated.displayWindow);

					const fd = shadowRelated.displayWindow.GetTheme().GetFont();
					fd.Size = 24;
					const fontDef = new Byo2Font(shadowRelated.displayWindow, fd);

					const textColor = new RichLabelTextColor();
					textColor.Text.Color = new Vec4(255, 255, 255, 255);

					label.FmSetDefaultFont(fontDef);
					label.FmSetDefaultTextColor(textColor);

					label.SetAlignHorz(AlignType.Center);
					label.SetAlignVert(AlignType.Center);

					// TODO: crash when use "" 
					label.SetText(" ");
					shadowRelated.onUpdateTranslationResult = safe((text) => {
						label.SetText(text);
					});

					container.ControlAdd(label).SetGrid(0, 0);
				}

				shadowRelated.displayWindow.SetSize(new Vec2(shadowRelated.selectedArea.end.x - shadowRelated.selectedArea.start.x, shadowRelated.selectedArea.end.y - shadowRelated.selectedArea.start.y));
				shadowRelated.displayWindow.SetPosition(new Vec2(shadowRelated.selectedArea.start.x, shadowRelated.selectedArea.start.y));
				shadowRelated.displayWindow.SetContent(container);

				console.log("display window set content");
				return true;
			})
		);

		const result = shadowRelated.displayWindow.CreateWindow(shadowRelated.measureWindow);
		console.log("display window create result", result);
	}

	if (shadowRelated.displayWindow.IsWindowCreated()) {
		console.log("display window reset pos");

		shadowRelated.displayWindow.SetSize(new Vec2(shadowRelated.selectedArea.end.x - shadowRelated.selectedArea.start.x, shadowRelated.selectedArea.end.y - shadowRelated.selectedArea.start.y));
		shadowRelated.displayWindow.SetPosition(new Vec2(shadowRelated.selectedArea.start.x, shadowRelated.selectedArea.start.y));

		console.log("display window created, activate it");

		shadowRelated.displayWindow.SetVisible(true);
		shadowRelated.displayWindow.Activate();

		console.log("activate display window done");
	}
});
