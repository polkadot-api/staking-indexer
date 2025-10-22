interface QueueNode<T> {
  value: T
  next?: QueueNode<T>
}

// undefined is what `peek` and `pop` return to signal that the Queue is empty
type AnythingButUndefined = {} | null
export default class Queue<T extends AnythingButUndefined> {
  private first?: QueueNode<T>
  private last?: QueueNode<T>

  constructor(...vals: T[]) {
    this.push(...vals)
  }

  push(...values: T[]) {
    values.forEach((value) => {
      const nextLast: QueueNode<T> = { value }
      if (this.last === undefined) this.first = this.last = nextLast
      else this.last = this.last.next = nextLast
    })
  }

  pop(): T | undefined {
    const result = this.first?.value
    if (this.first) {
      this.first = this.first.next
      if (!this.first) this.last = undefined
    }
    return result
  }

  peek(): T | undefined {
    return this.first?.value
  }
}
