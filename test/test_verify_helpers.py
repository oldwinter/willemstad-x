from __future__ import annotations

from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
HELPERS = ROOT / ".cursor" / "skills" / "verify-willemstad" / "helpers"


class VerifyHelperTests(unittest.TestCase):
    def run_helper(self, name: str, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [str(HELPERS / name), *args], cwd=ROOT, capture_output=True, text=True
        )

    def test_unknown_feature_fails_before_loading_runtime_dependencies(self) -> None:
        result = self.run_helper("drive.sh", "not-a-feature")
        self.assertEqual(result.returncode, 2)
        self.assertIn("unknown feature", result.stderr)

    def test_justfile_exposes_the_read_only_check_and_recovery_target(self) -> None:
        justfile = (ROOT / "justfile").read_text(encoding="utf-8")
        self.assertIn("deps.sh", justfile)
        self.assertIn("python3 -m py_compile", justfile)
        self.assertIn("deps:", justfile)


if __name__ == "__main__":
    unittest.main()
