import axios from "axios";
import path from "path";
import fs from "fs";
import childProcess from "child_process";
import { IAsrEngine, IAsrEngineOptions, ISentence } from "./base";
import { TranslationSession } from "./postasr";
import { emptySentence } from "../shadow";

export class VoskAsrEngine implements IAsrEngine {
	private options: IAsrEngineOptions;
	private asr: childProcess.ChildProcessWithoutNullStreams;
	private sessionList: Array<TranslationSession>;

	constructor(options: IAsrEngineOptions) {
		this.options = options;
		this.sessionList = [];
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

	getCurrentSession() {
		return this.sessionList[this.sessionList.length - 1] || null;
	}

	async addAsrTextToSession(asrText: string, time: number) {
		if (!asrText) {
			const session = this.getCurrentSession();
			if (session) {
				// handle only one speech case
				await session.flushSpeech();

				// create new session if the last is not empty
				if (!session.isEmpty()) {
					const newSession = new TranslationSession();
					this.sessionList.push(newSession);
				}
			} else {
				// it's the first session
				this.sessionList.push(new TranslationSession());
			}
			return;
		}

		const session = this.getCurrentSession();
		if (session) {
			await session.addAsrText(asrText, time);
		}
	}

	async recognize(): Promise<ISentence> {
		let sentence: ISentence = emptySentence;
		try {
			const timeout = this.options?.timeout || 3000;
			const response = await axios.post("http://localhost:8200/asr", {}, { timeout });
			console.log(response.data);

			const data = JSON.parse(response?.data?.result || "{}");

			const asrText = data.partial || "";
			await this.addAsrTextToSession(asrText, Date.now());

			const session = this.getCurrentSession();
			sentence = session.getCurrentSentence();
			sentence.asr = asrText;
		} catch (error) {
			console.log(`asr failed: ${error.message}`);
			this.options?.onError(error.message);
		} finally {
			return sentence;
		}
	}
}
