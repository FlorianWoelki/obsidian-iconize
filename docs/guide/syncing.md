# Syncing

Normally, syncing should work across all devices with established cloud providers.
However, if you want to sync your data across devices with Obsidian Sync and
possibly have thousands of icons, you need to try the following configuration
(detailed discussions can be found
[here](https://github.com/obsidianmd/obsidian-api/issues/134)) for a successful
syncing process:

Try setting the Iconize icon packs folder path to `.obsidian/icons`. Setting the
icon packs path to this specific path **does not** sync the icon packs and you have
to sync them manually. This won't clog up the synchronization process of Obsidian Sync.

*Working on a background checker to ensure a smooth experience when using the path
`.obsidian/icons`. More documentation coming soon.*
