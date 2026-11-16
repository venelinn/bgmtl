/**
 * Contentful Management (plain) client scoped to one space/environment, plus
 * small helpers shared by the scripts/ that write to Contentful.
 *
 * The nested "legacy" client (getSpace → getEnvironment → getEntry) is
 * deprecated and goes away in contentful-management v13.
 */

const { createClient } = require("contentful-management")

const createCma = ({ accessToken, spaceId, environmentId = "master" }) =>
	createClient(
		{ accessToken },
		{ type: "plain", defaults: { spaceId, environmentId } },
	)

/** True for a CMA 404 (entry/content type not found). */
const isNotFound = (err) =>
	err?.name === "NotFound" ||
	err?.status === 404 ||
	/"status":\s*404/.test(err?.message || "")

/** Entry by id, or null when it doesn't exist. Other errors are rethrown. */
async function getEntryOrNull(client, entryId) {
	try {
		return await client.entry.get({ entryId })
	} catch (err) {
		if (isNotFound(err)) return null
		throw err
	}
}

/** Published at least once (same check as the legacy entry.isPublished()). */
const isPublished = (entry) => Boolean(entry?.sys?.publishedVersion)

/** Save field changes, then publish the new version. Returns the published entry. */
async function updateAndPublish(client, entry) {
	const updated = await client.entry.update({ entryId: entry.sys.id }, entry)
	return client.entry.publish({ entryId: updated.sys.id }, updated)
}

/** Create with a fixed id, then publish. Returns the published entry. */
async function createAndPublish(client, contentTypeId, entryId, data) {
	const created = await client.entry.createWithId(
		{ contentTypeId, entryId },
		data,
	)
	return client.entry.publish({ entryId }, created)
}

module.exports = {
	createCma,
	isNotFound,
	getEntryOrNull,
	isPublished,
	updateAndPublish,
	createAndPublish,
}
