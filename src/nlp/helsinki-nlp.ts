import fs from "fs";
import path from "path";
import axios from "axios";
import childProcess from "child_process";
import { INlpEngine, INlpEngineOptions, ITranslateResult } from "./base";

export class HelsinkiNlpEngine implements INlpEngine {
	private options: INlpEngineOptions;
	private nlp: childProcess.ChildProcessWithoutNullStreams;
	private cache: Record<string, string>;
	constructor(options: INlpEngineOptions) {
		this.options = options;
		this.cache = {};
	}

	async init() {
		console.log("try to init nlp engine");
		const nlpDir = path.resolve(process.cwd(), "nlp-server");
		if (fs.existsSync(nlpDir)) {
			return new Promise((resolve, reject) => {
				console.log("nlpDir exists, start nlp server", nlpDir);

				const nlp = childProcess.spawn(`./nlp-server/NLP-API.exe`, [`--lang-from=en`, `--lang-to=zh`, `--model-dir=.\\model`], { windowsHide: true, detached: false /** hide console */ });
				this.nlp = nlp;
				nlp.stdout.on("data", (data) => {
					console.log(`stdout: ${data}`);
					if (data.includes("nlp server has been started")) {
						console.log("nlp server started");
						resolve(true);
					}
				});

				nlp.stderr.on("data", (data) => {
					console.error(`stderr: ${data}`);
				});

				nlp.on("close", (code) => {
					console.log(`nlp server exit: ${code}`);
					reject(false);
				});
			});
		} else {
			console.log("nlp server not exist");
		}
	}

	async destroy() {
		if (this.nlp) {
			console.log("exit nlp server process");
			process.kill(this.nlp?.pid);
			process.exit();
		}
	}

	async translate(text: string): Promise<ITranslateResult> {
		try {
			if (this.cache[text]) {
				return { text: this.cache[text] };
			}
			const timeout = this.options?.timeout || 3000;
			const translated = await axios.post(
				"http://localhost:8100/translate",
				{
					text,
				},
				{ timeout }
			);
			const result = translated.data.result[0].translation_text;
			this.cache[text] = result;
			return { text: result };
		} catch (error) {
			console.log(`translate failed: ${error.message}`);
			return { text: "" };
		}
	}
}
