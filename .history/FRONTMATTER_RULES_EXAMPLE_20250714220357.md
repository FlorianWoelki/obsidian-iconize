# Frontmatter-Based Icon Rules Example

This document demonstrates how to use the new automatic frontmatter-based icon management feature in Obsidian Iconize.

## What it does

The feature automatically manages file icons based on frontmatter properties, such as quality scores, ratings, or any other metadata. Icons are:
- **Added** to files that meet the criteria and don't already have manually set icons
- **Removed** from files that no longer meet the criteria (but only if they were set by this system)
- **Avoided conflicts** with manually set icons or other plugin settings

## Example Usage

### Setup Rules

1. Go to Settings → Iconize → Frontmatter-based icon rules
2. Enable "Automatic frontmatter-based icon rules"
3. Add a new rule:
   - **Rule name**: "High Quality Notes"
   - **Apply to**: Files only
   - **Frontmatter field**: quality
   - **Condition**: greater than or equal
   - **Value**: 8
   - **Icon**: ⭐ (or any icon from icon packs)

### Example Files

**File with high quality score** (gets icon automatically):
```yaml
---
quality: 9
title: "Important Research Notes"
---

This file will automatically get a star icon because quality >= 8.
```

**File with low quality score** (no icon):
```yaml
---
quality: 5
title: "Draft Notes"
---

This file won't get an icon because quality < 8.
```

**File without quality metadata** (no icon):
```yaml
---
title: "Regular Notes"
---

This file won't get an icon because it has no quality field.
```

## Supported Operators

- **equals**: Field value exactly matches
- **not-equals**: Field value does not match  
- **greater-than**: Numeric field value is greater than
- **greater-equal**: Numeric field value is greater than or equal
- **less-than**: Numeric field value is less than
- **less-equal**: Numeric field value is less than or equal
- **contains**: String field value contains substring
- **not-contains**: String field value does not contain substring
- **exists**: Field exists in frontmatter
- **not-exists**: Field does not exist in frontmatter

## Advanced Examples

### Rating System
```yaml
# Rule: rating >= 4 → ⭐
# Rule: rating <= 2 → ❌
---
rating: 5
---
```

### Status-Based Icons
```yaml
# Rule: status equals "completed" → ✅
# Rule: status equals "in-progress" → 🔄
# Rule: status equals "todo" → 📝
---
status: completed
---
```

### Tag-Based Icons
```yaml
# Rule: tags contains "important" → ❗
---
tags: ["work", "important", "project"]
---
```

## Priority System

1. **Manual icons** (highest priority) - never overridden
2. **Frontmatter rules** (medium priority) - applied automatically
3. **Custom path rules** (lowest priority) - existing system

The system will never override manually set icons, ensuring your intentional choices are preserved. 