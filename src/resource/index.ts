import { assetsPath } from "../common";

const iconResource = {
	size: [16],
	path: {
		windowIcon: [assetsPath("echo.png")],
		"measure": [assetsPath("measure.png")],
		"theme-light": [assetsPath("sun.png")],
		"theme-dark": [assetsPath("moon.png")]
	},
} as const;

export { iconResource };

export type IconResourceMapType = Record<keyof typeof iconResource.path, number>;
