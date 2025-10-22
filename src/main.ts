import { S3Client } from "bun"
import { getLatestIndexedEra } from "./latest-indexed-era"
import { dot } from "@polkadot-api/descriptors"
import { indexEra, NonRecoverableError } from "./index-era"
import { getClient } from "./get-client"

const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, BUCKET, REGION, CHAIN } = process.env

const s3Client = new S3Client({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  bucket: BUCKET,
  region: REGION,
})

const supportedChains = new Set(["dot", "ksm", "wnd", "pas"])
if (!supportedChains.has(CHAIN!)) throw new Error(`Unsupported chain ${CHAIN}`)
const chain = CHAIN!

const client = getClient(chain)
const api = client.getTypedApi(dot)

let [latestIndexedEra, activeEra] = await Promise.all([
  getLatestIndexedEra(s3Client, chain),
  api.query.Staking.ActiveEra.getValue().then((x) => x!.index),
])

if (Number.isNaN(latestIndexedEra)) {
  const depth = await api.constants.Staking.HistoryDepth()
  latestIndexedEra = activeEra - depth
}

const nMissing = activeEra - latestIndexedEra - 1
console.log(`There are ${nMissing} era(s) that will be indexed`)

for (let i = 1; i <= nMissing; i++) {
  const era = latestIndexedEra + i
  const tryIndex = async (maxConcurrent: number = 40) => {
    try {
      await indexEra(s3Client, client, chain, era, maxConcurrent)
    } catch (e) {
      if (e instanceof NonRecoverableError) throw e

      const nConcurrent = Math.max(3, Math.ceil(maxConcurrent / 2))
      console.error(e)
      console.log(
        `there was an error, retrying with ${nConcurrent} concurrent connections`,
      )
      await new Promise((res) => setTimeout(res, 3_000))
      await tryIndex(nConcurrent)
    }
  }

  console.log(`indexing era: ${era}...`)
  await tryIndex()
}

client.destroy()
console.log("All done!")
