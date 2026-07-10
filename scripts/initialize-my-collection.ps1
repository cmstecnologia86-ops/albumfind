$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$dataDirectory = Join-Path $projectRoot "src\data"
$catalogPath = Join-Path $dataDirectory "album-catalog.json"
$collectionPath = Join-Path $dataDirectory "my-collection.json"

$catalog = Get-Content $catalogPath -Raw | ConvertFrom-Json

$ownedByTeam = [ordered]@{
    MEX = @(1, 4, 6, 8, 12, 14, 17, 20)
    KOR = @(1, 3, 5, 9, 10, 14, 15, 18)
    RSA = @(1, 2, 3, 4, 5, 6, 10, 13, 15, 19, 20)
    CZE = @(2, 3, 4, 5, 6, 7, 9, 11, 14, 16, 17)

    CAN = @(1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20)
    BIH = @(3, 4, 8, 9, 10, 11, 12, 15, 16, 17, 20)
    QAT = @(3, 6, 8, 9, 12, 13, 17)
    SUI = @(3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20)

    BRA = @(1, 3, 4, 8, 9, 12, 17, 19)
    MAR = @(2)
    HAI = @(6, 9, 10, 13, 15, 18, 19)
    SCO = @(2, 5, 6, 10, 17, 19)

    USA = @(3, 4, 5, 7, 9, 11, 12, 14, 15, 16, 17, 18, 19, 20)
    PAR = @(4, 8, 12, 13, 19)
    AUS = @(3, 4, 5, 6, 8, 9, 10, 12, 14, 15, 16, 19)
    TUR = @(3, 4, 7, 8, 10, 11, 12, 15, 16, 17, 18)

    GER = @(1, 2, 6, 10, 15, 16, 17, 18, 20)
    CUW = @(4, 5, 8, 12, 15, 18, 19)
    CIV = @(1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 14, 15, 17, 19)
    ECU = @(4, 7, 8, 11, 14, 15, 17, 18)

    NED = @(5, 6, 10, 11, 15, 16, 17, 19)
    JPN = @(2, 7, 8, 9, 10, 11, 15, 16, 19, 20)
    SWE = @(2, 4, 6, 7, 11, 16, 17, 18, 19)
    TUN = @(1, 2, 4, 5, 6, 9, 10, 12, 15, 17, 19)

    BEL = @(4, 5, 6, 9, 10, 13, 14, 15, 19)
    EGY = @(1, 3, 6, 7, 11, 20)
    IRN = @(1, 2, 3, 5, 7, 8, 12, 13, 15, 16, 17, 19)
    NZL = @(1, 4, 8, 12, 14, 20)

    ESP = @(2, 4, 5, 6, 7, 8, 9, 11, 12, 13, 16, 17, 19, 20)
    CPV = @(1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 14, 15, 16, 17, 18, 19)
    KSA = @(1, 4, 5, 8, 12, 13)
    URU = @(4, 8, 10, 12, 14, 15, 16, 17, 18, 19)

    FRA = @(3, 5, 6, 8, 10, 12, 13)
    SEN = @(2, 5, 13, 15, 17, 18, 20)
    IRO = @(1, 2, 4, 9, 14, 15, 18, 19, 20)
    NOR = @(1, 4, 7, 11, 12, 16, 17, 18, 19)

    ARG = @(1, 3, 5, 6, 7, 10, 11, 12, 15, 16, 19, 20)
    ALG = @(1, 2, 3, 4, 6, 7, 10, 11, 16, 20)
    AUT = @(1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 14, 16, 17, 18, 19)
    JOR = @(3, 7, 8, 9, 10, 11, 17)

    POR = @(2, 4, 8)
    COD = @(1, 2, 4, 5, 7, 10, 15, 18, 19, 20)
    UZB = @(2, 3, 6, 7, 10, 15, 17, 19, 20)
    COL = @(2, 6, 10, 11, 15, 17, 19, 20)

    ENG = @(1, 5, 9, 10, 11, 12, 15, 16, 17, 20)
    CRO = @(5, 9, 16)
    GHA = @(1, 3, 7, 11, 16, 17, 19)
    PAN = @(1, 3, 7, 11, 12, 13, 17)
}

$catalogCodes = @($catalog.teams.code)
$collectionCodes = @($ownedByTeam.Keys)

$missingTeams = @($catalogCodes | Where-Object { $_ -notin $collectionCodes })
$unknownTeams = @($collectionCodes | Where-Object { $_ -notin $catalogCodes })

if ($missingTeams.Count -gt 0) {
    throw "Faltan selecciones en la colección: $($missingTeams -join ', ')"
}

if ($unknownTeams.Count -gt 0) {
    throw "Hay selecciones desconocidas: $($unknownTeams -join ', ')"
}

$collectionTeams = foreach ($catalogTeam in $catalog.teams) {
    $teamCode = $catalogTeam.code
    $ownedNumbers = @(
        $ownedByTeam[$teamCode] |
            Sort-Object -Unique
    )

    $invalidNumbers = @(
        $ownedNumbers |
            Where-Object { $_ -lt 1 -or $_ -gt 20 }
    )

    if ($invalidNumbers.Count -gt 0) {
        throw "$teamCode contiene números inválidos: $($invalidNumbers -join ', ')"
    }

    $missingNumbers = @(
        1..20 |
            Where-Object { $_ -notin $ownedNumbers }
    )

    $stickers = foreach ($number in 1..20) {
        $owned = $number -in $ownedNumbers

        [ordered]@{
            code = "{0}-{1:D2}" -f $teamCode, $number
            number = $number
            status = if ($owned) { "owned" } else { "missing" }
            duplicates = 0
        }
    }

    [ordered]@{
        code = $teamCode
        name = $catalogTeam.name
        group = $catalogTeam.group
        ownedCount = $ownedNumbers.Count
        missingCount = $missingNumbers.Count
        ownedNumbers = $ownedNumbers
        missingNumbers = $missingNumbers
        stickers = $stickers
    }
}

$totalOwned = (
    $collectionTeams |
        ForEach-Object { [int]$_["ownedCount"] } |
        Measure-Object -Sum
).Sum

$totalMissing = (
    $collectionTeams |
        ForEach-Object { [int]$_["missingCount"] } |
        Measure-Object -Sum
).Sum

$collectionDocument = [ordered]@{
    schemaVersion = 1
    albumId = $catalog.album.id
    source = "manual-review-of-album-photographs"
    status = "initial-photo-inventory"
    totals = [ordered]@{
        teams = $collectionTeams.Count
        stickers = $totalOwned + $totalMissing
        owned = $totalOwned
        missing = $totalMissing
        duplicates = 0
        completionPercentage = [math]::Round(
            ($totalOwned / ($totalOwned + $totalMissing)) * 100,
            2
        )
    }
    teams = $collectionTeams
}

$collectionDocument |
    ConvertTo-Json -Depth 10 |
    Set-Content -Path $collectionPath -Encoding utf8

Write-Host ""
Write-Host "Colección creada correctamente." -ForegroundColor Green
Write-Host "Selecciones: $($collectionTeams.Count)"
Write-Host "Tengo:       $totalOwned"
Write-Host "Me faltan:   $totalMissing"
Write-Host "Total:       $($totalOwned + $totalMissing)"
Write-Host "Avance:      $($collectionDocument.totals.completionPercentage)%"
Write-Host ""
Write-Host $collectionPath

