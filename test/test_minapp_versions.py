#!/usr/bin/env python3
"""Lock current theme minAppVersion to manifest.json."""

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
VERSIONS = json.loads((ROOT / "versions.json").read_text(encoding="utf-8"))
README = (ROOT / "README.md").read_text(encoding="utf-8")
GITATTRIBUTES = (ROOT / ".gitattributes").read_text(encoding="utf-8")


class MinAppVersionsTests(unittest.TestCase):
    def test_current_versions_entry_copies_manifest_min_app(self):
        version = MANIFEST["version"]
        min_app = MANIFEST["minAppVersion"]
        self.assertIn(version, VERSIONS)
        self.assertEqual(
            VERSIONS[version],
            min_app,
            f"versions.json[{version!r}] must copy manifest minAppVersion {min_app!r}",
        )

    def test_readme_names_live_and_archive_css(self):
        self.assertRegex(
            README,
            re.compile(r"theme\.css.+manifest\.json|manifest\.json.+theme\.css", re.S),
        )
        self.assertRegex(
            README, r"publish\.css.+\bPublish\b|\bPublish\b.+publish\.css"
        )
        self.assertRegex(
            README,
            re.compile(
                r"obsidian\.css.+(historical|archive|not the (current|live))",
                re.I,
            ),
        )

    def test_gitattributes_drops_missing_source_paths(self):
        for stale in ("src/", "build/", "snippet.css"):
            self.assertNotIn(stale, GITATTRIBUTES)


if __name__ == "__main__":
    unittest.main()
