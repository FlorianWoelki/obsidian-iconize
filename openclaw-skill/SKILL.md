---
name: obsidian-iconize-cli
description: Use this skill when an OpenClaw agent needs to list, set, or remove Obsidian Iconize icons and icon colors on vault notes without opening Obsidian.
---

# Obsidian Iconize CLI

Use the CLI shipped in the installed plugin folder. Always pass `--vault <vault>`.

```bash
VAULT=/path/to/vault
CLI="$VAULT/.obsidian/plugins/obsidian-icon-folder/openclaw-iconize-cli.cjs"
node "$CLI" list --vault "$VAULT"
```

Set or remove an icon:

```bash
node "$CLI" set --vault "$VAULT" --path "Projects/Plan.md" --icon LiBookOpen --color "#4488ff"
node "$CLI" remove --vault "$VAULT" --path "Projects/Plan.md"
```

If the installed plugin does not include the CLI yet, use `obsidian-iconize-cli` from `PATH` or `node "$PLUGIN_REPO/openclaw-iconize-cli.cjs"` from a checkout.

## Safety

- Prefer `--dry-run` before changing files.
- Treat `ok: false` or nonzero exit as failure and report `error.message`.
- Vault-relative paths must not be absolute or contain `..`.

