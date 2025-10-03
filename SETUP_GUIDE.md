# Quality Score Bookmark Setup

This modified Iconize plugin automatically adds bookmark icons to files with quality scores.

## Installation

### Step 1: Build the Plugin

```bash
cd obsidian-iconize
npm install --ignore-scripts
./node_modules/.bin/rollup --config rollup.config.js --environment BUILD:production
```

### Step 2: Install to Obsidian

1. **Copy the built files to your vault's plugin directory:**
   ```bash
   cp main.js manifest.json src/styles.css /path/to/YourVault/.obsidian/plugins/obsidian-icon-folder/
   ```

2. **Close and restart Obsidian**

## Usage

### Basic Usage

Add frontmatter to any note:

```yaml
---
Quality Score: 3
---
```

A bookmark icon will appear immediately next to the file in your file explorer.

### What Works

- `Quality Score: 2` (capitalized)
- `quality score: 2` (lowercase) 
- Any value greater than 1 triggers the bookmark

### For Existing Files

After installing, restart Obsidian. All existing files with quality scores will automatically get bookmark icons.

## Customizing

Go to **Settings → Iconize → Frontmatter Rules** to:

- Modify existing rules
- Add new rules for different field names
- Change icons and criteria
- Use "Apply to All Files" button for immediate updates

## Troubleshooting

- Make sure frontmatter is properly formatted YAML
- Field names are case-sensitive
- Values must be greater than 1
- If issues persist, restart Obsidian