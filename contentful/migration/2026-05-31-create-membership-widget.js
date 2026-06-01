/**
 * Creates the Membership widget content types.
 *
 * - "membershipTier": one selectable PayPal membership option.
 *     `value` must match the option name configured on the PayPal hosted button
 *     EXACTLY (it is posted as `os0`). `label`/`amount` are display-only.
 * - "membershipWidget": the singleton sidebar widget. Holds the copy + a list of
 *     references to membershipTier entries + the PayPal hosted button settings.
 *
 * Mirrors the old PayPal "hosted button" form (cmd=_s-xclick, hosted_button_id,
 * on0=Membership Type, os0=<selected tier>, currency_code) but driven by Contentful.
 *
 * Usage:
 *   npm run contentful:migrate -- --file=contentful/migration/2026-05-31-create-membership-widget.js
 */
module.exports = (migration) => {
  // --- membershipTier -------------------------------------------------------
  const tier = migration
    .createContentType("membershipTier")
    .name("Membership Tier")
    .description("A single selectable PayPal membership option (Family, Per person, ...).")
    .displayField("label");

  tier
    .createField("label")
    .name("Label")
    .type("Symbol")
    .localized(true)
    .required(true);

  tier
    .createField("amount")
    .name("Amount")
    .type("Symbol")
    .required(false);

  tier
    .createField("value")
    .name("PayPal Option Value (os0)")
    .type("Symbol")
    .required(true);

  tier.changeFieldControl("label", "builtin", "singleLine", {
    helpText: "Shown next to the radio / in the dropdown, e.g. 'Per family (2 adults and children)'.",
  });
  tier.changeFieldControl("amount", "builtin", "singleLine", {
    helpText: "Display-only price, e.g. '$45.00 CAD'.",
  });
  tier.changeFieldControl("value", "builtin", "singleLine", {
    helpText:
      "Posted to PayPal as os0. Must match the option name configured on the PayPal hosted button EXACTLY. Do NOT translate.",
  });

  // --- membershipWidget -----------------------------------------------------
  const widget = migration
    .createContentType("membershipWidget")
    .name("Membership Widget")
    .description("Sidebar membership widget. Singleton — create only one entry per locale.")
    .displayField("title");

  widget.createField("title").name("Title").type("Symbol").localized(true).required(true);
  widget.createField("description").name("Description").type("Text").localized(true).required(false);
  widget.createField("selectLabel").name("Choices Label").type("Symbol").localized(true).required(false);
  widget.createField("buttonLabel").name("Button Label").type("Symbol").localized(true).required(false);
  widget.createField("trustText").name("Trust Text").type("Symbol").localized(true).required(false);

  widget
    .createField("tiers")
    .name("Membership Tiers")
    .type("Array")
    .required(true)
    .items({ type: "Link", linkType: "Entry", validations: [{ linkContentType: ["membershipTier"] }] });

  widget.createField("hostedButtonId").name("PayPal Hosted Button ID").type("Symbol").required(true);
  widget.createField("paypalOptionName").name("PayPal Option Name (on0)").type("Symbol").required(true);
  widget.createField("currencyCode").name("Currency Code").type("Symbol").required(false);
  widget.createField("paypalAction").name("PayPal Action URL").type("Symbol").required(false);

  widget.changeFieldControl("title", "builtin", "singleLine", { helpText: "Widget heading, e.g. 'Membership'." });
  widget.changeFieldControl("description", "builtin", "multipleLine", {
    helpText: "Short paragraph under the heading.",
  });
  widget.changeFieldControl("selectLabel", "builtin", "singleLine", {
    helpText: "Visible label above the tier choices, e.g. 'Membership Type'.",
  });
  widget.changeFieldControl("buttonLabel", "builtin", "singleLine", { helpText: "Submit button text, e.g. 'Join Now'." });
  widget.changeFieldControl("trustText", "builtin", "singleLine", {
    helpText: "Small reassurance line, e.g. 'Securely processed through PayPal'.",
  });
  widget.changeFieldControl("tiers", "builtin", "entryLinksEditor", {
    helpText: "≤3 tiers render as radio buttons, more than 3 render as a dropdown.",
  });
  widget.changeFieldControl("hostedButtonId", "builtin", "singleLine", {
    helpText: "PayPal hosted_button_id (the old site used 228JCTEWDYJK8).",
  });
  widget.changeFieldControl("paypalOptionName", "builtin", "singleLine", {
    helpText: "Posted to PayPal as on0. Must match the PayPal button config exactly, e.g. 'Membership Type'. Do NOT translate.",
  });
  widget.changeFieldControl("currencyCode", "builtin", "singleLine", { helpText: "e.g. 'CAD'." });
  widget.changeFieldControl("paypalAction", "builtin", "singleLine", {
    helpText: "Defaults to https://www.paypal.com/cgi-bin/webscr — only change for PayPal sandbox testing.",
  });
};
