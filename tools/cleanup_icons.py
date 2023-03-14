import re
import json
import pathlib
from os import remove


iconset_mapping = {
    "Fas": "font-awesome-solid",
    "Fab": "font-awesome-brands",
    "Far": "font-awesome-regular",
    "Ri": "remix-icons",
    "Si": "simple-icons",
    "Li": "lucide-icons",
    "Ib": "icon-brew",
}

cur_path = pathlib.Path(__file__).parent.resolve()
icons_path = pathlib.Path(cur_path, "icons")

files_used = []
with open(pathlib.Path(cur_path, "data.json"), "r") as f:
    data = json.load(f)
    data.pop("settings")
    icons = set(data.values())
    for icon in icons:
        name_splitted = list(filter(None, re.split("([A-Z0-9_-][^A-Z0-9_-]+)", icon)))
        iconset_foldername = iconset_mapping[name_splitted.pop(0)]
        normalized_name = "".join(
            [t.replace("-", "").replace("_", "").capitalize() for t in name_splitted]
        )
        # print(icon, iconset_foldername, name_splitted, normalized_name)
        files_used.append(
            pathlib.Path(icons_path, iconset_foldername, normalized_name + ".svg")
        )

files_to_remove, files_to_keep = [], []

for icon in pathlib.Path(cur_path, "icons").glob("**/*.svg"):
    (files_to_remove if icon not in files_used else files_to_keep).append(icon)

if len(files_used) != len(files_to_keep):
    print(
        f"Warning: `data.json` assigned {len(files_used)} unique icons, but only {len(files_to_keep)} of those have been found on the disk."
    )
print(f"Delete {len(files_to_remove)} files (keep {len(files_to_keep)})? (y/N)")

if input().lower() in {"yes", "y", "ye"}:
    print("Deleting...")
    for f in files_to_remove:
        f.unlink()
    print(f"Deleted {len(files_to_remove)} icon files.")
else:
    print("Nothing was deleted.")
