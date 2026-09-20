# Verify gate for the compiled theme. just deps is outside the ci closure
# (may fetch theme.css). It does not apt-install Chromium.

set dotenv-load := false

helpers := ".cursor/skills/verify-willemstad/helpers"

default: ci

check:
    {{helpers}}/deps.sh --check
    bash -n {{helpers}}/lib.sh
    bash -n {{helpers}}/launch.sh
    bash -n {{helpers}}/doctor.sh
    bash -n {{helpers}}/drive.sh
    bash -n {{helpers}}/cleanup.sh
    bash -n {{helpers}}/deps.sh
    python3 -m py_compile {{helpers}}/serve.py

ci: check

test:
    python3 -m unittest discover -s test -p 'test_*.py' -v

# May fetch theme.css. Not in the ci/check closure.
deps:
    {{helpers}}/deps.sh
