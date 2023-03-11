import { DpiSize_2, DpiSize, CursorType, DockMode, Vec2, Vec4, Grid as NativeGrid, Window as NativeWindow, WindowFlag, WindowCreation } from "ave-ui";
import { sleep, getPrimaryMonitor, safe, shadowRelated } from "./common";
import { onDisplay } from "./display";

export const onReset = safe(async function () {
	if (!shadowRelated.displayWindow) {
		return;
	}

	const rect = shadowRelated.displayWindow.GetRect();
	shadowRelated.selectedArea.start = rect.Position.Clone();
	shadowRelated.selectedArea.end = new Vec2(rect.Position.x + rect.Size.x, rect.Position.y + rect.Size.y);
});

export const onMeasure = safe(async function () {
	if (!shadowRelated.measureWindow) {
		console.log("measure window not initialized, init it");
		const cp = new WindowCreation();
		cp.Flag |= WindowFlag.Layered;
		cp.Flag |= WindowFlag.Indicator;
		cp.Title = "Measure";

		cp.Layout.Position = new Vec2(0, 0);
		const primary = getPrimaryMonitor();
		cp.Layout.Size = primary.AreaFull.Size;

		shadowRelated.measureWindow = new NativeWindow(cp);
	}

	if (!shadowRelated.measureWindow.IsWindowCreated()) {
		console.log("measure window not created, create it");

		shadowRelated.measureWindow.OnCreateContent(
			safe(() => {
				console.log("measure window create content callback");

				shadowRelated.measureWindow.SetBackground(false);
				shadowRelated.measureWindow.OnPointerCursor(() => CursorType.Cross);

				const container = new NativeGrid(shadowRelated.measureWindow);
				{
					const content = new NativeGrid(shadowRelated.measureWindow);
					const color = new Vec4(0, 0, 0, 255);
					content.SetBackColor(color);
					content.SetOpacity(0.7);
					container.ControlAdd(content).SetDock(DockMode.Fill);

					let moveRectGrid: NativeGrid = null;

					container.OnPointerPress(
						safe((sender: NativeWindow, mp) => {
							if (shadowRelated.selected) {
								return;
							}

							shadowRelated.start = mp.Position.Clone();
							shadowRelated.end = null;
							shadowRelated.current = null;

							moveRectGrid = new NativeGrid(shadowRelated.measureWindow);
							moveRectGrid.SetBackColor(new Vec4(255, 255, 255, 255));
							moveRectGrid.SetOpacity(0.5);

							shadowRelated.selected = container.ControlAdd(moveRectGrid);
							moveRectGrid.SetVisible(false);
							shadowRelated.selected.SetPos(new DpiSize_2(DpiSize.FromPixel(shadowRelated.start.x), DpiSize.FromPixel(shadowRelated.start.y)));
							shadowRelated.selected.SetSize(new DpiSize_2(DpiSize.FromPixel(1), DpiSize.FromPixel(1)));
						})
					);

					container.OnPointerRelease(
						safe(async (sender: NativeWindow, mp) => {
							shadowRelated.end = mp.Position.Clone();

							//
							shadowRelated.selected.SetPos(new DpiSize_2(DpiSize.FromPixel(0), DpiSize.FromPixel(0)));
							shadowRelated.selected.SetSize(new DpiSize_2(DpiSize.FromPixel(0), DpiSize.FromPixel(0)));

							moveRectGrid.SetBackColor(new Vec4(255, 0, 0, 255));
							container.ControlRemove(moveRectGrid);

							moveRectGrid = null;
							shadowRelated.selected = null;

							shadowRelated.measureWindow.Redraw();
							await sleep(100);
							shadowRelated.measureWindow.SetVisible(false);

							shadowRelated.selectedArea.start = new Vec2(Math.min(shadowRelated.start.x, shadowRelated.end.x), Math.min(shadowRelated.start.y, shadowRelated.end.y));
							shadowRelated.selectedArea.end = new Vec2(Math.max(shadowRelated.start.x, shadowRelated.end.x), Math.max(shadowRelated.start.y, shadowRelated.end.y));

							//
							shadowRelated.start = null;
							shadowRelated.end = null;
							shadowRelated.current = null;

							//
							console.log("measure reuslt selected area", shadowRelated.selectedArea);

							//
							onDisplay();
						})
					);

					container.OnPointerMove(
						safe((sender: NativeWindow, mp) => {
							shadowRelated.current = mp.Position.Clone();
							// console.log("mesaure move", shadowRelated.current.x, shadowRelated.current.y);

							if (moveRectGrid && shadowRelated.start && shadowRelated.current.x !== shadowRelated.start.x && shadowRelated.current.y !== shadowRelated.start.y) {
								moveRectGrid.SetVisible(true);
							} else if (moveRectGrid) {
								moveRectGrid.SetVisible(false);
							}

							if (shadowRelated.start && shadowRelated.selected) {
								const x = Math.min(shadowRelated.start.x, shadowRelated.current.x);
								const y = Math.min(shadowRelated.start.y, shadowRelated.current.y);
								const width = Math.abs(shadowRelated.current.x - shadowRelated.start.x);
								const height = Math.abs(shadowRelated.current.y - shadowRelated.start.y);
								if (width > 1 && height > 1) {
									// console.log("draw measure area", x, y, width, height);
									shadowRelated.selected.SetPos(new DpiSize_2(DpiSize.FromPixel(x), DpiSize.FromPixel(y)));
									shadowRelated.selected.SetSize(new DpiSize_2(DpiSize.FromPixel(width), DpiSize.FromPixel(height)));
								}
							}
						})
					);
				}

				console.log("measure window set content");
				shadowRelated.measureWindow.SetContent(container);
				return true;
			})
		);
		const result = shadowRelated.measureWindow.CreateWindow();
		console.log("measure window create result", result);
	}

	if (shadowRelated.measureWindow.IsWindowCreated()) {
		console.log("measure window created, activate it");

		shadowRelated.displayWindow?.SetVisible(false);

		shadowRelated.measureWindow.SetVisible(true);
		shadowRelated.measureWindow.Activate();

		console.log("activate measure window done");
	}
});
