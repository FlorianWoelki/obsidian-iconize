#!/usr/bin/env node
"use strict";

process.env.OPENCLAW_PLUGIN_CONFIG = JSON.stringify({
  pluginId: "obsidian-iconize",
  installedId: "obsidian-icon-folder",
  bin: "obsidian-iconize-cli",
  domain: "icons",
  capabilities: ["settings", "frontmatter-icons"],
  commands: ["list", "set", "remove"],
});
require("./openclaw-plugin-cli.cjs");
