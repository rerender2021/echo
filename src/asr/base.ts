export interface IAsrResult {
	text: string;
}

export interface IAsrEngineOptions {
	timeout: number
	onRecognize?: OnRecognize;
	onError?: OnError;
}

export interface IAsrEngineConstructor {
	new (options: IAsrEngineOptions): IAsrEngine;
}

export interface IAsrEngine {
	recognize(): Promise<IAsrResult>;
	init(): void;
	destroy(): void;
}

export type OnRecognize = (progress: number) => void;
export type OnError = (message: string) => void;
