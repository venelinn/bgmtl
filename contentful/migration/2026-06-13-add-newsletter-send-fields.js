/**
 * Adds send-control fields to the "newsletter" content type so a non-technical
 * editor can draft AND send entirely from Contentful:
 *
 * - status          draft | send | sent  (editor picks draft/send; "sent" is set by the system)
 * - brevoCampaignId  set automatically — links the entry to its Brevo campaign
 * - sentAt           set automatically once sent — also the double-send guard
 *
 * Usage:
 *   node scripts/run-migration.js contentful/migration/2026-06-13-add-newsletter-send-fields.js
 */
module.exports = (migration) => {
	const nl = migration.editContentType("newsletter")

	nl
		.createField("status")
		.name("Status")
		.type("Symbol")
		.required(true)
		.validations([{ in: ["draft", "send", "sent"] }])
		.defaultValue({ "bg-BG": "draft" })

	nl
		.createField("brevoCampaignId")
		.name("Brevo campaign ID (auto)")
		.type("Symbol")
		.required(false)

	nl
		.createField("sentAt")
		.name("Sent at (auto)")
		.type("Date")
		.required(false)

	nl.changeFieldControl("status", "builtin", "dropdown", {
		helpText:
			"Draft = prepare a Brevo draft + preview. Send = email the whole list when you publish (cannot be undone). After sending it flips to 'sent'.",
	})
	nl.changeFieldControl("brevoCampaignId", "builtin", "singleLine", {
		helpText: "Managed automatically — don't edit.",
	})
	nl.changeFieldControl("sentAt", "builtin", "datePicker", {
		helpText: "Set automatically once sent. Clear it only if you deliberately want to re-send.",
	})
}
