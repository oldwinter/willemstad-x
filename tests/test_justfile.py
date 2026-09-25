"""Public seam: just / launch / drive name just deps when tools are missing."""

from __future__ import annotations

import shutil
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HELPERS = ROOT / ".cursor" / "skills" / "verify-willemstad" / "helpers"


def _run_just(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["just", *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )


def _run_helper(name: str, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [str(HELPERS / name), *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )


def _chrome_on_path() -> bool:
    for candidate in (
        "google-chrome-stable",
        "google-chrome",
        "chromium",
        "chromium-browser",
    ):
        if shutil.which(candidate):
            return True
    return False


class JustfileDepsNextStepTests(unittest.TestCase):
    def test_justfile_guards_missing_verify_tools(self) -> None:
        text = (ROOT / "justfile").read_text(encoding="utf-8")
        self.assertIn("try: just deps", (HELPERS / "deps.sh").read_text(encoding="utf-8"))
        self.assertIn("deps.sh --check", text)
        self.assertIn("just deps", text)

    def test_just_default_without_theme_or_chrome_prints_try_deps(self) -> None:
        if (ROOT / "theme.css").is_file() and _chrome_on_path():
            self.skipTest("theme.css and chromium are present")
        result = _run_just()
        self.assertEqual(result.returncode, 2, result.stderr + result.stdout)
        self.assertIn("try: just deps", result.stderr)
        self.assertTrue(
            "theme.css is not checked out" in result.stderr
            or "chromium is not installed" in result.stderr,
            result.stderr,
        )
        self.assertNotIn("no justfile found", result.stderr)
        self.assertNotIn("cannot find theme.css + manifest.json", result.stderr)

    def test_just_check_and_ci_without_theme_or_chrome_print_try_deps(self) -> None:
        if (ROOT / "theme.css").is_file() and _chrome_on_path():
            self.skipTest("theme.css and chromium are present")
        for args in (("check",), ("ci",)):
            with self.subTest(args=args):
                result = _run_just(*args)
                self.assertEqual(result.returncode, 2, result.stderr + result.stdout)
                self.assertIn("try: just deps", result.stderr)

    def test_launch_without_theme_css_prints_try_deps(self) -> None:
        if (ROOT / "theme.css").is_file():
            self.skipTest("theme.css is checked out")
        result = _run_helper("launch.sh")
        self.assertEqual(result.returncode, 2, result.stderr + result.stdout)
        self.assertIn("error  theme.css is not checked out", result.stderr)
        self.assertIn("try: just deps", result.stderr)
        self.assertNotIn("cannot find theme.css + manifest.json", result.stderr)

    def test_drive_unknown_feature_lists_known_without_theme_css(self) -> None:
        result = _run_helper("drive.sh", "not-a-feature")
        self.assertEqual(result.returncode, 2, result.stderr + result.stdout)
        self.assertIn("unknown feature", result.stderr)
        self.assertIn("Known: reading callouts cssclasses checkboxes focused-mode", result.stderr)
        self.assertNotIn("cannot find theme.css + manifest.json", result.stderr)

    def test_drive_reading_without_theme_css_prints_try_deps(self) -> None:
        if (ROOT / "theme.css").is_file():
            self.skipTest("theme.css is checked out")
        result = _run_helper("drive.sh", "reading")
        self.assertEqual(result.returncode, 2, result.stderr + result.stdout)
        self.assertIn("error  theme.css is not checked out", result.stderr)
        self.assertIn("try: just deps", result.stderr)


if __name__ == "__main__":
    unittest.main()
