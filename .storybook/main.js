const path = require("path")
const dotenv = require("dotenv")

dotenv.config()

/** @type { import('@storybook/nextjs').StorybookConfig } */
const config = {
	stories: ["../components/**/*.stories.@(js|jsx|ts|tsx)"],
	addons: ["@storybook/addon-links", "@storybook/addon-docs"],
	framework: {
		name: "@storybook/nextjs",
		options: {
			nextConfigPath: path.resolve(__dirname, "../next.config.js"),
		},
	},
	docs: {},
	typescript: {
		reactDocgen: "react-docgen-typescript",
	},
	webpackFinal: async (config) => {
		config.resolve.modules.push(path.resolve(__dirname, ".."))
		config.resolve.alias = {
			...config.resolve.alias,
			"@": path.resolve(__dirname, ".."),
		}
		return config
	},
}

module.exports = config
