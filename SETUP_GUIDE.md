# Frontmatter Rules Setup Guide

This enhanced Iconize plugin includes powerful frontmatter rules that automatically add icons to files based on their frontmatter content.

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

Add frontmatter to any note and create rules to automatically add icons:

```yaml
---
Quality Score: 3
Priority: High
Status: Complete
---
```

Icons will appear immediately next to the file in your file explorer based on your configured rules.

### Example Use Cases

- **Quality Score**: Add bookmark icons to high-quality content
- **Priority**: Flag important files with priority indicators  
- **Status**: Mark completed tasks with checkmarks
- **Category**: Organize files by type with different icons
- **Any custom field**: Create rules for any frontmatter field you use

### For Existing Files

After installing, restart Obsidian. All existing files matching your rules will automatically get icons.

## Customizing

Go to **Settings → Iconize → Frontmatter Rules** to:

- **Enable example rules** - Several example rules are included but disabled by default
- **Create new rules** - Add rules for any frontmatter field
- **Modify existing rules** - Change icons, criteria, and field names
- **Use "Apply to All Files"** - Apply rules to existing files immediately

### Example Rule Configuration

1. **Field**: The frontmatter field name (e.g., "Priority", "Status", "Category")
2. **Operator**: How to compare the value (equals, greater-than, contains, etc.)
3. **Value**: What value to match against
4. **Icon**: Which icon to display when the rule matches

## Troubleshooting

- Make sure frontmatter is properly formatted YAML
- Field names are case-sensitive
- Check that your rules are enabled in settings
- Use "Apply to All Files" to refresh existing files
- If issues persist, restart Obsidian