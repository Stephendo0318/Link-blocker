import { HTTP_REGEX_MULTI } from "@vendetta/constants";
import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";

import { patchRows } from "$/types";
import type { ContentRow } from "$/typings";

import { getBlockedDomain } from "../rules";

const Messages = findByProps("sendMessage", "editMessage");

function block(text: string) {
	return text.replace(HTTP_REGEX_MULTI, str => {
		let url: URL;

		try {
			url = new URL(str);
		} catch {
			return str;
		}

		const blocked = getBlockedDomain(url.toString());

		if (!blocked) {
			return str;
		}

		return `[Blocked: ${blocked}]`;
	});
}

function handleMessage(msg: any) {
	if (msg?.content) {
		msg.content = block(msg.content);
	}
}

function handleContent(content: ContentRow[]) {
	for (const thing of content) {
		if (thing.type === "link" && typeof thing.target === "string") {
			const blocked = getBlockedDomain(thing.target);

			if (blocked) {
				thing.content = `[Blocked: ${blocked}]`;
				thing.target = "";
			}
		}

		if ("content" in thing) {
			if (typeof thing.content === "string") {
				thing.content = block(thing.content);
			} else if (Array.isArray(thing.content)) {
				thing.content = handleContent(thing.content);
			}
		}

		if ("items" in thing && Array.isArray(thing.items)) {
			thing.items = handleContent(thing.items);
		}
	}

	return content;
}

export default function () {
	const patches: (() => void)[] = [];

	patches.push(
		before("sendMessage", Messages, args => {
			handleMessage(args[1]);
		}),
	);

	patches.push(
		before("editMessage", Messages, args => {
			handleMessage(args[2]);
		}),
	);

	patches.push(
		patchRows(rows => {
			for (const row of rows) {
				if (row.type === 1 && row.message.content) {
					row.message.content = handleContent(row.message.content);
				}
			}
		}),
	);

	return () => {
		for (const patch of patches) {
			patch();
		}
	};
}