set dotenv-load := false

helpers := ".cursor/skills/verify-willemstad/helpers"

default: ci

check:
    {{helpers}}/deps.sh
    bash -n {{helpers}}/lib.sh {{helpers}}/launch.sh {{helpers}}/doctor.sh {{helpers}}/drive.sh {{helpers}}/cleanup.sh {{helpers}}/deps.sh
    python3 -m py_compile {{helpers}}/serve.py

ci: check

test:
    python3 -m unittest discover -s test -p 'test_*.py' -v

deps:
    {{helpers}}/deps.sh
