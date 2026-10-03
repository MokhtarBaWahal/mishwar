from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {"node_modules", "dist", ".git", "coverage", "build"}
EXTENSIONS = {".ts", ".tsx", ".md", ".dart", ".html", ".json", ".yaml", ".yml"}
NON_ASCII_RUN = re.compile(r"[^\x00-\x7F]+")


def repair_fragment(fragment: str) -> str:
    try:
        repaired = fragment.encode("cp1256").decode("utf-8")
    except UnicodeError:
        return fragment

    if "\ufffd" in repaired:
        return fragment

    arabic_chars = sum(1 for char in repaired if "\u0600" <= char <= "\u06FF")
    return repaired if arabic_chars >= 1 else fragment


def repair_text(text: str) -> str:
    return NON_ASCII_RUN.sub(lambda match: repair_fragment(match.group(0)), text)


def main() -> None:
    changed = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue

        original = path.read_text(encoding="utf-8")
        repaired = repair_text(original)
        if repaired != original:
            path.write_text(repaired, encoding="utf-8", newline="")
            changed.append(path.relative_to(ROOT).as_posix())

    print(f"Repaired {len(changed)} files")
    for item in changed:
        print(item)


if __name__ == "__main__":
    main()
