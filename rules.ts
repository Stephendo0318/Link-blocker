const blockedDomains = [
	"discord.gg",
	"youtube.com",
];

export function getBlockedDomain(urlString: string): string | null {
	try {
		const url = new URL(urlString);

		const host = url.hostname
			.toLowerCase()
			.replace(/^www\./, "");

		for (const domain of blockedDomains) {
			if (
				host === domain ||
				host.endsWith("." + domain)
			) {
				return domain;
			}
		}
	} catch {}

	return null;
}