---
name: obsidian-iconize-cli
description: Use this skill when an OpenClaw agent needs to list, set, or remove Obsidian Iconize icons and icon colors on vault notes without opening Obsidian.
---

# Obsidian Iconize CLI

Use this repo's CLI to manage note icons through frontmatter. Always pass `--vault <vault>`.

```bash
PLUGIN_REPO=/path/to/obsidian-iconize
npm --prefix "$PLUGIN_REPO" run cli-build
node "$PLUGIN_REPO/openclaw-iconize-cli.cjs" list --vault <vault>
```

Set or remove an icon:

```bash
node "$PLUGIN_REPO/openclaw-iconize-cli.cjs" set --vault <vault> --path "Projects/Plan.md" --icon LiBookOpen --color "#4488ff"
node "$PLUGIN_REPO/openclaw-iconize-cli.cjs" remove --vault <vault> --path "Projects/Plan.md"
```

If the package is installed or linked, `obsidian-iconize-cli ...` may be used instead of `node "$PLUGIN_REPO/..."`.

## Safety

- Prefer `--dry-run` before changing files.
- Treat `ok: false` or nonzero exit as failure and report `error.message`.
- Vault-relative paths must not be absolute or contain `..`.

