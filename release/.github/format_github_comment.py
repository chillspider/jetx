#!/usr/bin/env python3

import argparse
import re

from sys import stdin, stdout
from typing import NamedTuple, List


class Change(NamedTuple):
    summary: str
    changes: List[str]

    def form_body(self):
        return "\n".join(self.changes)

    def render(self):
        return f"""<details>

<summary>{self.summary}</summary>

```diff
{self.form_body()}
```

</details>

"""


summary_regex = re.compile(
    r"^(?P<namespace>.*), (?P<name>.*), (?P<api>.* \(.*\)) has (changed|been added|been removed):$"
)
ignore_regex = re.compile(r"^(Enabled.*via the envvar|Comparing release.*)$")

changes = []
change = None

parser = argparse.ArgumentParser(
    description='Wrap helm diff output in "details" blocks for easy inclusion in github comments',
    formatter_class=argparse.RawDescriptionHelpFormatter,
)
parser.add_argument(
    "infile",
    nargs="?",
    default=stdin,
    type=argparse.FileType("r"),
    help="helmfile output to render (default: stdin)",
)
parser.add_argument(
    "-o",
    "--outfile",
    nargs="?",
    default=stdout,
    type=argparse.FileType("w"),
    help="Write output to file (default: stdout)",
)
parser.add_argument("-e", "--env", required=True, help="environment to note on output")

parser.epilog = f"""
example:
  {parser.prog} --env dev-us helmfile_output.txt | tee comment.md
"""

args = parser.parse_args()

stripped_lines = map(lambda x: x.strip("\n"), args.infile.readlines())

for line in stripped_lines:
    if match := summary_regex.match(line):
        change = Change(match.string, [])
        changes.append(change)
    elif match := ignore_regex.match(line):
        continue
    elif change is not None and line.strip() != "":
        change.changes.append(line)


args.outfile.write(f"## {args.env}\n\n")

[args.outfile.write(c.render()) for c in changes]
