from __future__ import annotations

import csv
import hashlib
import html
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "src" / "data" / "player-catalog.json"
MANIFEST_PATH = ROOT / "src" / "data" / "sticker-image-manifest.ts"
PUBLIC_STICKERS_DIR = ROOT / "public" / "stickers"
OUTPUT_DIR = ROOT / "work" / "final-audit"


@dataclass
class ImageAudit:
    code: str
    path: str
    width: int | None
    height: int | None
    orientation: str
    sha256: str | None
    errors: list[str]
    warnings: list[str]


@dataclass
class TeamAudit:
    teamCode: str
    teamName: str
    officialPositions: int
    availableImages: int
    missingPositions: list[str]
    publicPathsValid: int
    brokenImages: list[str]
    duplicateCodes: list[str]
    duplicateNames: list[str]
    orphanFiles: list[str]
    unreferencedManifestEntries: list[str]
    state: str
    observations: list[str]
    images: list[ImageAudit]


def parse_manifest(source: str) -> dict[str, list[int]]:
    body_match = re.search(
        r"export\s+const\s+stickerImageManifest[^=]*=\s*\{(?P<body>.*?)\};",
        source,
        flags=re.S,
    )
    if not body_match:
        raise ValueError("Could not locate stickerImageManifest object")

    manifest: dict[str, list[int]] = {}
    for team_match in re.finditer(
        r"(?P<team>[A-Z]{3}):\s*\[(?P<numbers>.*?)\]",
        body_match.group("body"),
        flags=re.S,
    ):
        numbers = [
            int(value)
            for value in re.findall(r"\b(?:[1-9]|1\d|20)\b", team_match.group("numbers"))
        ]
        manifest[team_match.group("team")] = numbers

    return manifest


def manifest_function_is_generic(source: str) -> tuple[bool, list[str]]:
    warnings: list[str] = []
    function_match = re.search(
        r"export\s+function\s+getStickerImagePath\s*\(.*?\n\}",
        source,
        flags=re.S,
    )
    if not function_match:
        return False, ["getStickerImagePath function not found"]

    function_source = function_match.group(0)
    forbidden_patterns = [
        r"teamCode\s*===",
        r"normalizedTeamCode\s*===",
        r"switch\s*\(",
        r"case\s+[\"'][A-Z]{3}[\"']",
    ]
    for pattern in forbidden_patterns:
        if re.search(pattern, function_source):
            warnings.append(f"Non-generic manifest function pattern found: {pattern}")

    expected_fragments = [
        "teamCode.toUpperCase()",
        "stickerImageManifest[normalizedTeamCode]",
        "availableNumbers?.includes(number)",
        "`/stickers/${normalizedTeamCode}/${normalizedTeamCode}-${paddedNumber}.webp`",
    ]
    for fragment in expected_fragments:
        if fragment not in function_source:
            warnings.append(f"Expected generic function fragment missing: {fragment}")

    return not warnings, warnings


def image_orientation(width: int, height: int) -> str:
    if width > height:
        return "horizontal"
    if height > width:
        return "vertical"
    return "square"


def hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def audit_image(team_code: str, number: int, kind: str, path: Path) -> ImageAudit:
    code = f"{team_code}-{number:02d}"
    errors: list[str] = []
    warnings: list[str] = []
    width: int | None = None
    height: int | None = None
    orientation = "unknown"
    file_hash: str | None = None

    try:
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            width, height = image.size
            orientation = image_orientation(width, height)
        file_hash = hash_file(path)
    except Exception as exc:  # noqa: BLE001 - audit should report every failure.
        errors.append(f"Could not open image with Pillow: {exc}")

    if width is not None and height is not None:
        if width <= 0 or height <= 0:
            errors.append("Image has empty dimensions")
        if number == 1 and orientation != "vertical":
            errors.append(f"Position 01 should be vertical, got {orientation}")
        if number == 13 and orientation != "horizontal":
            errors.append(f"Position 13 should be horizontal, got {orientation}")
        if kind == "player" and orientation != "vertical":
            errors.append(f"Player sticker should be vertical, got {orientation}")
        if kind == "emblem" and orientation != "vertical":
            errors.append(f"Emblem should be vertical, got {orientation}")
        if kind == "squad" and orientation != "horizontal":
            errors.append(f"Squad sticker should be horizontal, got {orientation}")
        if width < 20 or height < 20:
            errors.append("Image dimensions are suspiciously small")

    return ImageAudit(
        code=code,
        path=str(path.relative_to(ROOT)).replace("\\", "/"),
        width=width,
        height=height,
        orientation=orientation,
        sha256=file_hash,
        errors=errors,
        warnings=warnings,
    )


