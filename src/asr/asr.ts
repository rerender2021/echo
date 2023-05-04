import axios from "axios";
import path from "path";
import fs from "fs";
import childProcess from "child_process";
import { IAsrEngine, IAsrEngineOptions, ISentence } from "./base";
import { emptySentence, shadowRelated } from "../shadow";
import { postasr } from "./postasr";

enum AsrVersion {
	v120,
}

export class VoskAsrEngine implements IAsrEngine {
	private options: IAsrEngineOptions;
	private asr: childProcess.ChildProcessWithoutNullStreams;
	private version: AsrVersion;

	constructor(options: IAsrEngineOptions) {
		this.options = options;
		this.version = AsrVersion.v120;
	}

	getAsrPath() {
		const v120 = path.resolve(process.cwd(), "asr-server-v1.2.0");
		if (fs.existsSync(v120)) {
			this.version = AsrVersion.v120;
			console.log("use asr-server-v1.2.0");
			return { asrDir: v120, exePath: path.resolve(v120, "./ASR-API.exe") };
		} else {
			console.error("this version of echo requires >= asr-server-v1.2.0!");
		}

		return { asrDir: "", exePath: "" };
	}

	async init() {
		console.log("try to init vosk asr engine");
		const { asrDir, exePath } = this.getAsrPath();
		if (asrDir && exePath) {
			return new Promise((resolve, reject) => {
				console.log("asrDir exists, start asr server", asrDir);

				const port = this.options.asrPort;
				const voskPort = this.options.asrSocketPort;
				
				const asr = childProcess.spawn(exePath, [`--port=${port}`, `--vosk-port=${voskPort}`], { windowsHide: true, detached: false /** hide console */ });
				this.asr = asr;
				asr.stdout.on("data", (data) => {
					console.log(`stdout: ${data}`);
					if (data.includes("has been started")) {
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

	private async asrApi(): Promise<string> {
		const port = this.options.asrPort;

		if (this.version === AsrVersion.v120) {
			const response = await axios.post(`http://localhost:${port}/asr_queue`, {}, { timeout: 1000 });
			const result = response?.data?.result;
			const data = JSON.parse(result[result.length - 1] || "{}");
			const asrText = data.partial || "";
			return asrText;
		}

		return "";
	}

	async getAsrResult(): Promise<string> {
		let asrResult = "";
		try {
			asrResult = await this.asrApi();
		} catch (error) {
			console.log(`asr failed: ${error.message}`);
		} finally {
			return asrResult;
		}
	}

	async recognize(): Promise<ISentence> {
		let sentence: ISentence = emptySentence;
		try {
			const asrText = await this.getAsrResult();

			if (shadowRelated.shouldBreakLongText) {
				const result = await postasr(asrText);
				sentence = { text: result, asr: asrText };
			} else {
				sentence = { text: asrText, asr: asrText };
			}
		} catch (error) {
			console.log(`asr failed: ${error.message}`);
			this.options?.onError(error.message);
		} finally {
			return sentence;
		}
	}
}
