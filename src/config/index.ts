import path from "path";
import fs from "fs";
import { IAsrEngineOptions } from "../asr/base";
import { INlpEngineOptions } from "../nlp/base";

const defaultConfig = {
	/** timeout for asr and translate api call*/
	timeout: 3500,
	asrPort: 8200,
	asrSocketPort: 8210,
	nlpPort: 8100,
	webUiPort: 8350
};

export function getConfig() {
	const configPath = path.resolve(process.cwd(), "./config.json");
	if (!fs.existsSync(configPath)) {
		console.log(`config not exist at ${configPath}, create it!`);
		fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 4), "utf-8");
	}

	try {
		const configJson = JSON.parse(fs.readFileSync(configPath, "utf-8"));
		console.log(`parse config succeed, use it`);
		return configJson;
	} catch (error) {
		console.log(`parse config failed, ${error?.message}, use default config`);
		return defaultConfig;
	}
}

export function getWebUiConfig() {
	const config = getConfig();
	return {
		port: config?.webUiPort ?? defaultConfig.webUiPort
	}
}

function getAsrConfig(): IAsrEngineOptions {
	const config = getConfig();
	return {
		timeout: config?.timeout || defaultConfig.timeout,
		asrPort: config?.asrPort || defaultConfig.asrPort,
		asrSocketPort: config?.asrSocketPort || defaultConfig.asrSocketPort
	};
}

export const AsrConfig: IAsrEngineOptions = getAsrConfig();

function getNlpConfig(): INlpEngineOptions {
	const config = getConfig();
	return {
		timeout: config?.timeout || defaultConfig.timeout,
		nlpPort: config?.nlpPort || defaultConfig.nlpPort
	};
}

export const NlpConfig: INlpEngineOptions = getNlpConfig();