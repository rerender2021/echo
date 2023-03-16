import { ISubtitle } from "./common";
import fs from "fs";

class EchoLog {
	private subtitleList: Array<ISubtitle> = [];
	private startTime = Date.now();
	private sessionMap: Record<number, Record<number, Array<ISubtitle>>> = {};

	start() {
		this.subtitleList = [];
		this.startTime = Date.now();
	}

	end() {
		// this.save();
	}

	save() {
		// TODO
		return;
		if (!fs.existsSync("./subtitle")) {
			fs.mkdirSync("./subtitle");
		}
		fs.writeFileSync(`./subtitle/${this.startTime}.echo.json`, JSON.stringify(this.getSubtitle(), null, 4));
	}

	getSubtitle() {
		return {
			subtitle: this.sessionMap,
		};
	}

	addSubtitle(subtitle: ISubtitle) {
		this.subtitleList.push(subtitle);
		if (!this.sessionMap[subtitle.sessionId]) {
			this.sessionMap[subtitle.sessionId] = {};
			const session = { [subtitle.speechId]: [subtitle] };
			this.sessionMap[subtitle.sessionId] = session;
		} else {
			const last = this.sessionMap[subtitle.sessionId];
			if (!last[subtitle.speechId]) {
				last[subtitle.speechId] = [subtitle];
			} else {
				last[subtitle.speechId].push(subtitle);
			}
		}
		// this.save();
	}
}

export const logger = new EchoLog();
