const express = require("express");
const { exportarFerias } = require("../services/feriasExportService");

const router = express.Router();

router.get("/exportar", (req, res) => {
  return res.status(405).json({
    ok: false,
    error: "Use POST /api/ferias/exportar para gerar o arquivo de exportação.",
  });
});

router.post("/exportar", async (req, res) => {
  try {
    const payload = req.body && typeof req.body === "object" ? req.body : {};
    const result = await exportarFerias(payload);

    if (!result || !result.buffer) {
      return res.status(500).json({
        ok: false,
        error: "A exportação foi processada, mas nenhum arquivo foi gerado.",
      });
    }

    const filename = result.filename || "ferias_exportacao.docx";
    const contentType =
      result.contentType ||
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader("Content-Length", Buffer.byteLength(result.buffer));

    return res.status(200).send(result.buffer);
  } catch (error) {
    console.error("❌ Erro em POST /api/ferias/exportar:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Falha ao gerar exportação de férias.";

    const normalized = String(message).toLowerCase();

    let status = 400;

    if (
      normalized.includes("nenhum registro") ||
      normalized.includes("não encontrado") ||
      normalized.includes("nao encontrado") ||
      normalized.includes("modelo não encontrado") ||
      normalized.includes("modelo nao encontrado")
    ) {
      status = 404;
    } else if (
      normalized.includes("converter pdf") ||
      normalized.includes("gerar documento") ||
      normalized.includes("erro interno") ||
      normalized.includes("template") ||
      normalized.includes("buffer")
    ) {
      status = 500;
    }

    return res.status(status).json({
      ok: false,
      error: message,
    });
  }
});

module.exports = router;
