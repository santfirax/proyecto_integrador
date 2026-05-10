const { formatDate } = require("./date-utils");

function buildSimemUrl(baseUrl, datasetId, startDate, endDate) {
  const url = new URL(baseUrl);

  url.searchParams.set("datasetId", datasetId);
  url.searchParams.set("startDate", formatDate(startDate));
  url.searchParams.set("endDate", formatDate(endDate));

  return url;
}

async function fetchSimemDataset(options) {
  const url = buildSimemUrl(options.baseUrl, options.datasetId, options.startDate, options.endDate);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(options.parameters),
    signal: AbortSignal.timeout(options.timeoutMs)
  });

  const rawBody = await response.text();

  let payload;

  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    throw new Error(
      `SIMEM devolvio una respuesta no JSON para ${options.datasetId}. ` +
        `Status ${response.status}. Primeros 300 caracteres: ${rawBody.slice(0, 300)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `SIMEM respondio con HTTP ${response.status} para ${options.datasetId}. ` +
        `Respuesta: ${JSON.stringify(payload).slice(0, 500)}`
    );
  }

  return {
    url: url.toString(),
    payload
  };
}

module.exports = {
  fetchSimemDataset
};
