#!/usr/bin/env python3
"""Lock theme.css display version to one token that tracks manifest.json."""

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
THEME = (ROOT / "theme.css").read_text(encoding="utf-8")
PUBLISH = (ROOT / "publish.css").read_text(encoding="utf-8")


class ReleaseTokenTests(unittest.TestCase):
    def test_release_token_tracks_manifest_version(self):
        match = re.search(r"--willemstad-release:\s*([^;]+);", THEME)
        self.assertIsNotNone(match, "theme.css must declare --willemstad-release")
        value = match.group(1).strip()
        # content: concatenates this token with a string. An unquoted ident
        # makes the whole content declaration invalid and Chrome drops it
        # (computed content: none). Keep the value a CSS string.
        self.assertTrue(
            len(value) >= 2 and value[0] == value[-1] == '"',
            f"{value!r} must be a quoted CSS string",
        )
        inner = value[1:-1]
        self.assertTrue(
            inner.startswith("v" + MANIFEST["version"]),
            f"{inner!r} must start with v{MANIFEST['version']}",
        )

    def test_titlebar_and_community_card_use_the_token(self):
        titlebar = re.search(
            r"div\.titlebar-text::after\s*\{[^}]+\}",
            THEME,
        )
        community = re.search(
            r"\.community-item\.mod-active \.community-item-name::after\s*\{[^}]+\}",
            THEME,
        )
        self.assertIsNotNone(titlebar)
        self.assertIsNotNone(community)
        for block in (titlebar.group(0), community.group(0)):
            self.assertIn("var(--willemstad-release)", block)
            self.assertNotIn(MANIFEST["version"], block)

    def test_publish_css_keeps_its_own_release(self):
        header = PUBLISH[:800]
        self.assertIn("v0.5.4 Jordaan", header)
        self.assertNotIn(MANIFEST["version"], header)


if __name__ == "__main__":
    unittest.main()
