from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image


ROOT = Path.cwd()
PUBLIC_STICKERS = ROOT / "public" / "stickers"
MANIFEST_TS = ROOT / "src" / "data" / "sticker-image-manifest.ts"
PILOT_ROOT = ROOT / "work" / "team-pilots"


def validate_public_images() -> dict:
    published = {}
    errors = []

    for team_dir in sorted(PUBLIC_STICKERS.glob("*")):
        if not team_dir.is_dir():
            continue
        team_code = team_dir.name
        files = sorted(team_dir.glob(f"{team_code}-*.webp"))
        numbers = []
        for path in files:
            match = re.fullmatch(rf"{team_code}-(\d{{2}})\.webp", path.name)
            if not match:
                errors.append(f"Nombre incorrecto: {path}")
                continue
            number = int(match.group(1))
            numbers.append(number)
            try:
                with Image.open(path) as image:
                    image.verify()
                with Image.open(path) as image:
                    width, height = image.size
            except Exception as error:
                errors.append(f"No abre con Pillow: {path} ({error})")
                continue
            if width <= 0 or height <= 0:
                errors.append(f"Dimensiones inválidas: {path}")
        published[team_code] = sorted(numbers)

    if (PUBLIC_STICKERS / "MEX" / "MEX-06.webp").exists():
        errors.append("MEX-06.webp no debe existir.")

    return {
        "published": published,
        "errors": errors,
    }


def validate_manifest(public_result: dict) -> list[str]:
    text = MANIFEST_TS.read_text(encoding="utf-8")
    errors = []
    if "normalizedTeamCode === \"MEX\"" in text:
        errors.append("El manifiesto todavía contiene lógica específica de MEX.")
    for team_code, numbers in public_result["published"].items():
        if team_code not in text:
            errors.append(f"Falta {team_code} en sticker-image-manifest.ts")
        for number in numbers:
            if f"{number}," not in text and f"{number}\n" not in text:
                errors.append(f"Falta {team_code}-{number:02d} en el manifiesto TS.")
    return errors


def validate_pilots() -> dict:
    teams = {}
    errors = []
    for team_code in ["ARG", "BRA", "GER"]:
        manifest_path = PILOT_ROOT / team_code / "manifest.json"
        if not manifest_path.exists():
            errors.append(f"Falta manifiesto piloto: {manifest_path}")
            continue
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        stickers = manifest.get("stickers", [])
        image_count = sum(1 for sticker in stickers if sticker.get("hasImage"))
        if len(stickers) != 20:
            errors.append(f"{team_code}: manifiesto no tiene 20 stickers.")
        for sticker in stickers:
            output = sticker.get("output")
            if not output:
                continue
            path = PILOT_ROOT / team_code / "official-preview" / output
            if not path.exists():
                errors.append(f"{team_code}: falta preview {path}")
                continue
            try:
                with Image.open(path) as image:
                    image.verify()
            except Exception as error:
                errors.append(f"{team_code}: preview no abre {path} ({error})")
        teams[team_code] = {
            "stickers": len(stickers),
            "images": image_count,
            "missing": manifest.get("missing", []),
            "extras": manifest.get("extras", []),
            "published": manifest.get("published"),
            "warnings": manifest.get("warnings", []),
        }
    return {"teams": teams, "errors": errors}


def main() -> int:
    public_result = validate_public_images()
    manifest_errors = validate_manifest(public_result)
    pilot_result = validate_pilots()
    errors = public_result["errors"] + manifest_errors + pilot_result["errors"]

    report = {
        "public": public_result["published"],
        "pilots": pilot_result["teams"],
        "errors": errors,
    }
    output = ROOT / "work" / "team-pilots" / "validation-report.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if errors:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
