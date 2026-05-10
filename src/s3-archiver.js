const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");

const { formatDate, slugify } = require("./date-utils");

function normalizePrefix(prefix) {
  if (!prefix) {
    return "";
  }

  return prefix.replace(/^\/+|\/+$/g, "");
}

function createS3Client(config) {
  return new S3Client({
    region: config.awsRegion,
    credentials: config.awsProfile ? fromIni({ profile: config.awsProfile }) : undefined
  });
}

function buildS3Key(prefix, datasetName, startDate, endDate) {
  const year = String(startDate.getUTCFullYear());
  const month = String(startDate.getUTCMonth() + 1).padStart(2, "0");
  const datasetSlug = slugify(datasetName);
  const normalizedPrefix = normalizePrefix(prefix);
  const prefixSegment = normalizedPrefix ? `${normalizedPrefix}/` : "";
  const period = `${formatDate(startDate)}_${formatDate(endDate)}`;

  return `${prefixSegment}${year}/${month}/${datasetSlug}-${period}.json`;
}

async function uploadJsonToS3(client, options) {
  const command = new PutObjectCommand({
    Bucket: options.bucket,
    Key: options.key,
    Body: JSON.stringify(options.payload, null, 2),
    ContentType: "application/json",
    Metadata: {
      dataset_id: options.datasetId,
      dataset_slug: slugify(options.datasetName),
      start_date: formatDate(options.startDate),
      end_date: formatDate(options.endDate),
      source: new URL(options.sourceUrl).hostname,
      fetched_at: new Date().toISOString()
    }
  });

  await client.send(command);
}

module.exports = {
  buildS3Key,
  createS3Client,
  uploadJsonToS3
};
