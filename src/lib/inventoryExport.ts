export type InventoryExportMode = "missing" | "duplicates";

export type InventoryExportRecord = {
  teamCode: string;
  teamName: string;
  group: string;
  stickerCode: string;
  number: number;
  duplicates: number;
};

type ExportOptions = {
  mode: InventoryExportMode;
  records: InventoryExportRecord[];
  totalUnits: number;
};

function getExportLabel(mode: InventoryExportMode) {
  return mode === "missing" ? "faltantes" : "repetidas";
}

function getExportTitle(mode: InventoryExportMode) {
  return mode === "missing"
    ? "Láminas faltantes"
    : "Láminas repetidas";
}

function getDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string | number) {
  const normalizedValue = String(value).replaceAll('"', '""');

  return `"${normalizedValue}"`;
}

export function exportInventoryCsv({
  mode,
  records,
  totalUnits,
}: ExportOptions) {
  const headers =
    mode === "missing"
      ? [
          "Código",
          "Selección",
          "Código selección",
          "Grupo",
          "Número",
          "Estado",
        ]
      : [
          "Código",
          "Selección",
          "Código selección",
          "Grupo",
          "Número",
          "Repetidas",
        ];

  const rows = records.map((record) => {
    if (mode === "missing") {
      return [
        record.stickerCode,
        record.teamName,
        record.teamCode,
        record.group,
        record.number,
        "Faltante",
      ];
    }

    return [
      record.stickerCode,
      record.teamName,
      record.teamCode,
      record.group,
      record.number,
      record.duplicates,
    ];
  });

  const summaryRows = [
    [],
    ["Resumen"],
    ["Tipo", getExportTitle(mode)],
    ["Códigos", records.length],
    [
      mode === "missing"
        ? "Láminas pendientes"
        : "Unidades repetidas",
      totalUnits,
    ],
    ["Fecha de exportación", new Date().toLocaleString("es-CL")],
  ];

  const csvContent = [headers, ...rows, ...summaryRows]
    .map((row) => row.map(escapeCsvValue).join(";"))
    .join("\r\n");

  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: "text/csv;charset=utf-8;",
  });

  downloadBlob(
    blob,
    `albumfind-${getExportLabel(mode)}-${getDateStamp()}.csv`,
  );
}