def duplicate_values(values: list[str]) -> list[str]:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for value in values:
        if value in seen:
            duplicates.add(value)
        seen.add(value)
    return sorted(duplicates)


def public_webp_files() -> dict[str, list[Path]]:
    files_by_team: dict[str, list[Path]] = {}
    if not PUBLIC_STICKERS_DIR.exists():
        return files_by_team
    for path in sorted(PUBLIC_STICKERS_DIR.glob("*/*.webp")):
        files_by_team.setdefault(path.parent.name, []).append(path)
    return files_by_team


def build_outputs(summary: dict[str, Any], teams: list[TeamAudit]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    json_path = OUTPUT_DIR / "final-audit.json"
    csv_path = OUTPUT_DIR / "final-audit.csv"
    html_path = OUTPUT_DIR / "final-audit.html"

    payload = {
        "summary": summary,
        "teams": [asdict(team) for team in teams],
    }
    json_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    with csv_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "teamCode",
                "teamName",
                "officialPositions",
                "availableImages",
                "missingPositions",
                "publicPathsValid",
                "brokenImages",
                "duplicateCodes",
                "duplicateNames",
                "orphanFiles",
                "state",
                "observations",
            ],
        )
        writer.writeheader()
        for team in teams:
            writer.writerow(
                {
                    "teamCode": team.teamCode,
                    "teamName": team.teamName,
                    "officialPositions": team.officialPositions,
                    "availableImages": team.availableImages,
                    "missingPositions": " ".join(team.missingPositions),
                    "publicPathsValid": team.publicPathsValid,
                    "brokenImages": " ".join(team.brokenImages),
                    "duplicateCodes": " ".join(team.duplicateCodes),
                    "duplicateNames": " | ".join(team.duplicateNames),
                    "orphanFiles": " ".join(team.orphanFiles),
                    "state": team.state,
                    "observations": " | ".join(team.observations),
                }
            )

    rows = []
    for team in teams:
        state_class = "ok" if team.state == "ok" else "error"
        rows.append(
            "<tr>"
            f"<td>{html.escape(team.teamCode)}</td>"
            f"<td>{html.escape(team.teamName)}</td>"
            f"<td>{team.officialPositions}</td>"
            f"<td>{team.availableImages}</td>"
            f"<td>{html.escape(', '.join(team.missingPositions) or 'none')}</td>"
            f"<td>{html.escape(', '.join(team.brokenImages) or 'none')}</td>"
            f"<td>{html.escape(', '.join(team.orphanFiles) or 'none')}</td>"
            f"<td class=\"{state_class}\">{html.escape(team.state)}</td>"
            f"<td>{html.escape('; '.join(team.observations) or 'OK')}</td>"
            "</tr>"
        )

    summary_items = "\n".join(
        f"<li><strong>{html.escape(str(key))}</strong>: {html.escape(str(value))}</li>"
        for key, value in summary.items()
    )
    html_path.write_text(
        "<!doctype html>\n"
        "<html lang=\"es\"><head><meta charset=\"utf-8\" />"
        "<title>ALBUMFIND Final Audit</title>"
        "<style>"
        "body{font-family:Arial,sans-serif;margin:24px;background:#f7f4ee;color:#143b32}"
        "h1{margin:0 0 16px}table{border-collapse:collapse;width:100%;background:white}"
        "th,td{border:1px solid #d8d0c4;padding:6px 8px;font-size:12px;vertical-align:top}"
        "th{background:#0f5b45;color:white;text-align:left}.ok{color:#087a45;font-weight:700}"
        ".error{color:#b42318;font-weight:700}ul{columns:2;background:white;padding:16px 32px}"
        "</style></head><body>"
        "<h1>ALBUMFIND Final Publication Audit</h1>"
        f"<ul>{summary_items}</ul>"
        "<table><thead><tr>"
        "<th>Team</th><th>Name</th><th>Official</th><th>Images</th><th>Missing</th>"
        "<th>Broken</th><th>Orphans</th><th>State</th><th>Observations</th>"
        "</tr></thead><tbody>"
        + "\n".join(rows)
        + "</tbody></table></body></html>\n",
        encoding="utf-8",
    )


