$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$dataDirectory = Join-Path $projectRoot "src\data"

New-Item -ItemType Directory -Force -Path $dataDirectory | Out-Null

$groups = @(
    @{
        id = "A"
        teams = @(
            @{ code = "MEX"; name = "México" }
            @{ code = "KOR"; name = "República de Corea" }
            @{ code = "RSA"; name = "Sudáfrica" }
            @{ code = "CZE"; name = "Chequia" }
        )
    }
    @{
        id = "B"
        teams = @(
            @{ code = "CAN"; name = "Canadá" }
            @{ code = "BIH"; name = "Bosnia y Herzegovina" }
            @{ code = "QAT"; name = "Qatar" }
            @{ code = "SUI"; name = "Suiza" }
        )
    }
    @{
        id = "C"
        teams = @(
            @{ code = "BRA"; name = "Brasil" }
            @{ code = "MAR"; name = "Marruecos" }
            @{ code = "HAI"; name = "Haití" }
            @{ code = "SCO"; name = "Escocia" }
        )
    }
    @{
        id = "D"
        teams = @(
            @{ code = "USA"; name = "Estados Unidos" }
            @{ code = "PAR"; name = "Paraguay" }
            @{ code = "AUS"; name = "Australia" }
            @{ code = "TUR"; name = "Turquía" }
        )
    }
    @{
        id = "E"
        teams = @(
            @{ code = "GER"; name = "Alemania" }
            @{ code = "CUW"; name = "Curazao" }
            @{ code = "CIV"; name = "Costa de Marfil" }
            @{ code = "ECU"; name = "Ecuador" }
        )
    }
    @{
        id = "F"
        teams = @(
            @{ code = "NED"; name = "Países Bajos" }
            @{ code = "JPN"; name = "Japón" }
            @{ code = "SWE"; name = "Suecia" }
            @{ code = "TUN"; name = "Túnez" }
        )
    }
    @{
        id = "G"
        teams = @(
            @{ code = "BEL"; name = "Bélgica" }
            @{ code = "EGY"; name = "Egipto" }
            @{ code = "IRN"; name = "Irán" }
            @{ code = "NZL"; name = "Nueva Zelanda" }
        )
    }
    @{
        id = "H"
        teams = @(
            @{ code = "ESP"; name = "España" }
            @{ code = "CPV"; name = "Cabo Verde" }
            @{ code = "KSA"; name = "Arabia Saudita" }
            @{ code = "URU"; name = "Uruguay" }
        )
    }
    @{
        id = "I"
        teams = @(
            @{ code = "FRA"; name = "Francia" }
            @{ code = "SEN"; name = "Senegal" }
            @{ code = "IRO"; name = "Irak" }
            @{ code = "NOR"; name = "Noruega" }
        )
    }
    @{
        id = "J"
        teams = @(
            @{ code = "ARG"; name = "Argentina" }
            @{ code = "ALG"; name = "Argelia" }
            @{ code = "AUT"; name = "Austria" }
            @{ code = "JOR"; name = "Jordania" }
        )
    }
    @{
        id = "K"
        teams = @(
            @{ code = "POR"; name = "Portugal" }
            @{ code = "COD"; name = "República Democrática del Congo" }
            @{ code = "UZB"; name = "Uzbekistán" }
            @{ code = "COL"; name = "Colombia" }
        )
    }
    @{
        id = "L"
        teams = @(
            @{ code = "ENG"; name = "Inglaterra" }
            @{ code = "CRO"; name = "Croacia" }
            @{ code = "GHA"; name = "Ghana" }
            @{ code = "PAN"; name = "Panamá" }
        )
    }
)

$groupsDocument = [ordered]@{
    schemaVersion = 1
    groupCount = 12
    teamCount = 48
    groups = $groups
}

$catalogTeams = foreach ($group in $groups) {
    foreach ($team in $group.teams) {
        $stickers = foreach ($number in 1..20) {
            [ordered]@{
                code = "{0}-{1:D2}" -f $team.code, $number
                number = $number
                teamCode = $team.code
                group = $group.id
            }
        }

        [ordered]@{
            code = $team.code
            name = $team.name
            group = $group.id
            stickerCount = 20
            stickers = $stickers
        }
    }
}

$catalogDocument = [ordered]@{
    schemaVersion = 1
    album = [ordered]@{
        id = "world-cup-2026"
        name = "World Cup 2026"
        groupCount = 12
        teamCount = 48
        stickersPerTeam = 20
        teamStickerCount = 960
    }
    teams = $catalogTeams
}

$groupsPath = Join-Path $dataDirectory "groups.json"
$catalogPath = Join-Path $dataDirectory "album-catalog.json"

$groupsDocument |
    ConvertTo-Json -Depth 10 |
    Set-Content -Path $groupsPath -Encoding utf8

$catalogDocument |
    ConvertTo-Json -Depth 10 |
    Set-Content -Path $catalogPath -Encoding utf8

Write-Host ""
Write-Host "Datos base creados correctamente." -ForegroundColor Green
Write-Host "Grupos:     $($groups.Count)"
Write-Host "Selecciones: $($catalogTeams.Count)"
Write-Host "Láminas:     $(($catalogTeams.stickers | Measure-Object).Count)"
Write-Host ""
Write-Host $groupsPath
Write-Host $catalogPath
