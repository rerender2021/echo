import path from "path";

export function assetsPath(name: string) {
	const root = path.resolve(__dirname, "../../assets");
	return path.resolve(root, `./${name}`);
}