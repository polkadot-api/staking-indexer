import { createStakingSdk } from "@polkadot-api/sdk-staking"
import {
  AccountId,
  compact,
  enhanceCodec,
  Struct,
  Tuple,
  Vector,
  type CodecType,
} from "@polkadot-api/substrate-bindings"
import type { Codec, PolkadotClient, SS58String } from "polkadot-api"
import { getBatcher } from "./utils"
import type { S3Client } from "bun"

const nominatorReward = Struct({
  reward: compact,
  bond: compact,
  commission: compact,
})

type NominatorReward = CodecType<typeof nominatorReward>
type ByValidator = Record<SS58String, NominatorReward>

const byValidator: Codec<ByValidator> = enhanceCodec(
  Vector(Tuple(AccountId(), nominatorReward)),
  Object.entries,
  Object.fromEntries,
)

const [nominatorsRewardEnc] = Struct({
  total: compact,
  totalCommission: compact,
  activeBond: compact,
  byValidator,
})

export class NonRecoverableError extends Error {
  constructor() {
    super()
    this.name = "NonRecoverableError"
  }
}

const withNonRecoverableError = (e: any) => {
  console.error(e)
  throw new NonRecoverableError()
}

export const indexEra = async (
  s3Client: S3Client,
  client: PolkadotClient,
  chainSymbol: string,
  era: number,
  maxConcurrentWrites: number,
) => {
  const batch = getBatcher(maxConcurrentWrites)
  const staking = createStakingSdk(client)

  const nominators = await staking
    .getActiveNominators(era)
    .catch(withNonRecoverableError)
  await Promise.all(
    nominators.map(async (nominator) => {
      const data = nominatorsRewardEnc(
        await staking
          .getNominatorRewards(nominator, era)
          .catch(withNonRecoverableError),
      )

      await batch(() =>
        s3Client
          .file(`${chainSymbol}/${era}/${nominator}`, {
            type: "application/octet-stream",
            acl: "public-read",
          })
          .write(data),
      )
    }),
  )
}
