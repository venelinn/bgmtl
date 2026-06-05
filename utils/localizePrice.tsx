const localizePrice = (price: string | number, locale: string = "en-CA") => {
	if (price == null || price === "") return null;

	const number = Number(price);
	if (Number.isNaN(number)) return price.toString();
	const hasCents = number % 1 !== 0;

	const parts = new Intl.NumberFormat(locale, {
		style: "currency",
		currency: "CAD",
		currencyDisplay: "narrowSymbol",
		minimumFractionDigits: hasCents ? 2 : 0,
		maximumFractionDigits: 2,
	}).formatToParts(number);

	return parts.map((part, index) => {
		if (part.type === "currency") {
			return <sup key={index}>{part.value}</sup>;
		}
		if (part.type === "fraction" || part.type === "decimal") {
			return <sup key={index}>{part.value}</sup>;
		}
		return <span key={index}>{part.value}</span>;
	});
};

export { localizePrice };