export async function exportInventoryPdf({
  mode,
  records,
  totalUnits,
}: ExportOptions) {
  const { jsPDF } = await import("jspdf");

  const document = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();

  const marginX = 10;
  const topContentY = 42;
  const footerY = pageHeight - 8;
  const bottomLimit = pageHeight - 16;

  const columnGap = 5;
  const columnCount = 3;
  const columnWidth =
    (pageWidth - marginX * 2 - columnGap * (columnCount - 1)) /
    columnCount;

  let pageNumber = 1;
  let currentY = topContentY;

  type TeamGroup = {
    teamCode: string;
    teamName: string;
    group: string;
    records: InventoryExportRecord[];
  };

  const groupedTeams = Array.from(
    records.reduce((map, record) => {
      const current = map.get(record.teamCode);

      if (current) {
        current.records.push(record);
        return map;
      }

      map.set(record.teamCode, {
        teamCode: record.teamCode,
        teamName: record.teamName,
        group: record.group,
        records: [record],
      });

      return map;
    }, new Map<string, TeamGroup>()),
  )
    .map(([, team]) => team)
    .sort((first, second) => {
      const groupComparison = first.group.localeCompare(
        second.group,
        "es",
      );

      if (groupComparison !== 0) {
        return groupComparison;
      }

      return first.teamName.localeCompare(second.teamName, "es");
    });

  const flagDataByTeam = new Map<string, string>();

  async function loadFlag(teamCode: string) {
    try {
      const response = await fetch(`/flags/${teamCode}.png`);

      if (!response.ok) {
        return;
      }

      const blob = await response.blob();

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);

        reader.readAsDataURL(blob);
      });

      flagDataByTeam.set(teamCode, dataUrl);
    } catch {
      // El PDF continúa sin bandera si una imagen no puede cargarse.
    }
  }

  await Promise.all(
    groupedTeams.map((team) => loadFlag(team.teamCode)),
  );
  function drawPageHeader() {
    document.setFillColor(16, 20, 38);
    document.rect(0, 0, pageWidth, 31, "F");

    document.setTextColor(201, 255, 63);
    document.setFont("helvetica", "bold");
    document.setFontSize(10);
    document.text("ALBUMFIND", marginX, 10);

    document.setTextColor(255, 255, 255);
    document.setFontSize(18);
    document.text(getExportTitle(mode), marginX, 20);

    document.setTextColor(188, 192, 207);
    document.setFont("helvetica", "normal");
    document.setFontSize(8);

    document.text(
      `${records.length} códigos · ${
        mode === "missing"
          ? `${totalUnits} láminas pendientes`
          : `${totalUnits} unidades repetidas`
      } · ${groupedTeams.length} selecciones`,
      marginX,
      27,
    );

    document.text(
      new Date().toLocaleString("es-CL"),
      pageWidth - marginX,
      27,
      {
        align: "right",
      },
    );
  }

  function drawPageFooter() {
    document.setDrawColor(220, 223, 231);
    document.line(
      marginX,
      pageHeight - 13,
      pageWidth - marginX,
      pageHeight - 13,
    );

    document.setTextColor(120, 124, 138);
    document.setFont("helvetica", "normal");
    document.setFontSize(7.5);

    document.text(
      "ALBUMFIND · Mundial 2026",
      marginX,
      footerY,
    );

    document.text(
      `Página ${pageNumber}`,
      pageWidth - marginX,
      footerY,
      {
        align: "right",
      },
    );
  }

  function addPage() {
    drawPageFooter();
    document.addPage();
    pageNumber += 1;
    drawPageHeader();
    currentY = topContentY;
  }

  function getTeamCodes(team: TeamGroup) {
    return team.records
      .sort((first, second) => first.number - second.number)
      .map((record) => {
        if (mode === "duplicates") {
          return `${record.stickerCode} ×${record.duplicates}`;
        }

        return record.stickerCode;
      })
      .join(", ");
  }

  function getCardHeight(team: TeamGroup) {
    const codes = getTeamCodes(team);

    const lines = document.splitTextToSize(
      codes,
      columnWidth - 10,
    );

    return Math.max(29, 22 + lines.length * 4.3);
  }

  function drawTeamCard(
    team: TeamGroup,
    x: number,
    y: number,
    height: number,
  ) {
    document.setFillColor(247, 248, 251);
    document.setDrawColor(225, 228, 236);

    document.roundedRect(
      x,
      y,
      columnWidth,
      height,
      3,
      3,
      "FD",
    );

    document.setFillColor(118, 87, 255);

    document.roundedRect(
      x,
      y,
      columnWidth,
      13,
      3,
      3,
      "F",
    );

    document.setTextColor(255, 255, 255);
    document.setFont("helvetica", "bold");
    document.setFontSize(9.5);

    const flagData = flagDataByTeam.get(team.teamCode);
    const titleStartX = flagData ? x + 15 : x + 4;

    if (flagData) {
      document.setFillColor(255, 255, 255);
      document.roundedRect(
        x + 4,
        y + 3.2,
        8.5,
        6.2,
        1,
        1,
        "F",
      );

      document.addImage(
        flagData,
        "PNG",
        x + 4.5,
        y + 3.6,
        7.5,
        5.2,
      );
    }

    const teamTitle = document.splitTextToSize(
      team.teamName,
      columnWidth - (flagData ? 45 : 34),
    )[0];

    document.text(teamTitle, titleStartX, y + 6);

    document.setFontSize(7.5);
    document.text(
      `${team.teamCode} · Grupo ${team.group}`,
      titleStartX,
      y + 10.5,
    );

    const teamUnits =
      mode === "missing"
        ? team.records.length
        : team.records.reduce(
            (total, record) => total + record.duplicates,
            0,
          );

    document.setFontSize(8);
    document.text(
      mode === "missing"
        ? `${teamUnits} faltantes`
        : `${teamUnits} repetidas`,
      x + columnWidth - 4,
      y + 8,
      {
        align: "right",
      },
    );

    document.setTextColor(42, 46, 61);
    document.setFont("helvetica", "normal");
    document.setFontSize(8);

    const codeLines = document.splitTextToSize(
      getTeamCodes(team),
      columnWidth - 10,
    );

    document.text(
      codeLines,
      x + 5,
      y + 19,
      {
        lineHeightFactor: 1.35,
      },
    );
  }

  drawPageHeader();

  if (groupedTeams.length === 0) {
    document.setTextColor(90, 94, 110);
    document.setFont("helvetica", "normal");
    document.setFontSize(12);

    document.text(
      "No hay registros para exportar con los filtros actuales.",
      pageWidth / 2,
      pageHeight / 2,
      {
        align: "center",
      },
    );

    drawPageFooter();

    document.save(
      `albumfind-${getExportLabel(mode)}-${getDateStamp()}.pdf`,
    );

    return;
  }

  for (
    let teamIndex = 0;
    teamIndex < groupedTeams.length;
    teamIndex += columnCount
  ) {
    const rowTeams = groupedTeams.slice(
      teamIndex,
      teamIndex + columnCount,
    );

    const rowHeight = Math.max(
      ...rowTeams.map(getCardHeight),
    );

    if (currentY + rowHeight > bottomLimit) {
      addPage();
    }

    rowTeams.forEach((team, columnIndex) => {
      const x =
        marginX +
        columnIndex * (columnWidth + columnGap);

      drawTeamCard(
        team,
        x,
        currentY,
        rowHeight,
      );
    });

    currentY += rowHeight + 5;
  }

  drawPageFooter();

  document.save(
    `albumfind-${getExportLabel(mode)}-${getDateStamp()}.pdf`,
  );
}

