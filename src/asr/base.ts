export interface ISentence {
	text: string;
	time: number;
	sessionId: number;
	speechId: number;
	asr?: string
}

export interface IAsrText {
	text: string;
	time: number;
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
	recognize(): Promise<ISentence>;
	init(): void;
	destroy(): void;
}

export type OnRecognize = (progress: number) => void;
export type OnError = (message: string) => void;