def main() -> int:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    manifest_source = MANIFEST_PATH.read_text(encoding="utf-8")
    manifest = parse_manifest(manifest_source)
    generic_ok, generic_warnings = manifest_function_is_generic(manifest_source)
    files_by_team = public_webp_files()

    teams: list[TeamAudit] = []
    global_errors: list[str] = []
    global_warnings: list[str] = list(generic_warnings)
    image_hashes: dict[str, list[str]] = {}

    catalog_team_codes = [team["teamCode"] for team in catalog["teams"]]
    manifest_only_teams = sorted(set(manifest) - set(catalog_team_codes))
    public_only_teams = sorted(set(files_by_team) - set(catalog_team_codes))
    if manifest_only_teams:
        global_errors.append(f"Manifest contains non-catalog teams: {manifest_only_teams}")
    if public_only_teams:
        global_errors.append(f"Public stickers contains non-catalog teams: {public_only_teams}")

    for team in catalog["teams"]:
        team_code = team["teamCode"]
        team_name = team["teamName"]
        stickers = team["stickers"]
        available_numbers = manifest.get(team_code, [])
        available_set = set(available_numbers)
        official_numbers = {sticker["number"] for sticker in stickers}
        expected_codes = {f"{team_code}-{number:02d}" for number in official_numbers}
        team_files = files_by_team.get(team_code, [])
        team_file_codes = {path.stem for path in team_files}
        sticker_by_number = {sticker["number"]: sticker for sticker in stickers}

        observations: list[str] = []
        errors: list[str] = []
        if team_code not in manifest:
            errors.append("Team missing from sticker-image-manifest.ts")
        if not (1 <= len(available_numbers) <= 20):
            errors.append("Manifest available count is outside expected range")
        if sorted(available_numbers) != available_numbers:
            errors.append("Manifest numbers are not sorted")
        duplicated_manifest_numbers = [
            str(number)
            for number in sorted(set(available_numbers))
            if available_numbers.count(number) > 1
        ]
        if duplicated_manifest_numbers:
            errors.append(f"Duplicate manifest numbers: {duplicated_manifest_numbers}")
        unknown_manifest_numbers = sorted(available_set - official_numbers)
        if unknown_manifest_numbers:
            errors.append(f"Manifest references non-catalog positions: {unknown_manifest_numbers}")

        duplicate_codes = duplicate_values([sticker["code"] for sticker in stickers])
        duplicate_names = duplicate_values([sticker["name"] for sticker in stickers])
        if duplicate_codes:
            errors.append(f"Duplicate official codes: {duplicate_codes}")
        if duplicate_names:
            observations.append(f"Duplicate official names: {duplicate_names}")

        broken_images: list[str] = []
        image_audits: list[ImageAudit] = []
        for number in available_numbers:
            sticker = sticker_by_number[number]
            expected_path = PUBLIC_STICKERS_DIR / team_code / f"{team_code}-{number:02d}.webp"
            if not expected_path.exists():
                broken_images.append(f"{team_code}-{number:02d}")
                errors.append(f"Manifest image is missing on disk: {expected_path}")
                continue
            audit = audit_image(team_code, number, sticker["kind"], expected_path)
            image_audits.append(audit)
            if audit.errors:
                broken_images.append(audit.code)
                errors.extend([f"{audit.code}: {message}" for message in audit.errors])
            if audit.sha256:
                image_hashes.setdefault(audit.sha256, []).append(audit.code)

        expected_file_codes = {
            f"{team_code}-{number:02d}" for number in available_numbers
        }
        orphan_files = sorted(team_file_codes - expected_file_codes)
        missing_files = sorted(expected_file_codes - team_file_codes)
        invalid_public_codes = sorted(team_file_codes - expected_codes)
        if orphan_files:
            errors.append(f"Public WebP files not referenced in manifest: {orphan_files}")
        if missing_files:
            errors.append(f"Manifest entries without public WebP files: {missing_files}")
        if invalid_public_codes:
            errors.append(f"Public files not in catalog: {invalid_public_codes}")

        unavailable_numbers = sorted(official_numbers - available_set)
        unexpected_files_for_missing = sorted(
            f"{team_code}-{number:02d}"
            for number in unavailable_numbers
            if (PUBLIC_STICKERS_DIR / team_code / f"{team_code}-{number:02d}.webp").exists()
        )
        if unexpected_files_for_missing:
            errors.append(f"Missing official positions have files: {unexpected_files_for_missing}")

        if len(available_numbers) == 20:
            observations.append("complete")
        else:
            observations.append("partial")

        teams.append(
            TeamAudit(
                teamCode=team_code,
                teamName=team_name,
                officialPositions=len(stickers),
                availableImages=len(available_numbers),
                missingPositions=[f"{team_code}-{number:02d}" for number in unavailable_numbers],
                publicPathsValid=len(image_audits) - len(broken_images),
                brokenImages=broken_images,
                duplicateCodes=duplicate_codes,
                duplicateNames=duplicate_names,
                orphanFiles=orphan_files,
                unreferencedManifestEntries=missing_files,
                state="error" if errors else "ok",
                observations=observations + errors,
                images=image_audits,
            )
        )

    duplicate_image_groups = {
        digest: codes for digest, codes in image_hashes.items() if len(codes) > 1
    }
    if duplicate_image_groups:
        global_warnings.append(
            f"Duplicate image hashes detected: {len(duplicate_image_groups)} groups"
        )

    total_webp = sum(len(files) for files in files_by_team.values())
    complete_teams = sorted(team.teamCode for team in teams if team.availableImages == 20)
    partial_teams = sorted(team.teamCode for team in teams if team.availableImages < 20)
    error_teams = sorted(team.teamCode for team in teams if team.state != "ok")
    warning_count = sum(len(team.duplicateNames) for team in teams) + len(global_warnings)
    error_count = len(global_errors) + sum(
        len(team.brokenImages)
        + len(team.duplicateCodes)
        + len(team.orphanFiles)
        + len(team.unreferencedManifestEntries)
        for team in teams
    )

    summary: dict[str, Any] = {
        "catalogTeams": len(catalog_team_codes),
        "manifestTeams": len(manifest),
        "publicTeams": len(files_by_team),
        "totalOfficialPositions": sum(team.officialPositions for team in teams),
        "totalWebp": total_webp,
        "completeTeams": len(complete_teams),
        "completeTeamCodes": " ".join(complete_teams),
        "partialTeams": len(partial_teams),
        "partialTeamCodes": " ".join(partial_teams),
        "errorTeams": " ".join(error_teams) or "none",
        "globalErrors": global_errors,
        "globalWarnings": global_warnings,
        "genericGetStickerImagePath": generic_ok,
        "duplicateImageHashGroups": len(duplicate_image_groups),
        "warnings": warning_count,
        "errors": error_count,
        "status": "ok" if not global_errors and not error_teams else "error",
    }

    build_outputs(summary, teams)

    print(f"Final audit status: {summary['status']}")
    print(f"Teams audited: {summary['catalogTeams']}")
    print(f"Public WebP audited: {summary['totalWebp']}")
    print(f"Complete teams: {summary['completeTeams']}")
    print(f"Partial teams: {summary['partialTeams']}")
    print(f"Error teams: {summary['errorTeams']}")
    print(f"Warnings: {summary['warnings']}")
    print(f"Errors: {summary['errors']}")
    print(f"JSON: {OUTPUT_DIR / 'final-audit.json'}")
    print(f"CSV: {OUTPUT_DIR / 'final-audit.csv'}")
    print(f"HTML: {OUTPUT_DIR / 'final-audit.html'}")

    return 0 if summary["status"] == "ok" else 1


if __name__ == "__main__":
    raise SystemExit(main())
