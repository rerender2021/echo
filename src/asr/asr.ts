import axios from "axios";
import path from "path";
import fs from "fs";
import childProcess from "child_process";
import { IAsrEngine, IAsrEngineOptions, IAsrResult } from "./base";
import { shadowRelated } from "../shadow";

export class VoskAsrEngine implements IAsrEngine {
	private options: IAsrEngineOptions;
	private asr: childProcess.ChildProcessWithoutNullStreams;

	constructor(options: IAsrEngineOptions) {
		this.options = options;
	}

	async init() {
		console.log("try to init vosk asr engine");
		const asrDir = path.resolve(process.cwd(), "asr-server");
		const exePath = path.resolve(asrDir, "./ASR-API.exe");
		if (fs.existsSync(asrDir) && fs.existsSync(exePath)) {
			return new Promise((resolve, reject) => {
				console.log("asrDir exists, start asr server", asrDir);

				const asr = childProcess.spawn(`./asr-server/ASR-API.exe`, [], { windowsHide: true, detached: false /** hide console */ });
				this.asr = asr;
				asr.stdout.on("data", (data) => {
					console.log(`stdout: ${data}`);
					if (data.includes("ASR-API has been started")) {
						console.log("asr server started");
						resolve(true);
					}
				});

				asr.stderr.on("data", (data) => {
					console.error(`stderr: ${data}`);
				});

				asr.on("close", (code) => {
					console.log(`asr server exit: ${code}`);
					reject(false);
				});
			});
		} else {
			console.log("vosk asr server not exist");
		}
	}

	async destroy() {
		if (this.asr) {
			console.log("exit asr server process");
			process.kill(this.asr?.pid);
			process.exit();
		}
	}

	async recognize(): Promise<IAsrResult> {
		// const base64 = buffer.toString("base64");
		let text = "";
		try {
			const timeout = this.options?.timeout || 3000;
			const response = await axios.post("http://localhost:8200/asr", {}, { timeout });
			const data = JSON.parse(response.data.result);
			console.log(data);

			text = data.partial || data.text || "";

			if (text && shadowRelated.shouldResotrePunct) {
				const withPunctResponse = await axios.post("http://localhost:8200/punct", { text }, { timeout });
				if (withPunctResponse.data.text) {
					text = withPunctResponse.data.text;
					console.log({ text });
				}
			}
		} catch (error) {
			console.log(`asr failed: ${error.message}`);
			this.options?.onError(error.message);
		} finally {
			return { text };
		}
	}
}
