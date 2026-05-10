const DEFAULT_DATASETS = Object.freeze({
  "Generacion Real": "055A4D",
  "Unidades Generacion": "670221",
  "Aporte Hidricos": "BA1C55",
  "Demanda comercial": "d55202",
  "Demanda Real": "14fabb"
});

function getPopulatedEnv(names) {
  const candidates = Array.isArray(names) ? names : [names];

  for (const name of candidates) {
    const value = process.env[name];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function getRequiredEnv(names) {
  const candidates = Array.isArray(names) ? names : [names];
  const value = getPopulatedEnv(candidates);

  if (!value) {
    throw new Error(`Falta una variable de entorno obligatoria: ${candidates.join(" o ")}`);
  }

  return value;
}

function parseJsonEnv(names, fallbackValue) {
  const candidates = Array.isArray(names) ? names : [names];
  const value = getPopulatedEnv(candidates);

  if (!value) {
    return fallbackValue;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(
      `La variable ${candidates.join(" / ")} debe contener un JSON valido. Detalle: ${error.message}`
    );
  }
}

function parseBooleanEnv(name, fallbackValue = false) {
  const value = getPopulatedEnv(name);

  if (!value) {
    return fallbackValue;
  }

  return value.toLowerCase() === "true";
}

function parseIsoDate(value, envName) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(`${envName} debe tener formato YYYY-MM-DD.`);
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));

  const isValid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isValid) {
    throw new Error(`${envName} no es una fecha valida: ${value}`);
  }

  return date;
}

function normalizeDatasets(rawDatasets) {
  if (!rawDatasets || Array.isArray(rawDatasets) || typeof rawDatasets !== "object") {
    throw new Error("DATASETS_JSON debe ser un objeto JSON con el formato {\"Nombre\":\"datasetId\"}.");
  }

  const entries = Object.entries(rawDatasets).map(([name, id]) => [String(name).trim(), String(id).trim()]);

  if (entries.length === 0) {
    throw new Error("Debe existir al menos un dataset configurado.");
  }

  for (const [name, id] of entries) {
    if (!name || !id) {
      throw new Error("Todos los datasets deben tener nombre e identificador.");
    }
  }

  return Object.fromEntries(entries);
}

function readConfig() {
  const requestParameters = parseJsonEnv("REQUEST_PARAMETERS_JSON", []);
  const apiTimeoutMs = Number(getPopulatedEnv("API_TIMEOUT_MS") || "30000");

  if (!Number.isFinite(apiTimeoutMs) || apiTimeoutMs <= 0) {
    throw new Error("API_TIMEOUT_MS debe ser un numero mayor que 0.");
  }

  const startDate = parseIsoDate(getPopulatedEnv("START_DATE") || "2023-01-01", "START_DATE");
  const endDate = parseIsoDate(getPopulatedEnv("END_DATE") || "2026-05-07", "END_DATE");

  if (startDate > endDate) {
    throw new Error("START_DATE no puede ser mayor que END_DATE.");
  }

  return {
    awsProfile: getPopulatedEnv("AWS_PROFILE"),
    awsRegion: getPopulatedEnv("AWS_REGION") || "us-east-1",
    simemBaseUrl:
      getPopulatedEnv("SIMEM_BASE_URL") || "https://www.simem.co/backend-files/api/datos-publicos",
    startDate,
    endDate,
    datasets: normalizeDatasets(parseJsonEnv("DATASETS_JSON", DEFAULT_DATASETS)),
    requestParameters,
    apiTimeoutMs,
    s3Bucket: getRequiredEnv(["S3_BUCKET_NAME", "S3_BUCKET"]),
    s3Prefix: getPopulatedEnv("S3_PREFIX") || "bronze/simem-data",
    dryRun: parseBooleanEnv("DRY_RUN", false)
  };
}

module.exports = {
  DEFAULT_DATASETS,
  readConfig
};
