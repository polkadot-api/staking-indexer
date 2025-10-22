import type { S3Client } from "bun"

export const getLatestIndexedEra = async (
  s3Client: S3Client,
  chainSymbol: string,
) => {
  const { commonPrefixes } = await s3Client.list({
    prefix: `${chainSymbol}/`,
    delimiter: "/",
  })
  if (!commonPrefixes) return NaN

  return Math.max(
    ...commonPrefixes.map((x) =>
      Number(x.prefix.slice(chainSymbol.length + 1, -1)),
    ),
  )
}
