import Queue from "./queue"

export const getBatcher = (maxConcurrent: number) => {
  let nActive = 0
  const queue = new Queue<() => void>()

  return async <T>(getPromise: () => Promise<T>): Promise<T> => {
    if (nActive === maxConcurrent)
      await new Promise<void>((res) => queue.push(res))

    nActive++
    try {
      return await getPromise()
    } finally {
      nActive--
      queue.pop()?.()
    }
  }
}
