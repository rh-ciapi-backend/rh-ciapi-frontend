const express = require('express');
const { exportarFerias } = require('../services/feriasExportService');

const router = express.Router();

router.post('/exportar', async (req, res) => {
  try {
    const result = await exportarFerias(req.body || {});

    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"; filename*=UTF-8''${encodeURIComponent(result.filename)}`,
    );
    res.status(200).send(result.buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao gerar exportação de férias.';
    const status =
      /nenhum registro/i.test(message) ? 404 :
      /modelo não encontrado/i.test(message) ? 404 :
      /converter pdf/i.test(message) ? 500 :
      /gerar documento/i.test(message) ? 500 : 400;

    res.status(status).json({
      ok: false,
      error: message,
    });
  }
});

module.exports = router;
