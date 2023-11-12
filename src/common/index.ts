import path from "path";
import fs from "fs";

export function assetsPath(name: string) {
	const root = path.resolve(__dirname, "../../assets");
	return path.resolve(root, `./${name}`);
}

export function runtimeAssetsPath(name: string) {
	const root = process.cwd();
	const filePath = path.resolve(root, `./${name}`);
	return fs.existsSync(filePath) ? filePath : undefined;
}