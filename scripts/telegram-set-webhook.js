#!/usr/bin/env node

require("dotenv").config()

/**
 * Register (or remove) the Telegram bot webhook.
 *
 *   node scripts/telegram-set-webhook.js https://bgmtl.com     # set
 *   node scripts/telegram-set-webhook.js --delete              # remove
 *   node scripts/telegram-set-webhook.js --info                # show status
 *
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET. See docs/telegram-bot.md.
 */

const token = process.env.TELEGRAM_BOT_TOKEN
const secret = process.env.TELEGRAM_WEBHOOK_SECRET
const arg = process.argv[2]

const call = async (method, body) => {
	const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body ?? {}),
	})
	return res.json()
}

async function main() {
	if (!token) {
		console.error("❌ Missing TELEGRAM_BOT_TOKEN in .env")
		process.exit(1)
	}
	if (arg === "--info") {
		return console.log(JSON.stringify(await call("getWebhookInfo"), null, 2))
	}
	if (arg === "--delete") {
		return console.log(await call("deleteWebhook"))
	}
	if (!arg || !secret) {
		console.error(
			"❌ Usage: telegram-set-webhook.js <https://site-origin> (needs TELEGRAM_WEBHOOK_SECRET)",
		)
		process.exit(1)
	}
	const url = `${arg.replace(/\/$/, "")}/api/telegram`
	console.log(`→ ${url}`)
	// Command menu shown next to the message box in Telegram.
	console.log(
		await call("setMyCommands", {
			commands: [
				{ command: "add", description: "Add a listing (I'll ask questions)" },
				{ command: "new", description: "Add a listing from a template" },
				{ command: "categories", description: "List the categories" },
				{ command: "help", description: "How it works" },
			],
		}),
	)
	console.log(
		await call("setWebhook", {
			url,
			secret_token: secret,
			allowed_updates: ["message", "callback_query"],
			drop_pending_updates: true,
		}),
	)
}

main()
