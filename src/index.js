require("dotenv").config({ quiet: true });

const { readConfig } = require("./config");
const { formatDate, formatYearMonth, iterMonths } = require("./date-utils");
const { buildS3Key, createS3Client, uploadJsonToS3 } = require("./s3-archiver");
const { fetchSimemDataset } = require("./simem-client");

function describePayload(payload) {
  if (Array.isArray(payload)) {
    return `${payload.length} registros`;
  }

  if (payload && typeof payload === "object") {
    return `${Object.keys(payload).length} llaves`;
  }

  return typeof payload;
}

async function main() {
  const config = readConfig();
  const s3Client = config.dryRun ? null : createS3Client(config);
  const failures = [];
  let processed = 0;
  let uploaded = 0;

  console.log(
    `Procesando ${Object.keys(config.datasets).length} datasets entre ` +
      `${formatDate(config.startDate)} y ${formatDate(config.endDate)}.`
  );

  for (const { monthStart, monthEnd } of iterMonths(config.startDate, config.endDate)) {
    console.log(`\n--- ${formatYearMonth(monthStart)} ---`);

    for (const [datasetName, datasetId] of Object.entries(config.datasets)) {
      const periodLabel = `${formatDate(monthStart)} a ${formatDate(monthEnd)}`;
      const key = buildS3Key(config.s3Prefix, datasetName, monthStart, monthEnd);

      try {
        console.log(`Consultando ${datasetName} (${datasetId}) para ${periodLabel}`);

        const { url, payload } = await fetchSimemDataset({
          baseUrl: config.simemBaseUrl,
          datasetId,
          startDate: monthStart,
          endDate: monthEnd,
          parameters: config.requestParameters,
          timeoutMs: config.apiTimeoutMs
        });

        console.log(`JSON recibido desde ${url}. Resumen: ${describePayload(payload)}`);

        if (config.dryRun) {
          console.log(`DRY_RUN=true, no se subio s3://${config.s3Bucket}/${key}`);
        } else {
          await uploadJsonToS3(s3Client, {
            bucket: config.s3Bucket,
            key,
            payload,
            datasetId,
            datasetName,
            startDate: monthStart,
            endDate: monthEnd,
            sourceUrl: url
          });

          uploaded += 1;
          console.log(`Archivo subido a s3://${config.s3Bucket}/${key}`);
        }

        processed += 1;
      } catch (error) {
        const message = `${datasetName} (${datasetId}) ${periodLabel}: ${error.message}`;
        failures.push(message);
        console.error(`Error: ${message}`);
      }
    }
  }

  console.log(
    `\nProceso finalizado. Consultas exitosas: ${processed}. ` +
      `Objetos subidos: ${uploaded}. Errores: ${failures.length}.`
  );

  if (failures.length > 0) {
    console.error("\nResumen de errores:");

    for (const failure of failures) {
      console.error(`- ${failure}`);
    }

    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Fallo la ejecucion: ${error.message}`);
  process.exitCode = 1;
});
