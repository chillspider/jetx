#!/usr/bin/env python

"""
This script is used in Github Actions to automatically generate a list of changes for helmfile.

depedencies:
    python3 -m pip install sh pyyaml

execution:
     git --no-pager diff --name-only "origin/main" "HEAD" | \
     python3 .github/actions/build_helmfile_args/helmfile_selectors.py | \
     jq

Main steps:
    1. get environments from listing directories in `./tenants`
    2. for each environment-scoped helmfile in `./tenants`, execute `helmfile build in order to get the values and secrets files used for every release under that helmfile`
    3. check for changed files in the git diff (passed via stdin or the first argument)
    4. get a basic dependency graph for changes
    5. For all changes in the git diff that match up to a `values.yaml` or `secrets.yaml`, generate `--selector 'name=foo,tenant=bar'` for that file
"""

import fileinput
from os import path
import pathlib
import typing
import json

import yaml
from sh import helmfile

class Change(typing.NamedTuple):
    env: None|str = None
    name: None|str = None
    tenant: None|str = None

    def render(self):
        out = []
        if self.name != None:
            out.append(f"name={self.name}")
        if self.tenant != None:
            out.append(f"tenant={self.tenant}")

        return "--selector '" + ",".join(out) + "'"

class ValuesFile(typing.NamedTuple):
    tenant: str
    name: str
    file: str

class Helmfile:
    def __init__(self, env):
        self.env = env
        self.helmfiles = []
        raw_build = helmfile("build", environment=env, file=f"./tenants/{env}.yaml")
        parsed = list(yaml.load_all(raw_build, yaml.CLoader))
        for obj in parsed:
            for release in obj.get("releases", []):
                tenant = release["labels"]["tenant"]
                name = release["name"]
                if not release["installed"]:
                    continue
                for value in release.get("values", []) + release.get("secrets", []):
                    if type(value) != dict:
                        self.helmfiles.append(ValuesFile(tenant, name, value)) 

    def includes_file(self, filename: str):
        out = [Change(self.env, x.name, x.tenant) for x in self.helmfiles if x.file.endswith(filename)]
        return out

def is_environment_dir(dir: pathlib.Path):
    """True if it's a directory and not a symlink or the "meta" dir"""
    return dir.is_dir() and not (dir.is_symlink() or dir.name == "meta")

# Get Environments
environments = [p.name for p in pathlib.Path("./tenants").iterdir() if is_environment_dir(p)]

# Create `Helmfile` Objects, which runs a `helmfile build` for that env
built_helmfiles = [Helmfile(env) for env in environments]

# Get all changed files into a list, and don't include changes that overlap
changes = []
for line in fileinput.input(encoding="utf-8"):
    for x in built_helmfiles:
        changes = changes + x.includes_file(line.strip())
changes = set(changes)

out = []

# Render out changes as `--selector 'foo=bar'`
for env in environments:
    selector = " ".join([change.render() for change in changes if env == change.env])
    if selector != "":
        out.append({"env": env, "selector": selector})

print(json.dumps({"helmfile": out}))
