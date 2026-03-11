const fs = require("fs");
const path = require("path");

function resolveBuilderExport(builderModule) {
  if (!builderModule) return null;

  if (typeof builderModule === "function") {
    return builderModule;
  }

  const candidates = [
    builderModule.exportarFerias,
    builderModule.exportarFeriasTemplate,
    builderModule.buildFeriasDocument,
    builderModule.buildFeriasDoc,
    builderModule.buildFeriasDocx,
    builderModule.gerarDocumentoFerias,
    builderModule.gerarFeriasDoc,
    builderModule.gerarFeriasDocx,
    builderModule.default,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "function") {
      return candidate;
    }
  }

  return null;
}

function getSafeFileName(result) {
  const fallback = `ferias_export_${Date.now()}.doc`;

  const raw =
    result?.fileName ||
    result?.filename ||
    result?.name ||
    fallback;

  const fileName = String(raw).trim();
  return fileName || fallback;
}

function getSafeContentType(result) {
  return (
    result?.contentType ||
    "application/msword"
  );
}

function normalizePayload(req) {
  return {
    body: req?.body || {},
    query: req?.query || {},
    params: req?.params || {},
    headers: req?.headers || {},
    method: req?.method || "POST",
    originalUrl: req?.originalUrl || "",
  };
}

function sendBufferDownload(res, buffer, fileName, contentType) {
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Content-Length", buffer.length);
  return res.send(buffer);
}

async function exportarFerias(req, res) {
  let builderModule;
  let builderFn;

  try {
    builderModule = require("../utils/feriasTemplateBuilder");
  } catch (error) {
    console.error(
      "[feriasExportService] erro ao carregar ../utils/feriasTemplateBuilder:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: "Não foi possível carregar o gerador de template de férias",
      details: error?.message || String(error),
    });
  }

  builderFn = resolveBuilderExport(builderModule);

  if (typeof builderFn !== "function") {
    return res.status(500).json({
      ok: false,
      error: "O módulo feriasTemplateBuilder não exporta uma função válida",
      details:
        "Esperado: module.exports = exportarFeriasTemplate ou um objeto com função exportadora",
    });
  }

  try {
    const payload = normalizePayload(req);
    const result = await builderFn(payload);

    if (!result) {
      return res.status(500).json({
        ok: false,
        error: "O gerador de férias não retornou nenhum resultado",
      });
    }

    if (Buffer.isBuffer(result)) {
      const fileName = `ferias_export_${Date.now()}.doc`;
      const contentType = "application/msword";
      return sendBufferDownload(res, result, fileName, contentType);
    }

    if (result.buffer && Buffer.isBuffer(result.buffer)) {
      const fileName = getSafeFileName(result);
      const contentType = getSafeContentType(result);
      return sendBufferDownload(res, result.buffer, fileName, contentType);
    }

    if (result.filePath && typeof result.filePath === "string") {
      const absolutePath = path.resolve(result.filePath);

      if (!fs.existsSync(absolutePath)) {
        return res.status(500).json({
          ok: false,
          error: "O arquivo exportado foi informado, mas não existe no disco",
          details: absolutePath,
        });
      }

      const fileName = getSafeFileName({
        fileName: result.fileName || path.basename(absolutePath),
      });

      return res.download(absolutePath, fileName);
    }

    if (result.ok && result.downloadUrl) {
      return res.status(200).json(result);
    }

    return res.status(500).json({
      ok: false,
      error: "Formato de retorno do builder não suportado",
      details:
        "Esperado: Buffer, { buffer, fileName, contentType }, { filePath }, ou objeto com downloadUrl",
    });
  } catch (error) {
    console.error("[feriasExportService] erro na exportação:", error);

    return res.status(500).json({
      ok: false,
      error: "Falha ao gerar exportação de férias",
      details: error?.message || String(error),
      stack: process.env.NODE_ENV === "production" ? undefined : error?.stack,
    });
  }
}

module.exports = { exportarFerias };
