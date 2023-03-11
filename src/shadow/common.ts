import { getAppContext } from "ave-react";
import { IGridControl, Vec2, Grid as NativeGrid, Window as NativeWindow } from "ave-ui";

export type ShadowRelatedType = {
	prevAsrText: string;
	prevTranslation: string;
	shouldTranslate: boolean;
	shouldRecognize: boolean;
	shouldResotrePunct: boolean;
	measureWindow: NativeWindow;
	selected: IGridControl<NativeGrid>;
	start: Vec2;
	end: Vec2;
	current: Vec2;
	selectedArea: {
		start: Vec2;
		end: Vec2;
	};
	displayWindow: NativeWindow;
	defaultTopMost: boolean;
	selectedAreaIsEmpty(): boolean;
	onUpdateTranslationResult: (text: string) => void;
};

export const shadowRelated: ShadowRelatedType = {
	prevAsrText: "",
	prevTranslation: "",
	shouldTranslate: false,
	shouldRecognize: false,
	shouldResotrePunct: false,
	measureWindow: null,
	selected: null,
	start: null,
	end: null,
	current: null,
	selectedArea: {
		start: new Vec2(0, 0),
		end: new Vec2(0, 0),
	},
	displayWindow: null,
	defaultTopMost: true,
	selectedAreaIsEmpty(this: ShadowRelatedType) {
		return this.selectedArea.start.x === 0 && this.selectedArea.start.y === 0 && this.selectedArea.end.x === 0 && this.selectedArea.end.x === 0;
	},
	onUpdateTranslationResult: () => {},
};

globalThis.shadowRelated = shadowRelated;

export function safe(callback: Function) {
	return (...args: any[]) => {
		try {
			return callback(...args);
		} catch (error) {
			console.error(error);
		}
	};
}

export function getPrimaryMonitor() {
	const context = getAppContext();
	const window = context.getWindow();
	const platform = window.GetPlatform();
	const monitors = platform.MonitorEnumerate();
	const primary = monitors.find((each) => each.Primary);
	return primary;
}

export async function sleep(time: number) {
	return new Promise((resolve) => setTimeout(resolve, time));
}
