import express from "express";
import path from "path";
import { getWebUiConfig } from "../config";
import { Server } from "socket.io";
import http from "http";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});

const sockets = new Map<any, { connected: boolean }>();

type SubtitleType = { zh: string; en: string };
const cachedSubtitles: SubtitleType[] = [];

type ErrorEventType = { log: string; message: string; link?: string };
const cachedErrorEvent: ErrorEventType[] = [];
const emitedError = new Set<string>();
const logHistory: string[] = [];

export function isInitError() {
	return emitedError.size !== 0;
}

export const ErrorEvent = {
	NlpServerNotExist: {
		log: "[ERROR] nlp server not exist",
		message: "没有找到 NLP 服务器, 请检查目录结构。",
		link: "https://rerender2021.github.io/products/echo/#%E4%B8%8B%E8%BD%BD%E5%AE%89%E8%A3%85",
	},
	AsrServerNotExist: {
		log: "[ERROR] asr server not exist",
		message: "没有找到语音服务器, 请检查目录结构。",
		link: "https://rerender2021.github.io/products/echo/#%E4%B8%8B%E8%BD%BD%E5%AE%89%E8%A3%85",
	},
	ChineseInPath: {
		log: "[ERROR] chinese found in path",
		message: "请检查软件路径是否包含中文, 若包含, 需修改为英文。",
	},
	AsrNotWork: {
		log: "[ERROR] asr config error",
		message: "语音服务器启动失败, 请检查立体声混音相关配置。",
		link: "https://rerender2021.github.io/products/echo/#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98",
	},
	PortUsed: {
		log: "[ERROR] port used",
		message: "端口被占用, 需解除端口占用后再运行。",
		link: "https://www.runoob.com/w3cnote/windows-finds-port-usage.html",
	},
};

export function inspectLog(log: string) {
	// console.log("inspect log", { log });
	logHistory.push(log);
	if (log === ErrorEvent.NlpServerNotExist.log) {
		emitErorrEvent(ErrorEvent.NlpServerNotExist);
		return true;
	} else if (log === ErrorEvent.AsrServerNotExist.log) {
		emitErorrEvent(ErrorEvent.AsrServerNotExist);
		return true;
	} else if (log.includes("WinError 1225") || log.includes("character maps to <undefined>")) {
		emitErorrEvent(ErrorEvent.ChineseInPath);
		return true;
	} else if (log.includes("websockets.server:connection open")) {
		const asrDone = logHistory.find((each) => each.includes("VoskAPI") && each.includes("Done"));
		if (!asrDone) {
			emitErorrEvent(ErrorEvent.AsrNotWork);
			return true;
		}
	} else if (log.includes("error while attempting to bind on address")) {
		const port = log?.split("127.0.0.1', ")?.[1]?.substring(0, 4);
		if (port) {
			emitErorrEvent({
				log: `${port} ${ErrorEvent.PortUsed.log}`,
				message: `${port} ${ErrorEvent.PortUsed.message}`,
				link: ErrorEvent.PortUsed.link,
			});
			return true;
		}
	}

	return false;
}

function emitErorrEvent(event: ErrorEventType) {
	if (sockets.size === 0) {
		cachedErrorEvent.push(event);
		console.log("[EMIT] cache error event", { event });
	} else {
		// emit cached
		if (cachedErrorEvent.length !== 0) {
			emitCachedErrorEvent();
		}

		// emit current
		emitEchoError(event);

		// send log history
		io.emit("log-history", { logHistory });
	}
}

function emitEchoError(event: ErrorEventType) {
	if (!emitedError.has(event.log)) {
		io.emit("echo-error", event);
		console.log("[EMIT] emit error event", { event });
		emitedError.add(event.log);
	}
}

function emitCachedErrorEvent() {
	console.log("[EMIT] emit cached error event");
	cachedErrorEvent.forEach((event) => {
		emitEchoError(event);
	});
	cachedErrorEvent.splice(0, cachedErrorEvent.length);
}

// https://socket.io/get-started/chat#integrating-socketio
export function emitSubtitleEvent(subtitle: SubtitleType) {
	if (sockets.size === 0) {
		cachedSubtitles.push(subtitle);
	} else {
		if (cachedSubtitles.length !== 0) {
			emitCachedSubtitleEvent();
		}
		io.emit("subtitle", subtitle);
	}
}

function emitCachedSubtitleEvent() {
	cachedSubtitles.forEach((subtitle) => {
		io.emit("subtitle", subtitle);
	});
	cachedSubtitles.splice(0, cachedSubtitles.length);
}

export function emitFlushEvent() {
	io.emit("flush");
}

export function startEchoWebUI() {
	const root = path.resolve(process.cwd(), "./echo-web-ui-v1.2.0");
	app.use(express.static(root));

	const { port } = getWebUiConfig();

	app.get("/", (req, res) => {
		res.send("Hello Echo!");
	});

	io.on("connection", (socket) => {
		console.log("a client connected");
		sockets.set(socket, {
			connected: true,
		});

		if (cachedErrorEvent.length !== 0) {
			emitCachedErrorEvent();
		}

		if (cachedSubtitles.length !== 0) {
			emitCachedSubtitleEvent();
		}

		socket.on("disconnect", (reason) => {
			sockets.delete(socket);
		});
	});

	server.listen(port, () => {
		console.log(`echo web ui server listening on port ${port}`);
	});
}
